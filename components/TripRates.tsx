import { naira, tripOneWayLabel, tripRates } from '@/lib/content';
import { whatsappDirect } from '@/lib/enquiry';

/* --------------------------------------------------------------------------
   Trip rates
   --------------------------------------------------------------------------
   Interstate work is priced as a job, not a day: a run to Lagos costs one
   figure one way and another there and back, because the return leg and the
   driver's time are the real cost.

   That does not fit on a fleet card, which carries a single daily rate — so
   the two live apart deliberately. The rate here is the whole trip; the rate
   on a card is a day in Akure. Saying so plainly is the point of the section.
   -------------------------------------------------------------------------- */

export default function TripRates() {
  const { base, destination, note, rows, escort } = tripRates;

  return (
    <section className="section section--edge" id="trip-rates">
      <div className="shell">
        <div className="sectionHead reveal">
          <div>
            <div className="eyebrow">{base} → {destination}</div>
            <h2>Trip rates</h2>
            <p className="lead">{note}</p>
          </div>
          <a
            className="btn btn--ghost"
            href={whatsappDirect(`Hello, I would like to book a trip from ${base} to ${destination}.`)}
            target="_blank"
            rel="noopener"
          >
            Book a trip
          </a>
        </div>

        <div className="rateTable__scroll">
          <table className="rateTable">
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                <th scope="col">Drop-off <span>one way</span></th>
                <th scope="col">Return <span>there and back</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.vehicle}>
                  <th scope="row">
                    {row.vehicle}
                    {row.note && <span className="rateTable__note">{row.note}</span>}
                  </th>
                  <td>{tripOneWayLabel(row)}</td>
                  <td>{naira(row.returnTrip)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rateEscort">
          <div>
            <strong>{escort.label}</strong>
            <span>{escort.note}</span>
          </div>
          <div className="rateEscort__price">
            {naira(escort.rate)}
            <span>{escort.unit}</span>
          </div>
        </div>

        <p className="rateTable__foot">
          Rates on the fleet cards are for a day in {base}. The figures above are
          for the whole trip. Anything outside these routes is quoted on request.
        </p>
      </div>
    </section>
  );
}
