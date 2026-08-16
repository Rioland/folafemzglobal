'use client';

import { useMemo, useState } from 'react';
import { vehicles, services } from '@/lib/content';
import { composeMessage, mailtoHref, whatsappHref, type Enquiry } from '@/lib/enquiry';

type Props = {
  /** Preselect a vehicle, e.g. from a fleet card. */
  vehicle?: string;
  /** Preselect a service, e.g. from a location landing page. */
  service?: string;
  /** Page the enquiry came from; sent along so you know what they were reading. */
  source?: string;
  compact?: boolean;
};

const REQUIRED: (keyof Enquiry)[] = ['name', 'phone'];

export default function BookingForm({ vehicle, service, source, compact }: Props) {
  const [form, setForm] = useState<Enquiry>({
    name: '',
    phone: '',
    email: '',
    vehicle: vehicle ?? '',
    service: service ?? '',
    pickupDate: '',
    pickupLocation: '',
    days: '',
    notes: '',
  });

  const [touched, setTouched] = useState(false);

  const enquiry = useMemo<Enquiry>(() => ({ ...form, source }), [form, source]);

  const missing = REQUIRED.filter((k) => !String(form[k] ?? '').trim());
  const valid = missing.length === 0;

  const set = (key: keyof Enquiry) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Anchors, not form submits: each opens the visitor's own app with the
  // message already written. Guarded so an incomplete enquiry cannot be sent.
  const send = (href: string) => (e: React.MouseEvent) => {
    if (!valid) {
      e.preventDefault();
      setTouched(true);
    }
  };

  const err = (key: keyof Enquiry) =>
    touched && REQUIRED.includes(key) && !String(form[key] ?? '').trim();

  return (
    <div className="bookingForm">
      <div className={compact ? 'field' : 'field field--row'}>
        <div>
          <label htmlFor="bf-name">Your name *</label>
          <input
            id="bf-name"
            className="input"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Adebayo Johnson"
            aria-invalid={err('name')}
            required
          />
          {err('name') && <p className="fieldError">Please tell us your name.</p>}
        </div>
        <div>
          <label htmlFor="bf-phone">Phone number *</label>
          <input
            id="bf-phone"
            className="input"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="e.g. 0803 000 0000"
            aria-invalid={err('phone')}
            required
          />
          {err('phone') && <p className="fieldError">We need a number to reach you on.</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="bf-email">Email (optional)</label>
        <input
          id="bf-email"
          className="input"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
        />
      </div>

      <div className="field field--row">
        <div>
          <label htmlFor="bf-vehicle">Vehicle</label>
          <select id="bf-vehicle" className="select" value={form.vehicle} onChange={set('vehicle')}>
            <option value="">Not sure yet</option>
            {vehicles.map((v) => (
              <option key={v.slug} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bf-service">Service</label>
          <select id="bf-service" className="select" value={form.service} onChange={set('service')}>
            <option value="">General enquiry</option>
            {services.map((s) => (
              <option key={s.slug} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field field--row">
        <div>
          <label htmlFor="bf-date">Pickup date</label>
          <input id="bf-date" className="input" type="date" value={form.pickupDate} onChange={set('pickupDate')} />
        </div>
        <div>
          <label htmlFor="bf-days">Number of days</label>
          <input
            id="bf-days"
            className="input"
            type="number"
            min="1"
            value={form.days}
            onChange={set('days')}
            placeholder="1"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="bf-pickup">Pickup location</label>
        <input
          id="bf-pickup"
          className="input"
          value={form.pickupLocation}
          onChange={set('pickupLocation')}
          placeholder="Area, city or airport terminal"
        />
      </div>

      {!compact && (
        <div className="field">
          <label htmlFor="bf-notes">Anything else?</label>
          <textarea
            id="bf-notes"
            className="textarea"
            rows={3}
            value={form.notes}
            onChange={set('notes')}
            placeholder="Number of passengers, luggage, return trip…"
          />
        </div>
      )}

      <div className="bookingForm__actions">
        <a
          className="btn btn--amber btn--block"
          href={whatsappHref(enquiry)}
          target="_blank"
          rel="noopener"
          onClick={send(whatsappHref(enquiry))}
          aria-disabled={!valid}
        >
          Send on WhatsApp
        </a>
        <a
          className="btn btn--ghost btn--block"
          href={mailtoHref(enquiry)}
          onClick={send(mailtoHref(enquiry))}
          aria-disabled={!valid}
        >
          Send by email
        </a>
      </div>

      <p className="bookingForm__note">
        Opens WhatsApp or your mail app with the details already filled in.
        Nothing is sent until you press send there.
      </p>

      {touched && !valid && (
        <p className="fieldError" role="alert">
          Add your name and phone number first.
        </p>
      )}

      <details className="bookingForm__preview">
        <summary>Preview the message</summary>
        <pre>{composeMessage(enquiry)}</pre>
      </details>
    </div>
  );
}
