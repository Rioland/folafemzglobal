'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import BookingForm from './BookingForm';

type ModalState = { vehicle?: string; service?: string; source?: string } | null;

const BookingContext = createContext<(state: NonNullable<ModalState>) => void>(() => {});

/** `const book = useBooking(); book({ vehicle: 'Toyota Prado 2022' })` */
export const useBooking = () => useContext(BookingContext);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>(null);

  const open = useCallback((next: NonNullable<ModalState>) => setState(next), []);
  const close = useCallback(() => setState(null), []);

  // Escape closes, and the page behind must not scroll while the sheet is up.
  useEffect(() => {
    if (!state) return;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [state, close]);

  return (
    <BookingContext.Provider value={open}>
      {children}

      <div className="modal" data-open={state ? 'true' : 'false'} aria-hidden={!state}>
        <div className="modal__scrim" onClick={close} />
        <div className="modal__panel" role="dialog" aria-modal="true" aria-label="Request a vehicle">
          <div className="modal__head">
            <h2>
              {state?.vehicle ? `Book the ${state.vehicle}` : state?.service ?? 'Request a vehicle'}
            </h2>
            <button className="modal__close" onClick={close} aria-label="Close">×</button>
          </div>
          {state && (
            <BookingForm vehicle={state.vehicle} service={state.service} source={state.source} />
          )}
        </div>
      </div>
    </BookingContext.Provider>
  );
}

/** Any button that should open the sheet. */
export function BookButton({
  vehicle, service, source, className = 'btn btn--amber', children,
}: {
  vehicle?: string; service?: string; source?: string;
  className?: string; children: React.ReactNode;
}) {
  const book = useBooking();
  return (
    <button className={className} onClick={() => book({ vehicle, service, source })}>
      {children}
    </button>
  );
}
