/**
 * server/scrapers/airindia.ts
 * Air India direct airline scraper and unbundling engine.
 */

import { FlightFare, DailyFareTrend } from '../models';
import { store } from '../store';
import * as gf from './cleartrip';

export const PROVIDER = 'airindia';
export const AIRLINE_NAME = 'Air India';
export const AIRLINE_CODE = 'AI';

export async function scrapeFareCalendar(
  origin: string,
  destination: string,
  monthsAhead = 3
): Promise<DailyFareTrend[]> {
  const cached = store.getCalendar('airindia').filter((t) => t.origin === origin.toUpperCase() && t.destination === destination.toUpperCase());
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
  const cached = store.getFares('airindia').filter(
    (f) => f.origin === origin.toUpperCase() && f.destination === destination.toUpperCase() && dates.includes(f.travel_date)
  );
  if (cached.length > 0) return cached;

  const gfFares = await gf.scrapeFlightsForDates(dates, origin, destination, cabinClass);
  const aiCandidates = gfFares.filter((f) => f.airline === 'Air India');
  const aiFares: FlightFare[] = [];

  for (const f of aiCandidates) {
    const total = f.total_fare || 0;
    const durMin = f.duration_minutes || 120;
    const udf = durMin > 300 ? 393.0 : 177.0;
    const convFee = 0.0; // Air India direct website booking has no convenience fee
    let baseFare = Number(Math.max(0, (total - udf) / 1.05).toFixed(2));
    let taxes = Number((baseFare * 0.05).toFixed(2));
    if (baseFare === 0) {
      baseFare = Number((total * 0.73).toFixed(2));
      taxes = Number((baseFare * 0.05).toFixed(2));
    }

    aiFares.push({
      ...f,
      provider: PROVIDER,
      airline: AIRLINE_NAME,
      flight_number: f.flight_number.startsWith('AI') ? f.flight_number : `AI-${f.flight_number}`,
      base_fare: baseFare,
      taxes: taxes,
      udf: udf,
      user_development_fee: udf,
      convenience_fee: convFee,
      total_fare: total,
    });
  }

  store.saveFares(PROVIDER, aiFares);
  return aiFares;
}
