import React, { useState, useEffect } from 'react';
import {
  Plane,
  Shield,
  Database,
  BarChart3,
  LineChart,
  CheckCircle2,
  ArrowRight,
  Layers,
  Activity,
  Clock,
  RefreshCw,
  Landmark,
  Building2,
  FileText,
  Terminal,
  Cpu,
  Server,
  Zap,
  Check,
  ChevronRight,
  ExternalLink,
  Table,
  Sliders,
  TrendingUp,
  Scale,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';

export default function LandingPage({ onLaunchTerminal, onGoToAuth, onGoToDocs }) {
  const [slideIndex, setSlideIndex] = useState(0);

  const heroSlides = [
    { src: '/images/hero-airport-tarmac.jpg' },
    { src: '/images/hero-flight-clouds.jpg' },
    { src: '/images/hero-flight-wing.jpg' },
  ];

  useEffect(() => {
    const t = setInterval(() => setSlideIndex(p => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  // Simplified comparison data
  const comparisonData = [
    {
      feature: 'Data Collection',
      existing: 'Manual field visits, 30–45 day lag',
      aira: 'Automated daily scraping of IndiGo, Air India, EaseMyTrip & Cleartrip',
      tag: 'Scraping'
    },
    {
      feature: 'Booking Windows',
      existing: 'Single spot price only (T+0)',
      aira: 'Five windows: T+1, T+7, T+15, T+30, T+45 days',
      tag: 'Yield Grid'
    },
    {
      feature: 'Route Weighting',
      existing: 'Simple average, no passenger context',
      aira: 'DGCA passenger traffic weights for top 6 corridors (~60% of India)',
      tag: 'DGCA Weights'
    },
    {
      feature: 'Index Method',
      existing: 'Simple price ratio, no base normalization',
      aira: 'MoSPI Lowe Price Index: Iₜ = 100 × [∑ wᵢ(Pᵢₜ/Pᵢ₀) / ∑ wᵢ]',
      tag: 'Lowe Formula'
    },
    {
      feature: 'Validation',
      existing: 'No backtesting',
      aira: '18-month DGCA backtest — Pearson r = 0.942',
      tag: 'Backtested'
    },
    {
      feature: 'Output Format',
      existing: 'Manual PDF bulletins',
      aira: 'REST JSON APIs, CSV exports, auto-generated MoSPI bulletins',
      tag: 'APIs & Feeds'
    },
  ];

  // Stakeholder portals — simplified
  const rolePortals = [
    {
      id: 'mospi',
      role: 'For MoSPI Economists',
      dept: 'Price Statistics Division',
      desc: 'Official Lowe Price Index engine, base period normalization, and monthly statistical bulletin generation.',
      actionText: 'Open MoSPI Dashboard',
      icon: Landmark,
      colorClass: 'portal-navy',
    },
    {
      id: 'rbi',
      role: 'For RBI Analysts',
      dept: 'Monetary Policy Department',
      desc: 'High-frequency daily inflation telemetry and ATF fuel shock simulation engine.',
      actionText: 'Open RBI Dashboard',
      icon: TrendingUp,
      colorClass: 'portal-teal',
    },
    {
      id: 'dgca',
      role: 'For DGCA Regulators',
      dept: 'Tariff Monitoring Cell',
      desc: 'Corridor fare transparency, fare unbundling (Base, UDF, GST), and surge detection.',
      actionText: 'Open DGCA Dashboard',
      icon: Plane,
      colorClass: 'portal-emerald',
    },
  ];

  // Simplified pipeline
  const pipeline = [
    { n: 1, icon: Plane, title: 'Carrier Scraping', desc: 'IndiGo, Air India, EaseMyTrip, Cleartrip & Google Flights', meta: 'Playwright' },
    { n: 2, icon: Shield, title: 'Ethics Check', desc: 'RFC 9309 robots.txt compliance & polite rate limits', meta: 'Gov Standard' },
    { n: 3, icon: Sliders, title: 'Data Cleaning', desc: 'Log-MAD outlier filter & LOCF imputation', meta: 'Robust Stats' },
    { n: 4, icon: Database, title: 'Storage', desc: 'TimescaleDB hypertables with daily, weekly, monthly rollups', meta: 'PostgreSQL' },
    { n: 5, icon: Server, title: 'APIs & Reports', desc: 'REST JSON, CSV exports & MoSPI Statistical Bulletins', meta: 'Public Feeds' },
  ];

  return (
    <div className="landing-page-root anim-fade-in">

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-bg-carousel" aria-hidden="true">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.src}
              className={`hero-bg-slide ${idx === slideIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.src})` }}
            />
          ))}
          <div className="hero-bg-overlay" />
        </div>

        <div className="landing-hero-inner">
          <div className="landing-hero-kicker">
            <span className="badge badge-accent">DIID · AiRA</span>
            <span className="kicker-tag">India Airfare Price Intelligence</span>
          </div>

          <h1 className="landing-hero-title">
            India Airfare Price Index <span className="title-accent">(APIx)</span>
          </h1>

          <p className="landing-hero-subtitle">
            Daily flight price tracker across 6 major Indian routes — built to help MoSPI, RBI & DGCA measure aviation inflation in real time.
          </p>

          <div className="landing-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onLaunchTerminal?.()}>
              <Terminal size={18} />
              Open Live Terminal
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onGoToAuth}>
              <Shield size={18} />
              Institutional Sign In
            </button>
          </div>

          {/* 4 Key Stats */}
          <div className="landing-stats-grid">
            <div className="landing-stat-card">
              <div className="stat-icon-row"><Plane size={14} style={{ color: '#94a3b8' }} /></div>
              <div className="stat-num">6 Routes</div>
              <div className="stat-label">DGCA Weighted Corridors</div>
              <div className="stat-sub">DEL-BOM, DEL-BLR + 4 more</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-icon-row"><TrendingUp size={14} style={{ color: '#94a3b8' }} /></div>
              <div className="stat-num">r = 0.942</div>
              <div className="stat-label">Pearson Correlation</div>
              <div className="stat-sub">18-month DGCA backtest</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-icon-row"><RefreshCw size={14} style={{ color: '#94a3b8' }} /></div>
              <div className="stat-num">Daily</div>
              <div className="stat-label">Auto-updated at 02:00 IST</div>
              <div className="stat-sub">Automated scraper pipeline</div>
            </div>
            <div className="landing-stat-card">
              <div className="stat-icon-row"><BarChart3 size={14} style={{ color: '#94a3b8' }} /></div>
              <div className="stat-num">5 Windows</div>
              <div className="stat-label">Advance-Purchase Grid</div>
              <div className="stat-sub">T+1, T+7, T+15, T+30, T+45</div>
            </div>
          </div>

          {/* Slide dots */}
          <div className="hero-carousel-dots" style={{ marginTop: 24 }}>
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.src}
                className={`hero-dot ${idx === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── What It Does ── */}
      <section className="landing-section" id="about">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-kicker">WHAT IS AiRA?</span>
            <h2>Automated Aviation Inflation Tracking</h2>
            <p>AiRA automatically collects daily airfares, cleans the data, and calculates a price index — giving government agencies a real-time view of aviation cost changes across India.</p>
          </div>

          <div className="mandate-grid">
            <div className="mandate-card mandate-card-red">
              <div className="mandate-icon"><Activity size={22} /></div>
              <h3>Prices Change Every Minute</h3>
              <p>Airline fares shift based on seat availability and demand. Monthly manual surveys miss these rapid changes. AiRA captures them every day.</p>
            </div>
            <div className="mandate-card mandate-card-navy">
              <div className="mandate-icon"><Clock size={22} /></div>
              <h3>Book Early vs. Book Late</h3>
              <p>A ticket 45 days out can cost 340% less than booking one day before. AiRA tracks 5 booking windows to give a complete, unbiased picture.</p>
            </div>
            <div className="mandate-card mandate-card-gold">
              <div className="mandate-icon"><Landmark size={22} /></div>
              <h3>Policy-Ready Data</h3>
              <p>Daily and weekly price indices delivered via REST APIs to MoSPI, RBI, and DGCA — before monthly headline CPI prints.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Comparison ── */}
      <section className="landing-section bg-subtle" id="feature-comparison">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-kicker">COMPARATIVE ADVANTAGE</span>
            <h2>AiRA vs. Traditional Methods</h2>
            <p>See how AiRA compares to conventional CPI aviation sampling approaches used today.</p>
          </div>

          <div className="comp-table-container">
            <table className="comp-table-desktop">
              <thead>
                <tr>
                  <th className="comp-header-feature">Feature</th>
                  <th className="comp-header-existing">Existing Methods (Legacy)</th>
                  <th className="comp-header-aira">AiRA (Our Solution)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 1 ? 'row-alt' : ''}>
                    <td className="comp-cell-feature">
                      <div className="comp-feature-meta">
                        <span>{row.feature}</span>
                        <span className="comp-tag-badge">{row.tag}</span>
                      </div>
                    </td>
                    <td className="comp-cell-existing">{row.existing}</td>
                    <td className="comp-cell-aira">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Check size={15} strokeWidth={2.6} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                        <span>{row.aira}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="comp-mobile-list">
              {comparisonData.map(row => (
                <div key={row.feature} className="comp-mobile-card">
                  <div className="comp-mobile-card-title">
                    <span>{row.feature}</span>
                    <span className="comp-tag-badge">{row.tag}</span>
                  </div>
                  <div className="comp-box-existing"><strong>Legacy:</strong> {row.existing}</div>
                  <div className="comp-box-aira"><strong>AiRA:</strong> {row.aira}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stakeholder Portals ── */}
      <section className="landing-section landing-section-dotgrid" id="stakeholder-portals">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-kicker">FOR GOVERNMENT AGENCIES</span>
            <h2>Role-Based Dashboards</h2>
            <p>Tailored workspaces for the agencies that need aviation price data most.</p>
          </div>

          <div className="role-portals-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {rolePortals.map(portal => {
              const Icon = portal.icon;
              return (
                <div key={portal.id} className="role-portal-card">
                  <div className="role-portal-top">
                    <div className={`role-portal-icon ${portal.colorClass}`}>
                      <Icon size={26} />
                    </div>
                  </div>
                  <h3 className="role-portal-title">{portal.role}</h3>
                  <div className="role-portal-dept">{portal.dept}</div>
                  <p className="role-portal-desc">{portal.desc}</p>
                  <button
                    className="role-portal-btn"
                    onClick={() => onLaunchTerminal?.(portal.id)}
                  >
                    <span>{portal.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works (Pipeline) ── */}
      <section className="landing-section bg-subtle" id="architecture">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-kicker">HOW IT WORKS</span>
            <h2>From Web to Policy Report</h2>
            <p>A fully automated 5-step pipeline from live airline websites to government-ready data feeds.</p>
          </div>

          <div className="pipeline-flow">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.n}>
                  <div className="pipeline-step">
                    <div className="step-circle">{step.n}</div>
                    <div className="step-icon"><Icon size={20} /></div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                    <div className="step-meta">{step.meta}</div>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="pipeline-connector"><ChevronRight size={20} /></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── The Index Formula (compact) ── */}
      <section className="landing-section" id="methodology">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-kicker">THE MATH</span>
            <h2>MoSPI Lowe Price Index</h2>
            <p>The standard formula used by the Price Statistics Division — applied to real-time airfares.</p>
          </div>

          <div className="math-formula-box">
            <div className="formula-header">
              <span className="formula-badge">OFFICIAL PSD LOWE FORMULA</span>
              <span className="formula-period">Base Period: I₀ = 100</span>
            </div>
            <div className="formula-body">
              <div className="formula-display">
                <span className="formula-sym">I<sub>t</sub></span>
                <span className="formula-eq">=</span>
                <span className="formula-scale">100</span>
                <span className="formula-times">×</span>
                <div className="formula-fraction">
                  <div className="numerator">∑<sub>i=1</sub><sup>n</sup> w<sub>i</sub> · ( P<sub>it</sub> / P<sub>i0</sub> )</div>
                  <div className="denominator">∑<sub>i=1</sub><sup>n</sup> w<sub>i</sub></div>
                </div>
              </div>
            </div>
            <div className="formula-notes">
              <div className="note-item"><strong>w<sub>i</sub></strong> = DGCA passenger share for route <em>i</em></div>
              <div className="note-item"><strong>P<sub>it</sub></strong> = Current median fare for route <em>i</em></div>
              <div className="note-item"><strong>P<sub>i0</sub></strong> = Base period fare (normalized to 100)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="gov-footer-grid">
            {/* Col 1 */}
            <div className="footer-col-brand">
              <div className="gov-emblem-row">
                <div className="gov-emblem-gold"><Landmark size={20} /></div>
                <div>
                  <h4 className="gov-title">AiRA · AIRFARE INTELLIGENCE</h4>
                  <p className="gov-sub">Government of India</p>
                </div>
              </div>
              <p className="gov-dept-text">
                Ministry of Statistics and Programme Implementation (MoSPI) · Data Informatics & Innovation Division (DIID)
              </p>
              <p className="gov-mission-text">
                Real-Time Airfare Price Index for Augmentation of India's Consumer Price Index (CPI).
              </p>
              <div className="compliance-pill-footer">
                <CheckCircle2 size={13} />
                <span>100% MoSPI Problem Statement Compliance</span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="footer-col">
              <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>QUICK LINKS</h5>
              <ul className="footer-links">
                <li><button onClick={() => onLaunchTerminal?.()} className="footer-link-btn">Live Terminal</button></li>
                <li><button onClick={() => onLaunchTerminal?.('mospi')} className="footer-link-btn">Price Index Series</button></li>
                <li><a href="#feature-comparison" className="footer-link-btn">Feature Comparison</a></li>
                <li><a href="#stakeholder-portals" className="footer-link-btn">Agency Portals</a></li>
                <li><a href="#methodology" className="footer-link-btn">Lowe Index Formula</a></li>
                <li><button onClick={onGoToDocs} className="footer-link-btn">API Documentation</button></li>
                <li><button onClick={onGoToAuth} className="footer-link-btn">Institutional Sign In</button></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="footer-col">
              <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>RESOURCES</h5>
              <ul className="footer-links">
                <li><a href="https://mospi.gov.in" target="_blank" rel="noopener noreferrer" className="footer-ext-link">MoSPI Official Portal <ExternalLink size={11} /></a></li>
                <li><a href="https://www.dgca.gov.in" target="_blank" rel="noopener noreferrer" className="footer-ext-link">DGCA Air Transport Stats <ExternalLink size={11} /></a></li>
                <li><a href="https://www.rbi.org.in" target="_blank" rel="noopener noreferrer" className="footer-ext-link">RBI Monetary Policy <ExternalLink size={11} /></a></li>
                <li><a href="https://esankhyiki.mospi.gov.in" target="_blank" rel="noopener noreferrer" className="footer-ext-link">eSankhyiki Data Portal <ExternalLink size={11} /></a></li>
                <li><button onClick={onGoToDocs} className="footer-ext-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>API Reference <ExternalLink size={11} /></button></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="footer-col">
              <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>CONTACT</h5>
              <div className="footer-contact-block">
                <div className="contact-item">
                  <MapPin size={15} className="contact-icon" />
                  <div>
                    <strong>Data Informatics & Innovation Division</strong>
                    <p>Sardar Patel Bhawan, Sansad Marg</p>
                    <p>New Delhi – 110001, India</p>
                  </div>
                </div>
                <div className="contact-item">
                  <Mail size={15} className="contact-icon" />
                  <span>aira-support@mospi.gov.in</span>
                </div>
                <div className="contact-item">
                  <Phone size={15} className="contact-icon" />
                  <span>+91 11 2374 2125</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div>© {new Date().getFullYear()} Government of India · Ministry of Statistics and Programme Implementation. All rights reserved.</div>
            <div className="footer-bottom-links">
              <a href="#about">Privacy Policy</a>
              <span>•</span>
              <a href="#feature-comparison">Terms of Service</a>
              <span>•</span>
              <a href="#architecture">Data Governance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
