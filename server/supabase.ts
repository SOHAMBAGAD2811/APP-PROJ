/**
 * server/supabase.ts
 * Supabase cloud persistence layer for AiRA (PostgreSQL).
 * Provides seamless cloud storage for scraped flight quotes, fare calendar trends, and scrape jobs.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FlightFare, DailyFareTrend } from './models';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      });
      console.log('✅ Supabase client initialized for', SUPABASE_URL);
    } catch (err: any) {
      console.warn('⚠️ Failed to initialize Supabase client:', err.message);
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; flightCount?: number }> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      message: 'Supabase credentials not configured in environment (SUPABASE_URL, SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)',
    };
  }

  try {
    const { count, error } = await sb.from('flights').select('*', { count: 'exact', head: true });
    if (error) {
      return { ok: false, message: `Supabase query error: ${error.message}` };
    }
    return { ok: true, message: 'Connected to Supabase successfully', flightCount: count || 0 };
  } catch (err: any) {
    return { ok: false, message: `Connection failed: ${err.message}` };
  }
}

export async function fetchFlightsFromSupabase(source?: string): Promise<FlightFare[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    let query = sb.from('flights').select('*').order('scraped_at', { ascending: false }).limit(2000);
    if (source && source !== 'both' && source !== 'all') {
      const src = source === 'google_flights' ? 'ct' : source;
      query = query.eq('source', src);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] fetchFlights error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      provider: row.provider || (row.source === 'emt' ? 'easemytrip' : 'cleartrip'),
      source: row.source,
      search_timestamp: row.scraped_at || row.search_timestamp || new Date().toISOString(),
      origin: row.origin,
      destination: row.destination,
      travel_date: row.travel_date,
      airline: row.airline,
      flight_number: row.flight_number,
      departure_datetime: row.departure_datetime,
      arrival_datetime: row.arrival_datetime,
      duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : undefined,
      stops: row.stops != null ? Number(row.stops) : 0,
      cabin_class: row.cabin_class || 'economy',
      base_fare: row.base_fare != null ? Number(row.base_fare) : null,
      taxes: row.taxes != null ? Number(row.taxes) : null,
      udf: row.udf != null ? Number(row.udf) : null,
      convenience_fee: row.convenience_fee != null ? Number(row.convenience_fee) : null,
      total_fare: Number(row.total_fare || row.price || 0),
      platform: row.platform,
    }));
  } catch (err: any) {
    console.warn('[Supabase] fetchFlights exception:', err.message);
    return [];
  }
}

export async function insertFlightsToSupabase(source: string, fares: FlightFare[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !fares.length) return false;

  try {
    const rows = fares.map((f) => ({
      provider: f.provider || (source === 'emt' ? 'easemytrip' : source === 'ct' ? 'cleartrip' : source),
      source: source === 'google_flights' ? 'ct' : source,
      origin: f.origin,
      destination: f.destination,
      travel_date: f.travel_date,
      airline: f.airline,
      flight_number: f.flight_number,
      departure_datetime: f.departure_datetime,
      arrival_datetime: f.arrival_datetime,
      duration_minutes: f.duration_minutes || null,
      stops: f.stops ?? 0,
      cabin_class: f.cabin_class || 'economy',
      base_fare: f.base_fare || null,
      taxes: f.taxes || null,
      udf: f.udf || null,
      convenience_fee: f.convenience_fee || null,
      total_fare: f.total_fare || f.base_fare || 0,
      platform: f.platform || (source === 'emt' ? 'EaseMyTrip' : 'Google Flights'),
      scraped_at: f.search_timestamp || new Date().toISOString(),
    }));

    // Batch insert in groups of 150
    const batchSize = 150;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await sb.from('flights').insert(batch);
      if (error) {
        console.warn(`[Supabase] insert flight batch error at index ${i}:`, error.message);
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase] insertFlights exception:', err.message);
    return false;
  }
}

export async function fetchCalendarFromSupabase(source?: string): Promise<DailyFareTrend[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    let query = sb.from('fare_calendar').select('*').order('travel_date', { ascending: true }).limit(2000);
    if (source && source !== 'both' && source !== 'all') {
      const src = source === 'google_flights' ? 'ct' : source;
      query = query.eq('source', src);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] fetchCalendar error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      provider: row.provider || (row.source === 'emt' ? 'easemytrip' : 'cleartrip'),
      search_timestamp: row.scraped_at || row.search_timestamp || new Date().toISOString(),
      origin: row.origin,
      destination: row.destination,
      travel_date: row.travel_date,
      advance_purchase_days: row.advance_purchase_days ? Number(row.advance_purchase_days) : 0,
      lowest_fare: Number(row.lowest_fare || row.price || 0),
      airline: row.airline || undefined,
      currency: row.currency || 'INR',
    }));
  } catch (err: any) {
    console.warn('[Supabase] fetchCalendar exception:', err.message);
    return [];
  }
}

export async function insertCalendarToSupabase(source: string, trends: DailyFareTrend[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !trends.length) return false;

  try {
    const rows = trends.map((t) => ({
      provider: t.provider || (source === 'emt' ? 'easemytrip' : source === 'ct' ? 'cleartrip' : source),
      source: source === 'google_flights' ? 'ct' : source,
      origin: t.origin,
      destination: t.destination,
      travel_date: t.travel_date,
      advance_purchase_days: t.advance_purchase_days ?? 0,
      lowest_fare: t.lowest_fare,
      airline: t.airline || null,
      currency: t.currency || 'INR',
      scraped_at: t.search_timestamp || new Date().toISOString(),
    }));

    const batchSize = 150;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await sb.from('fare_calendar').insert(batch);
      if (error) {
        console.warn(`[Supabase] insert calendar batch error at index ${i}:`, error.message);
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase] insertCalendar exception:', err.message);
    return false;
  }
}

export async function upsertJobToSupabase(jobId: string, jobData: any): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  try {
    await sb.from('scrape_jobs').upsert({
      id: jobId,
      status: jobData.status,
      progress: jobData.progress || 0,
      stage: jobData.stage || null,
      step: jobData.step || 0,
      total_steps: jobData.total_steps || 5,
      details: jobData.details || null,
      result: jobData.result || null,
      error: jobData.error || null,
      started_at: jobData.started_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {}
}
