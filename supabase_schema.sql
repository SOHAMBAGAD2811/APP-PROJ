-- =========================================================================
-- AiRA Supabase Database Schema (PostgreSQL)
-- =========================================================================
-- Execute this script in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste and click "Run"
-- =========================================================================

-- Optional: Enable vector extension for embeddings if needed later
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 1. FLIGHTS TABLE ─────────────────────────────────────────────────────
-- Stores individual scraped flight quotes, airline codes, timings, and fare breakdowns.
CREATE TABLE IF NOT EXISTS public.flights (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,                     -- 'emt', 'ct', 'indigo', 'airindia'
    provider TEXT NOT NULL,                   -- 'easemytrip', 'cleartrip', 'google_flights'
    airline TEXT,
    flight_number TEXT,
    origin TEXT NOT NULL,                     -- 'DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD'
    destination TEXT NOT NULL,
    travel_date DATE NOT NULL,
    departure_datetime TIMESTAMPTZ,
    arrival_datetime TIMESTAMPTZ,
    duration_minutes INTEGER,
    stops SMALLINT DEFAULT 0,
    cabin_class TEXT DEFAULT 'economy',
    base_fare NUMERIC(12, 2),
    taxes NUMERIC(12, 2),
    udf NUMERIC(12, 2),
    convenience_fee NUMERIC(12, 2),
    total_fare NUMERIC(12, 2) NOT NULL,
    platform TEXT,
    raw JSONB,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes for corridor analysis & APIx Lowe Index aggregation
CREATE INDEX IF NOT EXISTS idx_flights_route ON public.flights (origin, destination, travel_date);
CREATE INDEX IF NOT EXISTS idx_flights_source ON public.flights (source, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_flights_total_fare ON public.flights (total_fare);
CREATE INDEX IF NOT EXISTS idx_flights_scraped_at ON public.flights (scraped_at DESC);

-- ── 2. FARE CALENDAR TABLE ────────────────────────────────────────────────
-- Stores 3-month forward daily lowest fares for price trend forecasting.
CREATE TABLE IF NOT EXISTS public.fare_calendar (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    provider TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    travel_date DATE NOT NULL,
    advance_purchase_days SMALLINT DEFAULT 0,
    lowest_fare NUMERIC(12, 2) NOT NULL,
    airline TEXT,
    currency TEXT DEFAULT 'INR',
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_route ON public.fare_calendar (source, origin, destination, travel_date);
CREATE INDEX IF NOT EXISTS idx_calendar_travel_date ON public.fare_calendar (travel_date ASC);

-- ── 3. SCRAPE JOBS TABLE ──────────────────────────────────────────────────
-- Tracks background scraper jobs, progress percentages, and current stage.
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,                     -- 'queued', 'running', 'done', 'error'
    progress SMALLINT DEFAULT 0,
    stage TEXT,
    step SMALLINT DEFAULT 0,
    total_steps SMALLINT DEFAULT 5,
    details TEXT,
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────────────────
-- Allows anonymous and service-role read/write operations for the prototype
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Flights policies
CREATE POLICY "Allow public read on flights" ON public.flights FOR SELECT USING (true);
CREATE POLICY "Allow public insert on flights" ON public.flights FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on flights" ON public.flights FOR UPDATE USING (true);

-- Calendar policies
CREATE POLICY "Allow public read on fare_calendar" ON public.fare_calendar FOR SELECT USING (true);
CREATE POLICY "Allow public insert on fare_calendar" ON public.fare_calendar FOR INSERT WITH CHECK (true);

-- Jobs policies
CREATE POLICY "Allow public read on scrape_jobs" ON public.scrape_jobs FOR SELECT USING (true);
CREATE POLICY "Allow public write on scrape_jobs" ON public.scrape_jobs FOR ALL USING (true);
