import type { Metadata } from 'next';
import { settings } from '@/lib/content';
import { whatsappDirect } from '@/lib/enquiry';
import BookingForm from '@/components/BookingForm';

export const metadata: Metadata = {
  title: 'Contact the dispatch desk',
  description: 'Call, email or message us on WhatsApp. Quotes usually come back within minutes.',
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <>
      <section className="pageHead">
        <div className="shell">
          <div className="eyebrow">Get in touch</div>
          <h1>Talk to the dispatch desk</h1>
          <p className="lead">{settings.businessHours}</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="split">
            <div>
              <h2>Direct lines</h2>
              <div className="contactList contactList--light">
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
                  <span className="plate">
                    <span className="plate__tab">CALL</span>
                    <span className="plate__value">{settings.phone}</span>
                  </span>
                </a>
                <a href={whatsappDirect()} target="_blank" rel="noopener">
                  <span className="plate">
                    <span className="plate__tab">CHAT</span>
                    <span className="plate__value">WhatsApp</span>
                  </span>
                </a>
                <a href={`mailto:${settings.email}`}>
                  <span className="plate">
                    <span className="plate__tab">MAIL</span>
                    <span className="plate__value">{settings.email}</span>
                  </span>
                </a>
              </div>

              <h2>Offices</h2>
              <p className="lead">{settings.addressPrimary}</p>
              <p className="lead">{settings.addressSecondary}</p>
            </div>

            <div className="dispatch">
              <div className="dispatch__head">
                <h2>Send an enquiry</h2>
                <span>WhatsApp or email</span>
              </div>
              <BookingForm source="Contact page" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
