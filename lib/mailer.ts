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

   Where the enquiry goes, and the SMTP account, come from the `mail_settings`
   row that staff edit in the admin dashboard. The Netlify environment
   variables (EMAIL_TO, EMAIL_USER, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT) are
   the fallback while that row is empty, so nothing changes until someone
   fills it in. The row is read with the service-role key because it holds a
   password and is closed to the anonymous key.
   -------------------------------------------------------------------------- */

import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://api.mail.hostinger.com';

export type SmtpAccount = { host: string; port: number; user: string; pass: string };

export type MailConfig = {
  /** Inbox the enquiry lands in. Empty when nothing is configured anywhere. */
  to: string;
  smtp: SmtpAccount | null;
  fromName: string;
  apiToken?: string;
};

type MailSettingsRow = {
  to_address: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
};

async function readMailSettings(): Promise<MailSettingsRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db
      .from('mail_settings')
      .select('to_address, smtp_host, smtp_port, smtp_user, smtp_password, from_name')
      .eq('id', 1)
      .maybeSingle<MailSettingsRow>();

    if (error) {
      console.error('[mail] could not read mail_settings:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[mail] could not read mail_settings:', err);
    return null;
  }
}

/**
 * Resolve the mail configuration for this send. The dashboard's row wins
 * field by field for the recipient; the SMTP account is taken whole from
 * whichever source has all three of host, user and password, dashboard first,
 * so a half-filled form never pairs one source's user with the other's password.
 */
export async function getMailConfig(): Promise<MailConfig> {
  const row = await readMailSettings();
  const env = process.env;

  const to = row?.to_address?.trim() || env.EMAIL_TO || env.EMAIL_USER || '';

  let smtp: SmtpAccount | null = null;
  if (row?.smtp_host?.trim() && row.smtp_user?.trim() && row.smtp_password) {
    smtp = {
      host: row.smtp_host.trim(),
      port: Number(row.smtp_port) || 465,
      user: row.smtp_user.trim(),
      pass: row.smtp_password,
    };
  } else if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
    smtp = {
      host: env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(env.SMTP_PORT ?? 465),
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    };
  }

  return {
    to,
    smtp,
    fromName: row?.from_name?.trim() || 'Website enquiry',
    apiToken: env.HOSTINGER_API_KEY || undefined,
  };
}

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

async function sendViaSmtp(mail: Mail, account: SmtpAccount | null): Promise<'smtp'> {
  if (!account) throw new MailError('No mail transport is configured.');

  // Imported lazily so the dependency is only loaded on the fallback path.
  const nodemailer = (await import('nodemailer')).default;

  const transport = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.port === 465,
    auth: { user: account.user, pass: account.pass },
  });

  await transport.sendMail({
    from: `"${mail.displayName ?? 'Website enquiry'}" <${account.user}>`,
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
export async function sendMail(mail: Mail, config: MailConfig): Promise<'api' | 'smtp'> {
  const withName = { ...mail, displayName: mail.displayName ?? config.fromName };

  if (config.apiToken) return sendViaApi(withName, config.apiToken);
  return sendViaSmtp(withName, config.smtp);
}

/**
 * The API cannot set Reply-To, so the customer's own contact details are
 * repeated at the top of every enquiry body. Hitting Reply in the mailbox
 * replies to the mailbox itself, which is why the details must be in the text.
 */
export const REPLY_TO_NOTE = true;
