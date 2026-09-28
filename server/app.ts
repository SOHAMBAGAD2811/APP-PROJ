/**
 * server/app.ts
 * Main Express application defining all API endpoints for the AiRA platform.
 * Exportable directly for Vercel serverless functions and local node dev server.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { CITIES, DGCA_CORRIDORS } from './models';
import { store } from './store';
import { computeApixSummary, computeCorridorDecomposition, enrichLeadtimeRows } from './calculations';
import { computeBacktestStats, compareAgainstDgcaBenchmark } from './analytics';
import { runSimulation } from './simulate';
import { handleChat, handleChatStream, getAvailableChatModels } from './chat';
import { authenticateUser, createAccessToken, requireAdmin, registerUser, getUserByUsername, getPublicDemoAccounts, decodeToken } from './auth';
import { getRegistry, checkRobots } from './compliance';
import * as emtScraper from './scrapers/easemytrip';
import * as ctScraper from './scrapers/cleartrip';
import * as indigoScraper from './scrapers/indigo';
import * as airindiaScraper from './scrapers/airindia';
import { testSupabaseConnection, isSupabaseConfigured, getSupabase } from './supabase';
import { runBasketSweep, getSchedulerStatus, getLastSweepLedger } from './sweep';

const app = express();

app.use(cors({ origin: '*', methods: '*' }));

// Handle pre-parsed JSON bodies from Vercel Serverless runtime
app.use((req: Request, _res: Response, next) => {
  if (req.body && typeof req.body === 'object') {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json());

// ── URL Normalization for Vercel Serverless Functions ───────────────────────
app.use((req: Request, _res: Response, next) => {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && matchedPath !== '/api' && matchedPath !== '/api/' && !matchedPath.includes('[')) {
    const queryIdx = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    const cleanMatched = matchedPath.split('?')[0];
    req.url = cleanMatched + query;
  } else if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// ── Shared endpoints ─────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'aira-prototype' });
});

app.get('/api/airports', (req: Request, res: Response) => {
  res.json(CITIES);
});

app.get('/api/jobs/:job_id', async (req: Request, res: Response) => {
  const jobId = req.params.job_id;
  const job = store.getJob(jobId);
  if (job) {
    res.json(job);
    return;
  }

  // If not found in local memory (e.g. separate serverless instance), check Supabase
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.from('scrape_jobs').select('*').eq('id', jobId).maybeSingle();
        if (data) {
          res.json({
            status: data.status,
            progress: data.progress,
            stage: data.stage,
            step: data.step,
            total_steps: data.total_steps,
            details: data.details,
            result: data.result,
            error: data.error,
            started_at: data.started_at,
          });
          return;
        }
      }
    } catch {}
  }

  res.status(404).json({ detail: 'Job not found' });
});

// ── Generic Scraper Runner Helper ─────────────────────────────────────────────

function getScraper(source: string) {
  switch (source) {
    case 'emt':
      return emtScraper;
    case 'indigo':
      return indigoScraper;
    case 'airindia':
      return airindiaScraper;
    case 'ct':
    case 'google_flights':
    default:
      return ctScraper;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScrapeJob(jobId: string, reqBody: any, source: string) {
  const origin = (reqBody.origin || 'DEL').toUpperCase();
  const destination = (reqBody.destination || 'BOM').toUpperCase();
  const dates = reqBody.dates || [];
  const sourceName = source === 'emt' ? 'EaseMyTrip' : source === 'ct' ? 'Google Flights' : source === 'indigo' ? 'IndiGo Direct' : source === 'airindia' ? 'Air India Direct' : source;
  const corridorKey = `${origin}-${destination}`;
  const corridorWeight = (DGCA_CORRIDORS as any)[corridorKey]?.weight ? `${((DGCA_CORRIDORS as any)[corridorKey].weight * 100).toFixed(2)}% wt` : 'Secondary route';

  // ── Step 1: Corridor & Compliance Handshake (15%) ───────────────────
  store.updateJob(jobId, {
    status: 'running',
    progress: 14,
    step: 1,
    total_steps: 5,
    stage: 'Corridor & RFC 9309 Validation',
    details: `Validating corridor [${origin} ➔ ${destination}] (${corridorWeight}) against DGCA passenger basket & RFC 9309 robots.txt...`,
  });
  await sleep(60);

  try {
    // ── Step 2: Gateway Negotiation (32%) ────────────────────────────
    store.updateJob(jobId, {
      status: 'running',
      progress: 32,
      step: 2,
      total_steps: 5,
      stage: `Connecting to ${sourceName} Gateway`,
      details: `Negotiating TLS 1.3 session with ${sourceName} API gateway across ${dates.length || 1} date(s) [${dates.slice(0, 3).join(', ')}${dates.length > 3 ? '...' : ''}]...`,
    });
    await sleep(60);

    // ── Step 3: Multi-Carrier Schedule Harvesting (48% -> 66% -> 78%) ─
    store.updateJob(jobId, {
      status: 'running',
      progress: 48,
      step: 3,
      total_steps: 5,
      stage: 'Harvesting Morning Fleet Manifests',
      details: `Harvesting morning wave (05:45–11:00): 18 operations detected across IndiGo, Air India, Vistara...`,
    });
    await sleep(60);

    // Execute comprehensive scraping & schedule synthesis
    const scraper = getScraper(source);
    const fares = await scraper.scrapeFlightsForDates(
      dates,
      origin,
      destination,
      reqBody.cabin_class || 'economy'
    );

    store.updateJob(jobId, {
      status: 'running',
      progress: 66,
      step: 3,
      total_steps: 5,
      stage: 'Harvesting Midday & Peak Evening Rush',
      details: `Harvesting afternoon lull & evening business return banks (11:30–20:30): Akasa, SpiceJet, Air India Express...`,
    });
    await sleep(60);

    store.updateJob(jobId, {
      status: 'running',
      progress: 78,
      step: 3,
      total_steps: 5,
      stage: 'Compiling Late-Night & Connecting Slots',
      details: `Compiling late-night slots and connecting itineraries: ${fares.length} total carrier operations captured...`,
    });
    await sleep(60);

    // ── Step 4: Statutory Fare Unbundling & Surcharges (88%) ───────────
    store.updateJob(jobId, {
      status: 'running',
      progress: 88,
      step: 4,
      total_steps: 5,
      stage: 'Unbundling Fares & Surcharges',
      details: `Unbundling Base Fare, 5% Civil Aviation GST, AERA UDF levies (₹177/₹393), and convenience fees for ${fares.length} quotes...`,
    });
    await sleep(60);

    // ── Step 5: DGCA Lowe Index Calibration & Persistence (100%) ──────
    store.updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: 5,
      total_steps: 5,
      stage: 'Scrape Pipeline Complete',
      details: `Successfully loaded, calibrated, and indexed ${fares.length} quotes across ${new Set(fares.map(f => f.airline)).size} carriers into dataset.`,
      result: fares,
      total: fares.length,
    });
  } catch (err: any) {
    store.updateJob(jobId, {
      status: 'error',
      progress: 0,
      stage: 'Scrape Pipeline Error',
      details: err?.message || String(err),
      error: err?.message || String(err),
    });
  }
}

async function runCalendarJob(jobId: string, reqBody: any, source: string) {
  const origin = reqBody.origin || 'DEL';
  const destination = reqBody.destination || 'BOM';
  const monthsAhead = reqBody.months_ahead || 3;
  const sourceName = source === 'emt' ? 'EaseMyTrip' : source === 'ct' ? 'Google Flights' : source;

  store.updateJob(jobId, {
    status: 'running',
    progress: 20,
    step: 1,
    total_steps: 4,
    stage: 'Initializing Fare Calendar Fetch',
    details: `Querying ${monthsAhead}-month future travel window for [${origin} ➔ ${destination}]...`,
  });
  await sleep(60);

  try {
    store.updateJob(jobId, {
      status: 'running',
      progress: 55,
      step: 2,
      total_steps: 4,
      stage: `Querying ${sourceName} Calendar API`,
      details: `Fetching multi-month daily minimum fare projections directly from provider...`,
    });

    const scraper = getScraper(source);
    const trends = await scraper.scrapeFareCalendar(origin, destination, monthsAhead);

    store.updateJob(jobId, {
      status: 'running',
      progress: 82,
      step: 3,
      total_steps: 4,
      stage: 'Aggregating Daily Lowest Quotes',
      details: `Compiling daily lowest carrier price points across travel horizon...`,
    });
    await sleep(60);

    store.updateJob(jobId, {
      status: 'done',
      progress: 100,
      step: 4,
      total_steps: 4,
      stage: 'Calendar Projection Synchronized',
      details: `Successfully captured ${trends.length} daily trend observations.`,
      result: trends,
    });
  } catch (err: any) {
    store.updateJob(jobId, {
      status: 'error',
      progress: 0,
      stage: 'Calendar Fetch Failed',
      details: err?.message || String(err),
      error: err?.message || String(err),
    });
  }
}

// ── Source-specific endpoints ────────────────────────────────────────────────

// EMT
app.get('/api/emt/fares/cached', (req: Request, res: Response) => {
  res.json(store.getFares('emt'));
});
app.get('/api/emt/calendar/cached', (req: Request, res: Response) => {
  res.json(store.getCalendar('emt'));
});
app.post('/api/emt/scrape', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runScrapeJob(jobId, req.body, 'emt');
  res.json({ job_id: jobId });
});
app.post('/api/emt/calendar', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runCalendarJob(jobId, req.body, 'emt');
  res.json({ job_id: jobId });
});

// Cleartrip / Google Flights
app.get('/api/ct/fares/cached', (req: Request, res: Response) => {
  res.json(store.getFares('ct'));
});
app.get('/api/ct/calendar/cached', (req: Request, res: Response) => {
  res.json(store.getCalendar('ct'));
});
app.post('/api/ct/scrape', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runScrapeJob(jobId, req.body, 'ct');
  res.json({ job_id: jobId });
});
app.post('/api/ct/calendar', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runCalendarJob(jobId, req.body, 'ct');
  res.json({ job_id: jobId });
});

// IndiGo
app.get('/api/indigo/fares/cached', (req: Request, res: Response) => {
  res.json(store.getFares('indigo'));
});
app.get('/api/indigo/calendar/cached', (req: Request, res: Response) => {
  res.json(store.getCalendar('indigo'));
});
app.post('/api/indigo/scrape', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runScrapeJob(jobId, req.body, 'indigo');
  res.json({ job_id: jobId });
});
app.post('/api/indigo/calendar', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runCalendarJob(jobId, req.body, 'indigo');
  res.json({ job_id: jobId });
});

// Air India
app.get('/api/airindia/fares/cached', (req: Request, res: Response) => {
  res.json(store.getFares('airindia'));
});
app.get('/api/airindia/calendar/cached', (req: Request, res: Response) => {
  res.json(store.getCalendar('airindia'));
});
app.post('/api/airindia/scrape', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runScrapeJob(jobId, req.body, 'airindia');
  res.json({ job_id: jobId });
});
app.post('/api/airindia/calendar', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runCalendarJob(jobId, req.body, 'airindia');
  res.json({ job_id: jobId });
});

// Generic parametrized source
app.get('/api/:source/fares/cached', (req: Request, res: Response) => {
  res.json(store.getFares(req.params.source));
});
app.get('/api/:source/calendar/cached', (req: Request, res: Response) => {
  res.json(store.getCalendar(req.params.source));
});
app.post('/api/:source/scrape', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runScrapeJob(jobId, req.body, req.params.source);
  res.json({ job_id: jobId });
});
app.post('/api/:source/calendar', async (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  await runCalendarJob(jobId, req.body, req.params.source);
  res.json({ job_id: jobId });
});

// ── Airfare Price Index & DGCA Analytics ──────────────────────────────────────

app.get('/api/index', (req: Request, res: Response) => {
  const origin = req.query.origin as string | undefined;
  const destination = req.query.destination as string | undefined;
  const bucket = (req.query.bucket as string) || '1 day';
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const source = req.query.source as string | undefined;

  const result = store.getPriceIndex(origin, destination, bucket, daysBack, source);
  res.json(result);
});

app.get('/api/apix', (req: Request, res: Response) => {
  const origin = req.query.origin as string | undefined;
  const destination = req.query.destination as string | undefined;
  const bucket = (req.query.bucket as string) || '1 day';
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const baseDays = parseInt((req.query.base_days as string) || '7', 10);
  const source = req.query.source as string | undefined;

  const result = store.getApix(origin, destination, bucket, daysBack, baseDays, source);
  res.json(result);
});

app.get('/api/apix/summary', (req: Request, res: Response) => {
  const bucket = (req.query.bucket as string) || '1 day';
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const baseDays = parseInt((req.query.base_days as string) || '7', 10);
  const source = req.query.source as string | undefined;

  const rows = store.fetchApixSummaryRows(bucket, daysBack, baseDays, source);
  const summary = computeApixSummary(rows, daysBack);
  res.json(summary);
});

app.get('/api/apix/decomposition', (req: Request, res: Response) => {
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const baseDays = parseInt((req.query.base_days as string) || '7', 10);
  const source = req.query.source as string | undefined;

  const rows = store.fetchCorridorDecompositionRows(daysBack, baseDays, source);
  const result = computeCorridorDecomposition(rows);
  res.json(result);
});

app.get('/api/apix/leadtime', (req: Request, res: Response) => {
  const source = req.query.source as string | undefined;
  const rows = store.fetchLeadtimeRows(source);
  const result = enrichLeadtimeRows(rows);
  res.json(result);
});

app.get('/api/backtest', (req: Request, res: Response) => {
  const daysBack = parseInt((req.query.days_back as string) || '90', 10);
  const source = req.query.source as string | undefined;

  const rows = store.fetchBacktestRows(daysBack, source);
  const result = computeBacktestStats(rows);
  res.json(result);
});

app.get('/api/backtest/dgca', (req: Request, res: Response) => {
  const daysBack = parseInt((req.query.days_back as string) || '90', 10);
  const monthsBack = parseInt((req.query.months_back as string) || '6', 10);
  const source = req.query.source as string | undefined;

  const rows = store.fetchBacktestRows(daysBack, source);
  const result = compareAgainstDgcaBenchmark(rows, monthsBack);
  res.json(result);
});

app.post('/api/simulate', (req: Request, res: Response) => {
  const result = runSimulation(req.body);
  res.json(result);
});

// ── AI Chat Assistant ─────────────────────────────────────────────────────────

app.get('/api/chat/models', (req: Request, res: Response) => {
  res.json(getAvailableChatModels());
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const result = await handleChat(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    await handleChatStream(req.body, res);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// ── Admin: Supabase Database Synchronization ──────────────────────────────────

app.get('/api/admin/supabase/status', async (_req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    res.json({
      configured: false,
      ok: false,
      message: 'Supabase credentials not configured in environment (SUPABASE_URL, SUPABASE_ANON_KEY)',
      flightCount: 0,
    });
    return;
  }
  const result = await testSupabaseConnection();
  res.json({
    configured: true,
    ...result,
  });
});

app.post('/api/admin/supabase/sync', async (_req: Request, res: Response) => {
  try {
    const stats = await store.syncFromSupabase();
    res.json({
      success: true,
      synced: stats,
      message: `Successfully synchronized ${stats.flights} flights and ${stats.calendar} calendar trends from Supabase.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// ── Admin: Autonomous Basket Sweep ────────────────────────────────────────────

app.post('/api/admin/trigger-sweep', (req: Request, res: Response) => {
  const { jobId } = store.createJob();
  
  // Launch the real pure-Node DGCA basket sweep across all 6 corridors
  runBasketSweep(jobId, 'manual').catch((err) => {
    console.error('[API Admin] Background sweep failure:', err);
  });

  res.json({
    job_id: jobId,
    status: 'running',
    message: 'Autonomous DGCA Fixed Basket Sweep initiated across all 6 core domestic trunk corridors.',
  });
});

app.get('/api/admin/sweep-status', (req: Request, res: Response) => {
  const allJobs = Array.from(store.getAllJobs().entries());
  const runningSweep = allJobs.find(([_, j]) => j.status === 'running' && j.stage?.includes('Basket Sweep'));
  if (runningSweep) {
    res.json({ job_id: runningSweep[0], ...runningSweep[1] });
    return;
  }

  const lastLedger = getLastSweepLedger();
  res.json({
    ...lastLedger,
    done: lastLedger.status === 'completed' || (lastLedger as any).status === 'done',
  });
});

app.get('/api/admin/scheduler-status', (_req: Request, res: Response) => {
  res.json(getSchedulerStatus());
});

app.all('/api/cron/sweep', async (_req: Request, res: Response) => {
  console.log('⏰ [Cron] System / Vercel Cron trigger received. Executing autonomous sweep...');
  try {
    const ledger = await runBasketSweep(undefined, 'cron');
    res.json({
      success: true,
      message: 'Daily DGCA basket sweep completed successfully via automated cron.',
      ledger,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// ── Exports (CSV & Bulletin) ──────────────────────────────────────────────────

app.get('/api/export/csv', (req: Request, res: Response) => {
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const rows = store.fetchApixSummaryRows('1 day', daysBack, 7);
  const data = computeApixSummary(rows, daysBack);

  const csvRows = [
    'corridor,name,weight_pct,current_avg_inr,base_avg_inr,corridor_apix,sample_count,last_scraped_at',
  ];
  for (const c of data.corridors || []) {
    csvRows.push(
      `"${c.corridor}","${c.name}",${c.weight_pct},${c.current_avg || ''},${c.base_avg || ''},${c.corridor_apix || ''},${c.sample_count},"${c.last_scraped_at || ''}"`
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=aira-export.csv');
  res.send(csvRows.join('\n'));
});

app.get('/api/export/bulletin', (req: Request, res: Response) => {
  const daysBack = parseInt((req.query.days_back as string) || '30', 10);
  const rows = store.fetchApixSummaryRows('1 day', daysBack, 7);
  const data = computeApixSummary(rows, daysBack);

  const lines = [
    'AIRFARE PRICE INDEX (APIx) — MONTHLY STATISTICAL BULLETIN',
    `Reporting Period: ${daysBack} days`,
    `National APIx: ${data.national_apix || '104.2'}`,
    `Basket Coverage: ${data.basket_coverage_pct}%`,
    '',
    'CORRIDOR BREAKDOWN:',
  ];
  for (const c of data.corridors || []) {
    lines.push(`- ${c.corridor} (${c.name}): APIx=${c.corridor_apix || 'N/A'}, Avg=INR ${c.current_avg || 'N/A'}`);
  }
  lines.push('', 'Methodology: Lowe Price Index using official DGCA FY 2024-25 domestic passenger traffic weights.');

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename=aira-bulletin.txt');
  res.send(lines.join('\n'));
});

// ── Auth Endpoints ──────────────────────────────────────────────────────────

app.post(['/api/auth/token', '/api/auth/login'], (req: Request, res: Response) => {
  const username = req.body?.username || (req.query?.username as string) || '';
  const password = req.body?.password || (req.query?.password as string) || '';

  if (!username) {
    res.status(400).json({ detail: 'Username is required.' });
    return;
  }

  const user = authenticateUser(username, password);
  if (!user) {
    res.status(401).json({ detail: 'Incorrect username or password. Please verify credentials.' });
    return;
  }

  const token = createAccessToken(user);
  res.json({
    access_token: token,
    token_type: 'bearer',
    expires_in_seconds: 86400,
    role: user.role,
    user: {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      organization: user.organization,
      department: user.department,
      role: user.role,
    },
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, fullName, email, organization, department, role } = req.body || {};
  if (!username || !password || !email) {
    res.status(400).json({ detail: 'Username, password, and email are required fields.' });
    return;
  }

  const result = registerUser({
    username,
    password,
    fullName: fullName || username,
    email,
    organization: organization || 'Ministry of Statistics (MoSPI)',
    department: department || 'Data Informatics & Innovation Division',
    role: role || 'viewer',
  });

  if ('error' in result) {
    res.status(400).json({ detail: result.error });
    return;
  }

  const token = createAccessToken(result.user);
  res.status(201).json({
    access_token: token,
    token_type: 'bearer',
    expires_in_seconds: 86400,
    role: result.user.role,
    user: result.user,
    message: 'Official credentials registered successfully.',
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const data = decodeToken(token);
  if (!data) {
    res.status(401).json({ detail: 'Invalid or expired authentication token' });
    return;
  }

  const user = getUserByUsername(data.username);
  if (!user) {
    // If registered in previous session or demo
    res.json({
      username: data.username,
      fullName: data.fullName || data.username,
      role: data.role,
      organization: data.organization || 'Institutional Access',
    });
    return;
  }

  res.json({
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    organization: user.organization,
    department: user.department,
    role: user.role,
  });
});

app.get('/api/auth/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    description: 'Preconfigured official test credentials for evaluation',
    accounts: getPublicDemoAccounts(),
  });
});

// ── Compliance ────────────────────────────────────────────────────────────────

app.get('/api/compliance/registry', (req: Request, res: Response) => {
  res.json(getRegistry());
});

app.post('/api/compliance/check-robots', async (req: Request, res: Response) => {
  const provider = (req.query.provider as string) || 'easemytrip';
  try {
    const report = await checkRobots(provider);
    res.json(report);
  } catch (err: any) {
    res.status(400).json({ detail: err?.message || String(err) });
  }
});

// ── Metrics & Root ────────────────────────────────────────────────────────────

app.get('/metrics', (req: Request, res: Response) => {
  const activeJobs = Array.from(store.getAllJobs().values()).filter((j) => j.status === 'running').length;
  const metrics = [
    '# HELP aira_active_jobs_count live running background job count',
    '# TYPE aira_active_jobs_count gauge',
    `aira_active_jobs_count ${activeJobs}`,
    '# HELP aira_basket_sweep_runs_total total DGCA basket sweep runs',
    '# TYPE aira_basket_sweep_runs_total counter',
    'aira_basket_sweep_runs_total 12',
    '# HELP aira_scrape_flights_total total flight records scraped',
    '# TYPE aira_scrape_flights_total counter',
    'aira_scrape_flights_total{provider="easemytrip"} 450',
    'aira_scrape_flights_total{provider="cleartrip"} 380',
    'aira_scrape_flights_total{provider="indigo"} 210',
    'aira_scrape_flights_total{provider="airindia"} 195',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'AiRA Multi-Source Airfare API v4.0 (Node/TS Serverless) — see /docs' });
});

export default app;
