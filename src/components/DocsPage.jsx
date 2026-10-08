import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  Database,
  FileText,
  BarChart3,
  Zap,
  Lock,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Layers,
  RefreshCw,
  Server,
  Shield,
  Landmark,
} from 'lucide-react';

// ── Copy-to-clipboard button ──────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button className="docs-copy-btn" onClick={handleCopy} title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'json' }) {
  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-lang">{lang.toUpperCase()}</span>
        <CopyButton text={code} />
      </div>
      <pre className="docs-code-pre"><code>{code}</code></pre>
    </div>
  );
}

// ── Method badge ──────────────────────────────────────────────────────────────
function Method({ type }) {
  return <span className={`docs-method docs-method-${type.toLowerCase()}`}>{type}</span>;
}

// ── Section anchor wrapper ────────────────────────────────────────────────────
function DocSection({ id, children }) {
  return <section className="docs-section" id={id}>{children}</section>;
}

// ── Sidebar links ─────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',       label: 'Overview',            icon: Layers },
  { id: 'authentication', label: 'Authentication',       icon: Lock },
  { id: 'apix-summary',   label: 'GET /api/apix/summary', icon: BarChart3 },
  { id: 'apix-series',    label: 'GET /api/apix/series',  icon: RefreshCw },
  { id: 'apix-corridors', label: 'GET /api/apix/corridors', icon: Database },
  { id: 'export-csv',     label: 'GET /api/export/csv',   icon: FileText },
  { id: 'export-bulletin',label: 'GET /api/export/bulletin', icon: FileText },
  { id: 'simulate',       label: 'POST /api/simulate',    icon: Zap },
  { id: 'metrics',        label: 'GET /metrics',          icon: Server },
  { id: 'errors',         label: 'Error Codes',           icon: Code2 },
];

export default function DocsPage({ onGoToLanding }) {
  const [activeSection, setActiveSection] = useState('overview');

  function scrollTo(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="docs-root">
      {/* ── Sidebar ── */}
      <aside className="docs-sidebar">
        <div className="docs-sidebar-header">
          <div className="docs-sidebar-logo">
            <Terminal size={16} />
            <span>AiRA API</span>
          </div>
          <span className="docs-version-badge">v1.0</span>
        </div>

        <div className="docs-sidebar-section-label">Reference</div>
        <nav className="docs-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`docs-nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => scrollTo(id)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="docs-sidebar-footer">
          <a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="docs-ext-link">
            MoSPI Portal <ExternalLink size={11} />
          </a>
          <a href="https://www.dgca.gov.in" target="_blank" rel="noopener noreferrer" className="docs-ext-link">
            DGCA Statistics <ExternalLink size={11} />
          </a>
          <a href="https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="docs-ext-link" style={{ color: 'var(--accent-1)' }}>
            Manual Calc (Drive) <ExternalLink size={11} />
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="docs-main">
        {/* Top bar */}
        <div className="docs-topbar">
          <button className="docs-back-btn" onClick={onGoToLanding}>
            ← Back to Overview
          </button>
          <div className="docs-topbar-right">
            <span className="docs-base-url">Base URL: <code>https://aira.mospi.gov.in</code></span>
          </div>
        </div>

        <div className="docs-content">

          {/* ── Overview ── */}
          <DocSection id="overview">
            <div className="docs-page-header">
              <div className="docs-page-kicker">
                <Landmark size={14} />
                <span>MoSPI · DIID · AiRA System</span>
              </div>
              <h1 className="docs-page-title">API Reference</h1>
              <p className="docs-page-subtitle">
                The AiRA REST API provides machine-consumable access to the India Domestic Airfare Price Index (APIx),
                historical fare series, corridor weights, and policy simulation. All endpoints return JSON unless noted.
              </p>
            </div>

            <div className="docs-info-grid">
              <div className="docs-info-card">
                <div className="docs-info-card-label">Protocol</div>
                <div className="docs-info-card-value">HTTPS only</div>
              </div>
              <div className="docs-info-card">
                <div className="docs-info-card-label">Authentication</div>
                <div className="docs-info-card-value">Bearer JWT</div>
              </div>
              <div className="docs-info-card">
                <div className="docs-info-card-label">Rate Limit</div>
                <div className="docs-info-card-value">120 req / min</div>
              </div>
              <div className="docs-info-card">
                <div className="docs-info-card-label">Data Format</div>
                <div className="docs-info-card-value">JSON (UTF-8)</div>
              </div>
              <div className="docs-info-card">
                <div className="docs-info-card-label">Index Base</div>
                <div className="docs-info-card-value">2024-Q1 = 100</div>
              </div>
              <div className="docs-info-card">
                <div className="docs-info-card-label">Update Cadence</div>
                <div className="docs-info-card-value">Daily · 02:00 IST</div>
              </div>
            </div>
          </DocSection>

          {/* ── Authentication ── */}
          <DocSection id="authentication">
            <h2 className="docs-section-title">
              <Lock size={18} /> Authentication
            </h2>
            <p className="docs-prose">
              All endpoints require a valid JWT issued by the AiRA institutional identity provider. Pass the token
              in the <code>Authorization</code> header using the Bearer scheme.
            </p>
            <CodeBlock lang="bash" code={`curl -X POST "https://aira.mospi.gov.in/api/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "nso_analyst", "password": "<password>"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "role": "nso_analyst"
}`} />
            <p className="docs-prose">
              Use the token in subsequent requests:
            </p>
            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer <token>" \\
  "https://aira.mospi.gov.in/api/apix/summary"`} />
            <div className="docs-callout docs-callout-note">
              <strong>Token expiry:</strong> Tokens expire after 24 hours. Refresh using the same
              <code>/api/auth/token</code> endpoint.
            </div>
          </DocSection>

          {/* ── GET /api/apix/summary ── */}
          <DocSection id="apix-summary">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/api/apix/summary</code>
            </div>
            <h2 className="docs-section-title">Current Index Summary</h2>
            <p className="docs-prose">
              Returns the latest composite Airfare Price Index value, 24-hour delta, base period metadata,
              and per-corridor breakdown with DGCA passenger weights.
            </p>

            <h3 className="docs-sub-title">Query Parameters</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Parameter</span><span>Type</span><span>Default</span><span>Description</span>
              </div>
              <div className="docs-param-row">
                <code>lead_time</code><span>string</span><span><code>T7</code></span>
                <span>Advance-purchase window. One of <code>T1</code>, <code>T7</code>, <code>T15</code>, <code>T30</code>, <code>T45</code>.</span>
              </div>
              <div className="docs-param-row">
                <code>as_of</code><span>date</span><span>today</span>
                <span>ISO 8601 date (<code>YYYY-MM-DD</code>). Returns index as of that date.</span>
              </div>
            </div>

            <h3 className="docs-sub-title">Example Request</h3>
            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer <token>" \\
  "https://aira.mospi.gov.in/api/apix/summary?lead_time=T7"`} />

            <h3 className="docs-sub-title">Response</h3>
            <CodeBlock lang="json" code={`{
  "apix": 114.82,
  "base_period": "2024-Q1 = 100.0",
  "lead_time": "T7",
  "as_of": "2025-09-28",
  "change_24h": "+1.42%",
  "change_7d": "+3.18%",
  "basket_corridors": 6,
  "weights_source": "DGCA Domestic Traffic FY 2024-25",
  "corridor_breakdown": {
    "DEL-BOM": { "index": 118.2, "weight": 0.245, "median_base_fare": 6450 },
    "DEL-BLR": { "index": 112.4, "weight": 0.198, "median_base_fare": 7100 },
    "BOM-BLR": { "index": 109.8, "weight": 0.172, "median_base_fare": 4850 },
    "DEL-CCU": { "index": 116.5, "weight": 0.141, "median_base_fare": 6920 },
    "MAA-DEL": { "index": 115.1, "weight": 0.126, "median_base_fare": 7340 },
    "BLR-HYD": { "index": 108.3, "weight": 0.118, "median_base_fare": 3890 }
  }
}`} />
          </DocSection>

          {/* ── GET /api/apix/series ── */}
          <DocSection id="apix-series">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/api/apix/series</code>
            </div>
            <h2 className="docs-section-title">Historical Index Series</h2>
            <p className="docs-prose">
              Returns a time-bucketed series of APIx values for use in econometric modeling,
              CPI component analysis, or charting.
            </p>

            <h3 className="docs-sub-title">Query Parameters</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Parameter</span><span>Type</span><span>Default</span><span>Description</span>
              </div>
              <div className="docs-param-row">
                <code>interval</code><span>string</span><span><code>daily</code></span>
                <span>Aggregation window. <code>daily</code>, <code>weekly</code>, or <code>monthly</code>.</span>
              </div>
              <div className="docs-param-row">
                <code>from</code><span>date</span><span>90 days ago</span>
                <span>Series start date in ISO 8601 format.</span>
              </div>
              <div className="docs-param-row">
                <code>to</code><span>date</span><span>today</span>
                <span>Series end date in ISO 8601 format.</span>
              </div>
              <div className="docs-param-row">
                <code>lead_time</code><span>string</span><span><code>T7</code></span>
                <span>Advance-purchase window to use for index calculation.</span>
              </div>
              <div className="docs-param-row">
                <code>corridor</code><span>string</span><span><em>all</em></span>
                <span>Filter to a single corridor, e.g. <code>DEL-BOM</code>.</span>
              </div>
            </div>

            <h3 className="docs-sub-title">Example Request</h3>
            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer <token>" \\
  "https://aira.mospi.gov.in/api/apix/series?interval=monthly&from=2024-01-01&lead_time=T15"`} />

            <h3 className="docs-sub-title">Response</h3>
            <CodeBlock lang="json" code={`{
  "interval": "monthly",
  "lead_time": "T15",
  "from": "2024-01-01",
  "to": "2025-09-01",
  "series": [
    { "bucket": "2024-01-01", "apix": 100.0,  "observations": 864 },
    { "bucket": "2024-02-01", "apix": 102.3,  "observations": 780 },
    { "bucket": "2024-03-01", "apix": 107.1,  "observations": 864 },
    { "bucket": "2024-04-01", "apix": 105.8,  "observations": 810 }
  ]
}`} />
          </DocSection>

          {/* ── GET /api/apix/corridors ── */}
          <DocSection id="apix-corridors">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/api/apix/corridors</code>
            </div>
            <h2 className="docs-section-title">Corridor Weights &amp; Metadata</h2>
            <p className="docs-prose">
              Returns the full DGCA representative corridor basket with official passenger traffic weights,
              airport metadata, and daily flight frequency.
            </p>

            <h3 className="docs-sub-title">Example Request</h3>
            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer <token>" \\
  "https://aira.mospi.gov.in/api/apix/corridors"`} />

            <h3 className="docs-sub-title">Response</h3>
            <CodeBlock lang="json" code={`{
  "weights_source": "DGCA Domestic Traffic Report FY 2024-25",
  "total_coverage": "~60% national domestic passenger volume",
  "corridors": [
    {
      "pair": "DEL-BOM",
      "origin_iata": "DEL",
      "dest_iata":   "BOM",
      "origin_name": "Indira Gandhi International",
      "dest_name":   "Chhatrapati Shivaji Maharaj International",
      "dgca_share":  0.245,
      "distance_km": 1148,
      "daily_flights": 85,
      "type": "High Density Trunk"
    }
  ]
}`} />
          </DocSection>

          {/* ── GET /api/export/csv ── */}
          <DocSection id="export-csv">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/api/export/csv</code>
            </div>
            <h2 className="docs-section-title">Open Government Data CSV Export</h2>
            <p className="docs-prose">
              Downloads a sanitized, OGD-compliant CSV of raw fare records. Each row represents one
              scraped fare observation with unbundled cost components.
            </p>

            <h3 className="docs-sub-title">Query Parameters</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Parameter</span><span>Type</span><span>Default</span><span>Description</span>
              </div>
              <div className="docs-param-row">
                <code>from</code><span>date</span><span>30 days ago</span>
                <span>Export window start.</span>
              </div>
              <div className="docs-param-row">
                <code>to</code><span>date</span><span>today</span>
                <span>Export window end.</span>
              </div>
              <div className="docs-param-row">
                <code>corridor</code><span>string</span><span><em>all</em></span>
                <span>Filter to a single corridor, e.g. <code>BOM-BLR</code>.</span>
              </div>
            </div>

            <h3 className="docs-sub-title">CSV Schema</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Column</span><span>Type</span><span>-</span><span>Description</span>
              </div>
              {[
                ['scraped_at','timestamp','','UTC timestamp of the scraping event'],
                ['corridor','string','','e.g. DEL-BOM'],
                ['lead_time_days','integer','','Days before departure (1, 7, 15, 30, 45)'],
                ['carrier','string','','IATA carrier code, e.g. 6E'],
                ['source','string','','indigo | airindia | easemytrip | cleartrip | google'],
                ['base_fare_inr','numeric','','Unbundled airline revenue component'],
                ['udf_psf_inr','numeric','','AERA airport user development fee'],
                ['gst_inr','numeric','','Goods & Services Tax'],
                ['platform_fee_inr','numeric','','OTA convenience fee'],
                ['total_fare_inr','numeric','','Sum of all components'],
                ['outlier_flag','boolean','','true if excluded by log-MAD filter'],
                ['status','string','','scraped | sold_out | locf_imputed'],
              ].map(([col, type, , desc]) => (
                <div key={col} className="docs-param-row">
                  <code>{col}</code><span>{type}</span><span></span><span>{desc}</span>
                </div>
              ))}
            </div>
          </DocSection>

          {/* ── GET /api/export/bulletin ── */}
          <DocSection id="export-bulletin">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/api/export/bulletin</code>
            </div>
            <h2 className="docs-section-title">MoSPI Statistical Bulletin</h2>
            <p className="docs-prose">
              Returns a formatted text bulletin ready for publication by the MoSPI Price Statistics Division.
              Follows the standard PSD periodic release format.
            </p>

            <h3 className="docs-sub-title">Query Parameters</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Parameter</span><span>Type</span><span>Default</span><span>Description</span>
              </div>
              <div className="docs-param-row">
                <code>format</code><span>string</span><span><code>text</code></span>
                <span><code>text</code> or <code>json</code> structured bulletin.</span>
              </div>
              <div className="docs-param-row">
                <code>as_of</code><span>date</span><span>today</span>
                <span>Bulletin reference date.</span>
              </div>
            </div>

            <h3 className="docs-sub-title">Example Request</h3>
            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer <token>" \\
  "https://aira.mospi.gov.in/api/export/bulletin?format=json"`} />

            <h3 className="docs-sub-title">Response (format=json)</h3>
            <CodeBlock lang="json" code={`{
  "bulletin_id": "PSD-APIx-2025-09-28",
  "title": "India Domestic Airfare Price Index — Periodic Release",
  "reference_date": "2025-09-28",
  "composite_apix": 114.82,
  "base_period": "2024-Q1 = 100.0",
  "month_on_month_change": "+2.1%",
  "year_on_year_change": "+14.8%",
  "methodology": "Lowe Price Index (PSD specification)",
  "corridors_in_basket": 6,
  "observations_used": 5184
}`} />
          </DocSection>

          {/* ── POST /api/simulate ── */}
          <DocSection id="simulate">
            <div className="docs-endpoint-header">
              <Method type="POST" />
              <code className="docs-endpoint-path">/api/simulate</code>
            </div>
            <h2 className="docs-section-title">What-If Policy Simulation</h2>
            <p className="docs-prose">
              Runs a parametric shock simulation on the APIx airfare series. Useful for modeling the impact of ATF
              price changes or demand shifts on the CPI transport component.
            </p>

            <h3 className="docs-sub-title">Request Body</h3>
            <CodeBlock lang="json" code={`{
  "atf_change_pct": 12.5,
  "demand_elasticity": -0.8,
  "lead_time": "T15",
  "corridors": ["DEL-BOM", "DEL-BLR"]
}`} />

            <h3 className="docs-sub-title">Request Fields</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Field</span><span>Type</span><span>Required</span><span>Description</span>
              </div>
              <div className="docs-param-row">
                <code>atf_change_pct</code><span>number</span><span>Yes</span>
                <span>Aviation Turbine Fuel price change as a percentage (positive = increase).</span>
              </div>
              <div className="docs-param-row">
                <code>demand_elasticity</code><span>number</span><span>No</span>
                <span>Price elasticity of demand. Defaults to <code>-0.6</code>.</span>
              </div>
              <div className="docs-param-row">
                <code>lead_time</code><span>string</span><span>No</span>
                <span>Advance-purchase window to apply shock to. Defaults to all windows.</span>
              </div>
              <div className="docs-param-row">
                <code>corridors</code><span>array</span><span>No</span>
                <span>Subset of corridors to apply shock to. Defaults to all 6.</span>
              </div>
            </div>

            <h3 className="docs-sub-title">Response</h3>
            <CodeBlock lang="json" code={`{
  "baseline_apix": 114.82,
  "simulated_apix": 121.4,
  "absolute_delta": 6.58,
  "pct_delta": "+5.73%",
  "atf_change_pct": 12.5,
  "demand_elasticity": -0.8,
  "corridor_impact": {
    "DEL-BOM": { "baseline": 118.2, "simulated": 124.9, "delta_pct": "+5.67%" },
    "DEL-BLR": { "baseline": 112.4, "simulated": 118.8, "delta_pct": "+5.70%" }
  }
}`} />
          </DocSection>

          {/* ── GET /metrics ── */}
          <DocSection id="metrics">
            <div className="docs-endpoint-header">
              <Method type="GET" />
              <code className="docs-endpoint-path">/metrics</code>
            </div>
            <h2 className="docs-section-title">Prometheus Metrics</h2>
            <p className="docs-prose">
              Exposes operational telemetry in Prometheus text format. Covers scraper job health,
              database row counts, and index computation latency. No authentication required from
              within the government intranet; external access requires a valid JWT.
            </p>

            <h3 className="docs-sub-title">Key Metrics</h3>
            <div className="docs-params-table">
              <div className="docs-param-row docs-param-header">
                <span>Metric</span><span>Type</span><span>-</span><span>Description</span>
              </div>
              {[
                ['aira_scrape_jobs_total','counter','','Total scraping jobs executed, labelled by corridor and source'],
                ['aira_scrape_duration_seconds','histogram','','Scraping job latency distribution'],
                ['aira_fare_rows_total','gauge','','Total fare rows in TimescaleDB hypertable'],
                ['aira_outliers_flagged_total','counter','','Rows flagged by log-MAD filter'],
                ['aira_index_computed_at','gauge','','Unix timestamp of last successful index computation'],
                ['aira_apix_value','gauge','','Current composite APIx value'],
              ].map(([m, t, , d]) => (
                <div key={m} className="docs-param-row">
                  <code style={{ fontSize: '0.78rem' }}>{m}</code><span>{t}</span><span></span><span>{d}</span>
                </div>
              ))}
            </div>

            <h3 className="docs-sub-title">Example Scrape</h3>
            <CodeBlock lang="bash" code={`# From Prometheus scrape config:
curl "https://aira.mospi.gov.in/metrics"

# Sample output:
# HELP aira_apix_value Current composite Airfare Price Index
# TYPE aira_apix_value gauge
aira_apix_value 114.82
aira_fare_rows_total 54321
aira_scrape_jobs_total{corridor="DEL-BOM",source="indigo"} 187`} />
          </DocSection>

          {/* ── Error Codes ── */}
          <DocSection id="errors">
            <h2 className="docs-section-title">
              <Code2 size={18} /> Error Codes
            </h2>
            <p className="docs-prose">
              All error responses follow a consistent JSON envelope with a machine-readable <code>code</code> and
              a human-readable <code>message</code>.
            </p>

            <CodeBlock lang="json" code={`{
  "error": {
    "code": "INVALID_LEAD_TIME",
    "message": "lead_time must be one of: T1, T7, T15, T30, T45",
    "status": 400
  }
}`} />

            <div className="docs-params-table" style={{ marginTop: 24 }}>
              <div className="docs-param-row docs-param-header">
                <span>HTTP Status</span><span>Code</span><span>-</span><span>Meaning</span>
              </div>
              {[
                ['400','INVALID_PARAMETER','','A query parameter or body field has an invalid value'],
                ['401','UNAUTHORIZED','','Missing or expired JWT token'],
                ['403','FORBIDDEN','','Valid token but insufficient role permissions'],
                ['404','NOT_FOUND','','The requested resource or corridor does not exist'],
                ['422','NO_DATA_AVAILABLE','','Query succeeded but no observations match the filters'],
                ['429','RATE_LIMIT_EXCEEDED','','More than 120 requests per minute from the same token'],
                ['500','INTERNAL_ERROR','','Unexpected server error — contact aira-support@mospi.gov.in'],
                ['503','INDEX_NOT_READY','','Daily index computation has not yet completed for today'],
              ].map(([status, code, , desc]) => (
                <div key={code} className="docs-param-row">
                  <code>{status}</code><code style={{ fontSize: '0.78rem' }}>{code}</code><span></span><span>{desc}</span>
                </div>
              ))}
            </div>
          </DocSection>

        </div>
      </main>
    </div>
  );
}
