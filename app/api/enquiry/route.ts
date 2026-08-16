import { NextResponse } from 'next/server';
import { composeMessage, type Enquiry } from '@/lib/enquiry';
import { MailError, inboxAddress, sendMail } from '@/lib/mailer';

/* --------------------------------------------------------------------------
   Enquiry endpoint
   --------------------------------------------------------------------------
   Receives a booking enquiry and emails it to the business inbox via the
   Hostinger Mail API, falling back to SMTP when no API token is configured.
   Node runtime: the SMTP fallback opens a TCP connection, which Edge cannot.
   -------------------------------------------------------------------------- */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIELD_LIMITS: Record<string, number> = {
  name: 120, phone: 40, email: 160, vehicle: 120, service: 120,
  pickupDate: 40, pickupLocation: 160, destination: 160, days: 10, notes: 2000,
  source: 200,
};

/** Header injection guard: CR/LF in a header value can forge extra headers. */
const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ').trim();

function clean(body: Record<string, unknown>): Enquiry {
  const out: Record<string, string> = {};

  for (const [key, max] of Object.entries(FIELD_LIMITS)) {
    const raw = body[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim().slice(0, max);
    if (value) out[key] = value;
  }

  return out as Enquiry;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  // Honeypot. Real people never fill a hidden field; bots fill everything.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const enquiry = clean(body);

  if (!enquiry.name || !enquiry.phone) {
    return NextResponse.json(
      { error: 'Please include your name and phone number.' },
      { status: 422 }
    );
  }

  const to = inboxAddress();

  if (!to || (!process.env.HOSTINGER_API_KEY && !process.env.EMAIL_PASSWORD)) {
    // Configuration fault, not the visitor's. Say so plainly and log it, rather
    // than reporting a success the business will never see.
    console.error('[enquiry] no mail transport configured');
    return NextResponse.json(
      { error: 'Email is not configured on the server. Please use WhatsApp.' },
      { status: 503 }
    );
  }

  const who = [enquiry.name, enquiry.phone].filter(Boolean).join(' · ');

  const subject = enquiry.vehicle
    ? `Booking enquiry — ${enquiry.vehicle} — ${who}`
    : enquiry.service
      ? `Booking enquiry — ${enquiry.service} — ${who}`
      : `Booking enquiry — ${who}`;

  const text = composeMessage(enquiry);
  const escape = (s: string) =>
    s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

  // The customer's own contact details lead the message. The Mail API has no
  // Reply-To field, so hitting Reply goes to this mailbox — the details have to
  // be in the body to be reachable.
  const contactLine = [
    enquiry.phone ? `Call: ${enquiry.phone}` : null,
    enquiry.email ? `Email: ${enquiry.email}` : null,
  ]
    .filter(Boolean)
    .join('   ');

  const html = `
    <div style="font:15px/1.6 system-ui,sans-serif;color:#0c1627">
      <p style="margin:0 0 4px;font-weight:700;font-size:17px">${escape(enquiry.name)}</p>
      <p style="margin:0 0 16px">
        ${enquiry.phone ? `<a href="tel:${escape(enquiry.phone)}">${escape(enquiry.phone)}</a>` : ''}
        ${enquiry.email ? ` &nbsp;·&nbsp; <a href="mailto:${escape(enquiry.email)}">${escape(enquiry.email)}</a>` : ''}
      </p>
      <pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap;background:#f6f0e1;
                  border-left:3px solid #d4a94e;padding:14px;margin:0">${escape(text)}</pre>
    </div>`;

  try {
    const transport = await sendMail({
      to,
      subject: oneLine(subject),
      text: contactLine ? `${contactLine}\n\n${text}` : text,
      html,
      replyTo: enquiry.email ? oneLine(enquiry.email) : undefined,
    });
    console.log(`[enquiry] sent via ${transport}`);
  } catch (error) {
    if (error instanceof MailError) {
      console.error(`[enquiry] ${error.message}`, error.status ?? '', error.detail ?? '');
    } else {
      console.error('[enquiry] send failed:', error);
    }
    return NextResponse.json(
      { error: 'We could not send that. Please try WhatsApp instead.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
