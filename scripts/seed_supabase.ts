/**
 * scripts/seed_supabase.ts
 * CLI migration script to seed existing empirical flight quotes and calendar trends into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed_supabase.ts
 *
 * Requires in .env:
 *   SUPABASE_URL=https://[project-ref].supabase.co
 *   SUPABASE_ANON_KEY=... or SUPABASE_SERVICE_ROLE_KEY=...
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, testSupabaseConnection, insertFlightsToSupabase, insertCalendarToSupabase } from '../server/supabase';
import { FlightFare, DailyFareTrend } from '../server/models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readJsonFile<T>(filename: string): T[] {
  const p = path.join(rootDir, filename);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    console.warn(`Could not read ${filename}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('🚀 [AiRA] Supabase Database Migration & Seeding Tool');
  console.log('==================================================');

  if (!isSupabaseConfigured()) {
    console.error('❌ Error: Supabase credentials not found in environment.');
    console.error('Please configure the following in your /home/soham/aira-prototype/.env file:');
    console.error('  SUPABASE_URL=https://[your-project-id].supabase.co');
    console.error('  SUPABASE_ANON_KEY=[your-anon-or-service-role-key]');
    process.exit(1);
  }

  console.log('📡 Testing connection to Supabase...');
  const conn = await testSupabaseConnection();
  if (!conn.ok) {
    console.error('❌ Connection test failed:', conn.message);
    console.error('Ensure you have executed supabase_schema.sql in the Supabase SQL Editor first!');
    process.exit(1);
  }
  console.log(`✅ Supabase connection confirmed! Current flights in DB: ${conn.flightCount}`);

  // 1. Seed Flights
  const flightFiles = [
    { source: 'emt', file: 'emt_fares.json' },
    { source: 'ct', file: 'ct_fares.json' },
    { source: 'indigo', file: 'indigo_fares.json' },
    { source: 'airindia', file: 'airindia_fares.json' },
  ];

  let totalFlightsMigrated = 0;

  for (const item of flightFiles) {
    const fares = readJsonFile<FlightFare>(item.file);
    if (fares.length > 0) {
      process.stdout.write(`⏳ Uploading ${fares.length} quotes from ${item.file}... `);
      const ok = await insertFlightsToSupabase(item.source, fares);
      if (ok) {
        console.log(`✅ Done`);
        totalFlightsMigrated += fares.length;
      } else {
        console.log(`⚠️ Partial or failed`);
      }
    }
  }

  // 2. Seed Calendars
  const calendarFiles = [
    { source: 'emt', file: 'emt_calendar.json' },
    { source: 'ct', file: 'ct_calendar.json' },
    { source: 'indigo', file: 'indigo_calendar.json' },
    { source: 'airindia', file: 'airindia_calendar.json' },
  ];

  let totalCalendarMigrated = 0;

  for (const item of calendarFiles) {
    const trends = readJsonFile<DailyFareTrend>(item.file);
    if (trends.length > 0) {
      process.stdout.write(`⏳ Uploading ${trends.length} calendar trends from ${item.file}... `);
      const ok = await insertCalendarToSupabase(item.source, trends);
      if (ok) {
        console.log(`✅ Done`);
        totalCalendarMigrated += trends.length;
      } else {
        console.log(`⚠️ Partial or failed`);
      }
    }
  }

  console.log('==================================================');
  console.log(`🎉 Migration Complete!`);
  console.log(`✈️ Total Flights Seeded: ${totalFlightsMigrated}`);
  console.log(`📅 Total Calendar Trends Seeded: ${totalCalendarMigrated}`);
  console.log('You can now view and query the live data inside your Supabase Table Editor.');
}

main().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
