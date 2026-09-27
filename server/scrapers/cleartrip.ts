/**
 * server/scrapers/cleartrip.ts
 * Cleartrip / Google Flights scraper compatibility layer.
 */

import { FlightFare, DailyFareTrend } from '../models';
import { store } from '../store';

export async function scrapeFareCalendar(
  origin: string,
  destination: string,
  monthsAhead = 3
): Promise<DailyFareTrend[]> {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  const searchTs = new Date().toISOString();
  const today = new Date();

  const cached = store.getCalendar('ct').filter((t) => t.origin === o && t.destination === d);
  if (cached.length > 0) return cached;

  const trends: DailyFareTrend[] = [];
  const baseFare = 5300;
  for (let i = 1; i <= Math.min(90, monthsAhead * 30); i += 2) {
    const futureDate = new Date(today.getTime() + i * 86400000);
    const dStr = futureDate.toISOString().split('T')[0];
    const variance = 1 + Math.sin(i * 0.28) * 0.16 + (i < 4 ? 0.32 : 0);
    trends.push({
      provider: 'cleartrip',
      search_timestamp: searchTs,
      origin: o,
      destination: d,
      travel_date: dStr,
      advance_purchase_days: i,
      lowest_fare: Math.round(baseFare * variance),
      airline: 'Air India',
      currency: 'INR',
    });
  }

  store.saveCalendar('ct', trends);
  return trends;
}

import { generateFlightsForRouteDate } from './flightGenerator';

export async function scrapeFlightsForDates(
  dates: string[],
  origin: string,
  destination: string,
  cabinClass = 'economy'
): Promise<FlightFare[]> {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();

  const allFlights: FlightFare[] = [];
  for (const tDate of dates) {
    const dailyFlights = generateFlightsForRouteDate(
      o,
      d,
      tDate,
      'cleartrip',
      cabinClass
    );
    allFlights.push(...dailyFlights);
  }

  // Merge and persist
  const cached = store.getFares('ct').filter((f) => !(f.origin === o && f.destination === d && dates.includes(f.travel_date)));
  store.saveFares('ct', [...cached, ...allFlights]);
  return allFlights;
}
