'use client';

import { useState } from 'react';
import { categories, priceLabel, secondaryPriceLabel, vehicles, type Vehicle } from '@/lib/content';
import { BookButton } from './BookingModal';

export function VehicleCard({ vehicle, source }: { vehicle: Vehicle; source?: string }) {
  const secondary = secondaryPriceLabel(vehicle);

  return (
    <article className="card" data-category={vehicle.categorySlug}>
      <div className={`card__media${vehicle.image ? '' : ' card__media--empty'}`}>
        {vehicle.image ? (
          <img src={vehicle.image} alt={vehicle.name} loading="lazy" />
        ) : (
          'Photo coming'
        )}
        {vehicle.seats && (
          <span className="plate card__tag">
            <span className="plate__tab">SEATS</span>
            <span className="plate__value">{vehicle.seats}</span>
          </span>
        )}
      </div>

      <div className="card__body">
        <h3>{vehicle.name}</h3>
        <div className="card__meta">{vehicle.category}</div>
        {vehicle.description && <p className="card__desc">{vehicle.description}</p>}

        <div className="card__rates">
          <span className="plate">
            <span className="plate__tab">{vehicle.dailyRate ? 'DAY' : 'RATE'}</span>
            <span className="plate__value">{priceLabel(vehicle)}</span>
          </span>
          {secondary && (
            <span className="plate plate--muted">
              <span className="plate__tab">{(vehicle.secondaryLabel || 'Airport').toUpperCase()}</span>
              <span className="plate__value">{secondary}</span>
            </span>
          )}
        </div>

        <BookButton className="btn btn--primary btn--block" vehicle={vehicle.name} source={source}>
          Book this vehicle
        </BookButton>
      </div>
    </article>
  );
}

export default function FleetGrid({ source }: { source?: string }) {
  const [active, setActive] = useState('all');

  const used = categories.filter((c) => vehicles.some((v) => v.categorySlug === c.slug));

  return (
    <>
      <div className="filters">
        <button
          className="filter"
          aria-pressed={active === 'all'}
          onClick={() => setActive('all')}
        >
          All
        </button>
        {used.map((c) => (
          <button
            key={c.slug}
            className="filter"
            aria-pressed={active === c.slug}
            onClick={() => setActive(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid--4">
        {vehicles.map((v) => (
          <div key={v.slug} hidden={active !== 'all' && v.categorySlug !== active}>
            <VehicleCard vehicle={v} source={source} />
          </div>
        ))}
      </div>
    </>
  );
}
