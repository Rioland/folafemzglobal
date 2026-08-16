import { settings } from './content';

/* --------------------------------------------------------------------------
   Enquiry routing
   --------------------------------------------------------------------------
   This site is a static export: there is no server, no database and no booking
   table. Every enquiry becomes a pre-composed message the visitor sends from
   their own WhatsApp or mail client.

   The trade that comes with it: nothing is recorded on your side until the
   customer actually presses send in the app that opens. The Laravel build wrote
   a booking row first and handed off to WhatsApp second, so a half-finished
   enquiry still reached the dashboard. Here it does not. See README.md for the
   two ways to add capture back if you want it.
   -------------------------------------------------------------------------- */

export type Enquiry = {
  name?: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  service?: string;
  pickupDate?: string;
  pickupLocation?: string;
  destination?: string;
  days?: string;
  notes?: string;
  /** Page the enquiry came from, so you can see what they were reading. */
  source?: string;
};

const LABELS: [keyof Enquiry, string][] = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['vehicle', 'Vehicle'],
  ['service', 'Service'],
  ['pickupDate', 'Pickup date'],
  ['pickupLocation', 'Pickup location'],
  ['destination', 'Destination'],
  ['days', 'Number of days'],
  ['notes', 'Notes'],
];

/** Human-readable enquiry body, shared by both WhatsApp and email. */
export function composeMessage(enquiry: Enquiry): string {
  const lines = LABELS
    .filter(([key]) => {
      const v = enquiry[key];
      return typeof v === 'string' && v.trim() !== '';
    })
    .map(([key, label]) => `${label}: ${String(enquiry[key]).trim()}`);

  const body = ['Hello, I would like to make a booking.', '', ...lines];

  if (enquiry.source) {
    body.push('', `Enquiry from: ${enquiry.source}`);
  }

  return body.join('\n');
}

export function whatsappHref(enquiry: Enquiry): string {
  const number = settings.whatsapp.replace(/\D+/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(composeMessage(enquiry))}`;
}

export function mailtoHref(enquiry: Enquiry): string {
  const subject = enquiry.vehicle
    ? `Booking enquiry — ${enquiry.vehicle}`
    : enquiry.service
      ? `Booking enquiry — ${enquiry.service}`
      : 'Booking enquiry';

  const params = new URLSearchParams({
    subject,
    body: composeMessage(enquiry),
  });

  // URLSearchParams encodes spaces as "+", which mail clients render literally
  // in the body. Percent-encoding is what mailto: actually expects.
  return `mailto:${settings.email}?${params.toString().replace(/\+/g, '%20')}`;
}

/** Plain "message us" link with no form behind it. */
export function whatsappDirect(text?: string): string {
  const number = settings.whatsapp.replace(/\D+/g, '');
  const message = text ?? `Hello ${settings.siteName}, I would like to make an enquiry.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Nigerian numbers are written locally as 0703…, which only dials from inside
 * Nigeria. Convert the leading 0 to +234 so the link works for anyone abroad,
 * while the number stays in its familiar local form on screen.
 */
export function telHref(number: string): string {
  const digits = number.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `tel:${digits}`;
  if (digits.startsWith('0')) return `tel:+234${digits.slice(1)}`;
  if (digits.startsWith('234')) return `tel:+${digits}`;
  return `tel:${digits}`;
}

/** Main number first, then any alternates, de-duplicated. */
export const allPhones = [settings.phone, ...settings.phoneAlt].filter(
  (n, i, arr) => n && arr.indexOf(n) === i
);

export const emailHref = `mailto:${settings.email}`;
