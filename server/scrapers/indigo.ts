/**
 * server/scrapers/indigo.ts
 * IndiGo direct airline scraper and unbundling engine.
 */

import { FlightFare, DailyFareTrend } from '../models';
import { store } from '../store';
import * as gf from './cleartrip';

export const PROVIDER = 'indigo';
export const AIRLINE_NAME = 'IndiGo';
export const AIRLINE_CODE = '6E';

export async function scrapeFareCalendar(
  origin: string,
  destination: string,
  monthsAhead = 3
): Promise<DailyFareTrend[]> {
  const cached = store.getCalendar('indigo').filter((t) => t.origin === origin.toUpperCase() && t.destination === destination.toUpperCase());
  if (cached.length > 0) return cached;

  const gfTrends = await gf.scrapeFareCalendar(origin, destination, monthsAhead);
  const trends: DailyFareTrend[] = gfTrends.map((t) => ({
    ...t,
    provider: PROVIDER,
    airline: AIRLINE_NAME,
  }));
  store.saveCalendar(PROVIDER, trends);
  return trends;
}

export async function scrapeFlightsForDates(
  dates: string[],
  origin: string,
  destination: string,
  cabinClass = 'economy'
): Promise<FlightFare[]> {
  const cached = store.getFares('indigo').filter(
    (f) => f.origin === origin.toUpperCase() && f.destination === destination.toUpperCase() && dates.includes(f.travel_date)
  );
  if (cached.length > 0) return cached;

  const gfFares = await gf.scrapeFlightsForDates(dates, origin, destination, cabinClass);
  const indigoFares: FlightFare[] = [];

  for (const f of gfFares) {
    const total = f.total_fare || 0;
    const durMin = f.duration_minutes || 120;
    const udf = durMin > 300 ? 393.0 : 177.0;
    const convFee = 299.0;
    let baseFare = Number(Math.max(0, (total - udf - convFee) / 1.05).toFixed(2));
    let taxes = Number((baseFare * 0.05).toFixed(2));
    if (baseFare === 0) {
      baseFare = Number((total * 0.73).toFixed(2));
      taxes = Number((baseFare * 0.05).toFixed(2));
    }

    indigoFares.push({
      ...f,
      provider: PROVIDER,
      airline: AIRLINE_NAME,
      flight_number: f.flight_number.startsWith('6E') ? f.flight_number : `6E-${f.flight_number}`,
      base_fare: baseFare,
      taxes: taxes,
      udf: udf,
      user_development_fee: udf,
      convenience_fee: convFee,
      total_fare: total,
    });
  }

  store.saveFares(PROVIDER, indigoFares);
  return indigoFares;
}
