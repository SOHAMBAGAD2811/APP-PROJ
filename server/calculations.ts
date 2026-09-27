/**
 * server/calculations.ts
 * Pure business-logic layer for the Airfare Price Index (APIx) and DGCA Lowe Index.
 */

import { DGCA_CORRIDORS } from './models';

export interface BucketCorridorRow {
  corridor: string;
  avg_price?: number | null;
  base_avg?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  sample_count?: number;
  latest_scrape?: string | null;
  prev_avg?: number | null;
  imputed?: boolean;
  imputation_method?: string;
  [key: string]: any;
}

export function imputeMissingCorridors(
  bucketCorridors: Record<string, BucketCorridorRow>,
  previousBucketCorridors?: Record<string, BucketCorridorRow> | null
): { imputed: Record<string, BucketCorridorRow>; imputedCodes: string[] } {
  const imputed: Record<string, BucketCorridorRow> = { ...bucketCorridors };
  const imputedCodes: string[] = [];

  const missingCodes = Object.keys(DGCA_CORRIDORS).filter(
    (c) => !imputed[c] || imputed[c].avg_price == null
  );

  if (missingCodes.length === 0) {
    return { imputed, imputedCodes: [] };
  }

  // Calculate current observed mean relative ratio across available basket corridors
  const observedRatios: number[] = [];
  const observedWeights: number[] = [];

  for (const [c, info] of Object.entries(DGCA_CORRIDORS)) {
    const row = imputed[c];
    if (row && row.avg_price != null && row.base_avg && row.base_avg > 0) {
      observedRatios.push(row.avg_price / row.base_avg);
      observedWeights.push(info.weight);
    }
  }

  const weightSum = observedWeights.reduce((a, b) => a + b, 0);
  const groupMeanRatio =
    weightSum > 0
      ? observedRatios.reduce((sum, r, idx) => sum + r * observedWeights[idx], 0) / weightSum
      : 1.0;

  for (const code of missingCodes) {
    // 1. Check LOCF from previous bucket
    const prevRow = previousBucketCorridors ? previousBucketCorridors[code] : undefined;
    if (prevRow && prevRow.avg_price != null && prevRow.base_avg) {
      imputed[code] = {
        corridor: code,
        avg_price: prevRow.avg_price,
        base_avg: prevRow.base_avg,
        imputed: true,
        imputation_method: 'locf',
      };
    } else {
      // 2. Corridor-Group Mean Imputation
      const base_avg = 7000.0;
      const avg_price = Number((base_avg * groupMeanRatio).toFixed(2));
      imputed[code] = {
        corridor: code,
        avg_price,
        base_avg,
        imputed: true,
        imputation_method: 'group_mean',
      };
    }
    imputedCodes.push(code);
  }

  return { imputed, imputedCodes };
}

export function computeLoweIndex(
  bucketCorridors: Record<string, BucketCorridorRow>,
  impute = false,
  previousBucketCorridors?: Record<string, BucketCorridorRow> | null
): number | null {
  let effectiveCorridors = bucketCorridors;
  if (impute) {
    const res = imputeMissingCorridors(bucketCorridors, previousBucketCorridors);
    effectiveCorridors = res.imputed;
  }

  let num = 0.0;
  let den = 0.0;

  for (const [code, info] of Object.entries(DGCA_CORRIDORS)) {
    const row = effectiveCorridors[code];
    if (row && row.base_avg && row.base_avg > 0 && row.avg_price != null) {
      const w = info.weight;
      num += w * (row.avg_price / row.base_avg);
      den += w;
    }
  }

  return den > 0 ? Number((100.0 * (num / den)).toFixed(2)) : null;
}

export function corridorApix(curAvg?: number | null, baseAvg?: number | null): number | null {
  if (curAvg != null && baseAvg && baseAvg > 0) {
    return Number(((curAvg / baseAvg) * 100.0).toFixed(2));
  }
  return null;
}

export function computeApixSummary(rows: any[], daysBack = 30): any {
  if (!rows || rows.length === 0) {
    return emptyApixSummary();
  }

  const bucketsMap: Record<string, any> = {};
  const corridorLatest: Record<string, any> = {};
  let newestScrapeDt: Date | null = null;

  for (const r of rows) {
    const bKey = typeof r.bucket === 'string' ? r.bucket : new Date(r.bucket).toISOString();
    const corr = r.corridor;
    const ls = r.latest_scrape ? new Date(r.latest_scrape) : null;
    if (ls && (!newestScrapeDt || ls > newestScrapeDt)) {
      newestScrapeDt = ls;
    }

    if (!corridorLatest[corr]) {
      corridorLatest[corr] = r;
    }

    if (!bucketsMap[bKey]) {
      bucketsMap[bKey] = {
        bucket: bKey,
        dt: new Date(bKey),
        corridors: {},
        total_samples: 0,
        prices: [],
        min_prices: [],
        max_prices: [],
      };
    }
    const bkt = bucketsMap[bKey];
    bkt.corridors[corr] = r;
    bkt.total_samples += Number(r.sample_count || 0);
    if (r.avg_price != null) bkt.prices.push(Number(r.avg_price));
    if (r.min_price != null) bkt.min_prices.push(Number(r.min_price));
    if (r.max_price != null) bkt.max_prices.push(Number(r.max_price));
  }

  const timeseries: any[] = [];
  const sortedBucketKeys = Object.keys(bucketsMap).sort(
    (a, b) => bucketsMap[a].dt.getTime() - bucketsMap[b].dt.getTime()
  );

  for (const bKey of sortedBucketKeys) {
    const bkt = bucketsMap[bKey];
    const lowe = computeLoweIndex(bkt.corridors);

    let den = 0;
    let active = 0;
    for (const [c, info] of Object.entries(DGCA_CORRIDORS)) {
      const row = bkt.corridors[c];
      if (row && row.base_avg && row.base_avg > 0 && row.avg_price != null) {
        den += info.weight;
        active += 1;
      }
    }

    const prices = bkt.prices;
    const minPrices = bkt.min_prices;
    const maxPrices = bkt.max_prices;

    timeseries.push({
      bucket: bKey,
      national_apix: lowe,
      observed_weight: Number(den.toFixed(4)),
      basket_coverage_pct: Number((den * 100.0).toFixed(2)),
      active_corridors_count: active,
      sample_count: bkt.total_samples,
      avg_fare: prices.length > 0 ? Number((prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2)) : null,
      min_fare: minPrices.length > 0 ? Math.min(...minPrices) : null,
      max_fare: maxPrices.length > 0 ? Math.max(...maxPrices) : null,
    });
  }

  const corridorSummaries: any[] = [];
  let activeCorridorsCount = 0;
  let observedWeightTotal = 0.0;

  for (const [code, info] of Object.entries(DGCA_CORRIDORS)) {
    if (corridorLatest[code]) {
      const cl = corridorLatest[code];
      const curAvg = cl.avg_price != null ? Number(cl.avg_price) : null;
      const bAvg = cl.base_avg != null ? Number(cl.base_avg) : null;
      const capix = corridorApix(curAvg, bAvg);
      activeCorridorsCount += 1;
      observedWeightTotal += info.weight;

      corridorSummaries.push({
        corridor: code,
        name: info.name,
        weight: info.weight,
        weight_pct: Number((info.weight * 100.0).toFixed(2)),
        is_basket: true,
        is_observed: true,
        current_avg: curAvg,
        min_price: cl.min_price != null ? Number(cl.min_price) : null,
        max_price: cl.max_price != null ? Number(cl.max_price) : null,
        base_avg: bAvg,
        corridor_apix: capix,
        sample_count: Number(cl.sample_count || 0),
        last_scraped_at: cl.latest_scrape ? new Date(cl.latest_scrape).toISOString() : null,
      });
    } else {
      corridorSummaries.push(missingCorridorEntry(code, info));
    }
  }

  // Non-basket corridors observed in data
  for (const [code, cl] of Object.entries(corridorLatest)) {
    if (!DGCA_CORRIDORS[code]) {
      const curAvg = cl.avg_price != null ? Number(cl.avg_price) : null;
      const bAvg = cl.base_avg != null ? Number(cl.base_avg) : null;
      corridorSummaries.push({
        corridor: code,
        name: code,
        weight: 0.0,
        weight_pct: 0.0,
        is_basket: false,
        is_observed: true,
        current_avg: curAvg,
        min_price: cl.min_price != null ? Number(cl.min_price) : null,
        max_price: cl.max_price != null ? Number(cl.max_price) : null,
        base_avg: bAvg,
        corridor_apix: corridorApix(curAvg, bAvg),
        sample_count: Number(cl.sample_count || 0),
        last_scraped_at: cl.latest_scrape ? new Date(cl.latest_scrape).toISOString() : null,
      });
    }
  }

  const latestNationalApix = [...timeseries].reverse().find((pt) => pt.national_apix != null)?.national_apix ?? null;

  let freshnessMinutes: number | null = null;
  if (newestScrapeDt) {
    freshnessMinutes = Math.max(0, Math.floor((Date.now() - newestScrapeDt.getTime()) / 60000));
  }

  const obsFares = corridorSummaries.map((c) => c.current_avg).filter((v) => v != null) as number[];
  const baseFares = corridorSummaries.map((c) => c.base_avg).filter((v) => v != null) as number[];

  return {
    national_apix: latestNationalApix,
    formula: 'Lowe Index: 100 × [sum_{i in observed} w_i × (P_{it} / P_{i0})] / [sum_{i in observed} w_i]',
    weights_basis: 'DGCA FY 2024-25 Scheduled Domestic Passenger Traffic',
    basket_coverage_pct: Number((observedWeightTotal * 100.0).toFixed(2)),
    active_corridors_count: activeCorridorsCount,
    total_basket_corridors: 6,
    latest_scrape_timestamp: newestScrapeDt ? newestScrapeDt.toISOString() : null,
    freshness_minutes: freshnessMinutes,
    overall_avg_fare: obsFares.length > 0 ? Number((obsFares.reduce((a, b) => a + b, 0) / obsFares.length).toFixed(2)) : null,
    overall_base_avg_fare: baseFares.length > 0 ? Number((baseFares.reduce((a, b) => a + b, 0) / baseFares.length).toFixed(2)) : null,
    corridors: corridorSummaries,
    timeseries,
  };
}

export function missingCorridorEntry(code: string, info: any): any {
  return {
    corridor: code,
    name: info.name,
    weight: info.weight,
    weight_pct: Number((info.weight * 100.0).toFixed(2)),
    is_basket: true,
    is_observed: false,
    current_avg: null,
    min_price: null,
    max_price: null,
    base_avg: null,
    corridor_apix: null,
    sample_count: 0,
    last_scraped_at: null,
  };
}

export function emptyApixSummary(): any {
  return {
    national_apix: null,
    formula: 'Lowe Index: 100 × [sum_{i in observed} w_i × (P_{it} / P_{i0})] / [sum_{i in observed} w_i]',
    weights_basis: 'DGCA FY 2024-25 Scheduled Domestic Passenger Traffic',
    basket_coverage_pct: 0.0,
    active_corridors_count: 0,
    total_basket_corridors: 6,
    latest_scrape_timestamp: null,
    freshness_minutes: null,
    overall_avg_fare: null,
    overall_base_avg_fare: null,
    corridors: Object.entries(DGCA_CORRIDORS).map(([code, info]) => missingCorridorEntry(code, info)),
    timeseries: [],
  };
}

export function computeCorridorDecomposition(rows: any[]): any[] {
  const res: any[] = [];
  for (const r of rows) {
    const corridor = r.corridor;
    if (!DGCA_CORRIDORS[corridor]) continue;
    const info = DGCA_CORRIDORS[corridor];
    const baseAvg = r.base_avg != null ? Number(r.base_avg) : null;
    const currAvg = r.avg_price != null ? Number(r.avg_price) : null;
    const prevAvg = r.prev_avg != null ? Number(r.prev_avg) : null;

    const current_apix = corridorApix(currAvg, baseAvg);
    const prev_apix = corridorApix(prevAvg, baseAvg);
    const contribution =
      current_apix != null && prev_apix != null
        ? Number((info.weight * (current_apix - prev_apix)).toFixed(4))
        : null;

    res.push({
      corridor,
      name: info.name,
      weight: info.weight,
      weight_pct: Number((info.weight * 100).toFixed(2)),
      current_apix,
      prev_apix,
      contribution,
      current_avg: currAvg,
      base_avg: baseAvg,
      sample_count: Number(r.sample_count || 0),
    });
  }

  res.sort((a, b) => Math.abs(b.contribution || 0) - Math.abs(a.contribution || 0));
  return res;
}

export function enrichLeadtimeRows(rows: any[]): any[] {
  const res: any[] = [];
  for (const r of rows) {
    const info = DGCA_CORRIDORS[r.corridor];
    if (!info) continue;
    res.push({
      corridor: r.corridor,
      corridor_name: info.name,
      lead_bucket: r.lead_bucket,
      lead_label: r.lead_label,
      avg_price: r.avg_price != null ? Number(r.avg_price) : null,
      min_price: r.min_price != null ? Number(r.min_price) : null,
      max_price: r.max_price != null ? Number(r.max_price) : null,
      sample_count: Number(r.sample_count || 0),
    });
  }
  return res;
}
