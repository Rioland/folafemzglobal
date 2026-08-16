/* --------------------------------------------------------------------------
   Outbound mail
   --------------------------------------------------------------------------
   Two transports, chosen at runtime:

   1. Hostinger Mail API (preferred) — HTTP + bearer token. No SMTP ports, no
      mailbox password on the server, and the token is revocable from hPanel
      without changing the mailbox itself. Sent mail lands in the Sent folder.

   2. SMTP via nodemailer (fallback) — used only when no API key is configured.
      Its one advantage is Reply-To, which the API has no field for.

   The API's send body accepts: to, cc, bcc, subject, text, html, displayName,
   attachments, inReplyTo, forwardOf. There is deliberately no replyTo — see
   `REPLY_TO_NOTE` below for how that is worked around.
   -------------------------------------------------------------------------- */

const API_BASE = 'https://api.mail.hostinger.com';

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Used by SMTP only; the API has no Reply-To field. */
  replyTo?: string;
  displayName?: string;
};

export class MailError extends Error {
  constructor(message: string, readonly status?: number, readonly detail?: string) {
    super(message);
    this.name = 'MailError';
  }
}

/* -------------------------------------------------------------------------- */
/* Hostinger Mail API                                                          */
/* -------------------------------------------------------------------------- */

let cachedMailbox: { id: string; address: string } | null = null;

/**
 * Resolve the mailbox to send as. Prefers the explicit env var; otherwise asks
 * the API once and memoises for the lifetime of the lambda instance.
 */
async function resolveMailbox(token: string): Promise<{ id: string; address: string }> {
  const envId = process.env.HOSTINGER_MAILBOX_ID;
  const envAddress = process.env.EMAIL_USER;

  if (envId && envAddress) return { id: envId, address: envAddress };
  if (cachedMailbox) return cachedMailbox;

  const res = await fetch(`${API_BASE}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new MailError('Could not identify the sending mailbox.', res.status, await safeText(res));
  }

  const body = (await res.json()) as {
    data?: { mailboxes?: { resourceId: string; address: string }[] };
  };

  const box = body.data?.mailboxes?.[0];
  if (!box) throw new MailError('The API token has no mailbox attached to it.');

  cachedMailbox = { id: box.resourceId, address: box.address };
  return cachedMailbox;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 400);
  } catch {
    return '';
  }
}

async function sendViaApi(mail: Mail, token: string): Promise<'api'> {
  const mailbox = await resolveMailbox(token);

  const res = await fetch(
    `${API_BASE}/api/v1/mailboxes/${encodeURIComponent(mailbox.id)}/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        displayName: mail.displayName ?? 'Website enquiry',
      }),
      cache: 'no-store',
    }
  );

  // Documented success is 204 No Content — there is no body to parse.
  if (res.status === 204 || res.ok) return 'api';

  throw new MailError(
    `Hostinger Mail API rejected the message (${res.status}).`,
    res.status,
    await safeText(res)
  );
}

/* -------------------------------------------------------------------------- */
/* SMTP fallback                                                               */
/* -------------------------------------------------------------------------- */

async function sendViaSmtp(mail: Mail): Promise<'smtp'> {
  const { EMAIL_USER, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT } = process.env;

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new MailError('No mail transport is configured.');
  }

  // Imported lazily so the dependency is only loaded on the fallback path.
  const nodemailer = (await import('nodemailer')).default;
  const port = Number(SMTP_PORT ?? 465);

  const transport = nodemailer.createTransport({
    host: SMTP_HOST ?? 'smtp.hostinger.com',
    port,
    secure: port === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });

  await transport.sendMail({
    from: `"${mail.displayName ?? 'Website enquiry'}" <${EMAIL_USER}>`,
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return 'smtp';
}

/* -------------------------------------------------------------------------- */

/**
 * Send, preferring the API. Returns which transport carried the message so the
 * caller can log it.
 */
export async function sendMail(mail: Mail): Promise<'api' | 'smtp'> {
  const token = process.env.HOSTINGER_API_KEY;

  if (token) return sendViaApi(mail, token);
  return sendViaSmtp(mail);
}

/** Where the enquiry should land. */
export function inboxAddress(): string | undefined {
  return process.env.EMAIL_TO || process.env.EMAIL_USER;
}

/**
 * The API cannot set Reply-To, so the customer's own contact details are
 * repeated at the top of every enquiry body. Hitting Reply in the mailbox
 * replies to the mailbox itself, which is why the details must be in the text.
 */
export const REPLY_TO_NOTE = true;
