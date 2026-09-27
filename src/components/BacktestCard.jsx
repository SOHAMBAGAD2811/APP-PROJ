import { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink, Activity, Award, BarChart2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BacktestCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Prefer the real DGCA benchmark endpoint; fall back to the live-only backtest
    fetch('/api/backtest/dgca')
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(json => { setData(json); setLoading(false); })
      .catch(err => {
        // Fallback: try the log-change live backtest
        fetch('/api/backtest')
          .then(res => res.ok ? res.json() : null)
          .then(json => { setData(json ? { _fallback: true, ...json } : null); setLoading(false); })
          .catch(() => { setError('Could not load backtest data.'); setLoading(false); });
      });
  }, []);

  // ── Determine data source and whether real benchmark is loaded ──────────────
  const isBenchmarkEndpoint = data && !data._fallback;
  const benchmarkLoaded     = isBenchmarkEndpoint && data.benchmark_loaded;
  const national            = isBenchmarkEndpoint
    ? (data.national || {})
    : (data?.national || {});

  const hasStats = national.pearson_r != null;

  // ── Metric display ──────────────────────────────────────────────────────────
  const displayR     = hasStats ? national.pearson_r.toFixed(3) : '—';
  const displayRmse  = hasStats
    ? (national.rmse_inr != null ? `₹${national.rmse_inr.toFixed(0)}` : national.rmse?.toFixed(4) ?? '—')
    : '—';
  const displayTheil = hasStats
    ? (national.theils_u != null ? national.theils_u.toFixed(3) : '—')
    : '—';
  const obsCount     = national.obs_count ?? 0;

  if (loading) {
    return (
      <div className="glass-sm" style={{ padding: '18px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Loading backtest data…
      </div>
    );
  }

  return (
    <div className="glass-sm" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Award size={18} color="var(--accent-1)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              MoSPI eSankhyiki &amp; DGCA Historical Backtesting
            </span>
            {benchmarkLoaded ? (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: 'var(--green-bg)', color: 'var(--green-text)',
                border: '1px solid var(--green-border)', borderRadius: 4, padding: '2px 7px',
              }}>
                ✓ DGCA Benchmark Loaded
              </span>
            ) : (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: '#fef3c7', color: '#92400e',
                border: '1px solid #fde68a', borderRadius: 4, padding: '2px 7px',
              }}>
                Live Log-Change Only
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {benchmarkLoaded
              ? `Empirical validation against ${data.benchmark_months} months of DGCA reference fares (${data.benchmark_source?.split('(')[1]?.replace(')', '') ?? 'ICRA/industry estimates'}).`
              : 'Comparing daily AiRa index movements against the live scraped fare series (log-change method).'}
          </div>
        </div>

        <a
          href="https://esankhyiki.mospi.gov.in"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', padding: '5px 10px', textDecoration: 'none' }}
        >
          <span>MoSPI eSankhyiki Portal</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Insufficient data notice */}
      {!hasStats && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem',
          color: '#fbbf24',
        }}>
          <AlertCircle size={16} />
          <span>
            Insufficient scraped history for statistical comparison.
            Run a basket sweep to populate corridor price data,
            then correlation metrics will appear here automatically.
          </span>
        </div>
      )}

      {/* Validation Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="glass" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pearson Correlation (r)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasStats ? '#10b981' : 'var(--text-muted)', marginTop: 4 }}>
            {displayR}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {hasStats
              ? (benchmarkLoaded ? 'vs DGCA reference fares' : 'Live time series correlation')
              : 'Awaiting scraped history'}
          </div>
        </div>

        <div className="glass" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {benchmarkLoaded ? 'RMSE (INR)' : 'RMSE (Log-Change)'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasStats ? 'var(--accent-1)' : 'var(--text-muted)', marginTop: 4 }}>
            {displayRmse}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {benchmarkLoaded ? 'vs DGCA benchmark' : 'Low tracking dispersion'}
          </div>
        </div>

        <div className="glass" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Theil's U Inequality
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasStats ? '#3b82f6' : 'var(--text-muted)', marginTop: 4 }}>
            {displayTheil}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            U &lt; 0.2 = Superior forecasting accuracy
          </div>
        </div>

        <div className="glass" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Statistical Specification
          </div>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
            {benchmarkLoaded ? 'APIx_scraped vs DGCA_ref' : 'Δln(APIx) vs Δln(DGCA)'}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {obsCount > 0 ? `n = ${obsCount} observations` : '30-day rolling evaluation'}
          </div>
        </div>
      </div>

      {/* Benchmark DGCA corridor table (when benchmark loaded) */}
      {benchmarkLoaded && data.corridors?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Per-Corridor DGCA Benchmark Comparison:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.corridors.map(c => (
              <span key={c.corridor} style={{
                background: 'var(--accent-light)', border: '1px solid #bfdbfe',
                borderRadius: 4, padding: '4px 10px', fontSize: '0.74rem',
                color: 'var(--text-secondary)',
              }}>
                <strong style={{ color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>{c.corridor}</strong>
                {c.dgca_latest_fare
                  ? ` DGCA: ₹${c.dgca_latest_fare.toLocaleString()}`
                  : ' (no DGCA data)'}
                {c.common_months > 0 && ` · ${c.common_months}mo`}
                {c.pearson_r != null && ` · r=${c.pearson_r.toFixed(2)}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live backtest corridor breakdown (fallback mode) */}
      {!benchmarkLoaded && data?.corridors?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Observed Corridor Log-Movement Volatility:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.corridors.map(c => (
              <span key={c.corridor} style={{
                background: 'var(--accent-light)', border: '1px solid #bfdbfe',
                borderRadius: 4, padding: '4px 8px', fontSize: '0.74rem',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--accent-2)', fontFamily: 'JetBrains Mono' }}>{c.corridor}</strong> ({c.name}): σ = {(c.std_log_change || 0).toFixed(3)}, n = {c.obs_count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footnote */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        {benchmarkLoaded
          ? `Benchmark: ${data.benchmark_source}. Methodology: ${data.methodology}`
          : 'Methodology reference: Ministry of Statistics & Programme Implementation (MoSPI) Data Standards for High-Frequency Price Statistics.'}
      </div>
    </div>
  );
}
