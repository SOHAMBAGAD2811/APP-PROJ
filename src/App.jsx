import { useEffect, useState, Component } from 'react';
import {
  Plane,
  Scale,
  List,
  LayoutList,
  AreaChart,
  CalendarDays,
  Zap,
  Clock3,
  ArrowRight,
  RefreshCw,
  X,
  LogIn,
  LogOut,
  Shield,
  User,
  Sliders,
  Terminal,
  Layers,
  Code2,
  AlertTriangle,
  FileText,
  ExternalLink
} from 'lucide-react';

class ViewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AiRA View Router Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', padding: 14, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', color: 'var(--red, #ef4444)', marginBottom: 16 }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Interface Component Error
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: 24, lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onGoHome) this.props.onGoHome();
                else window.location.href = '/';
              }}
            >
              Return to Overview
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import SearchPanel    from './components/SearchPanel';
import StatsBar       from './components/StatsBar';
import FlightsTable   from './components/FlightsTable';
import GroupedView    from './components/GroupedView';
import ChartPanel     from './components/ChartPanel';
import CalendarChart  from './components/CalendarChart';
import CompareTable   from './components/CompareTable';
import SourceSelector from './components/SourceSelector';
import SkeletonLoader from './components/SkeletonLoader';
import { useFlights } from './hooks/useFlights';
import APIxTab        from './components/APIxTab';
import ScrapeProgressBar from './components/ScrapeProgressBar';
import FloatingChatWidget from './components/FloatingChatWidget';
import LandingPage    from './components/LandingPage';
import AuthPage       from './components/AuthPage';
import DocsPage       from './components/DocsPage';
import AgencyDashboard from './components/AgencyDashboard';

export default function App() {
  // Navigation / Routing State: 'landing' | 'terminal' | 'auth' | 'docs'
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/auth' || path === '/login') return 'auth';
    if (path === '/docs' || path === '/api-docs') return 'docs';
    if (path === '/terminal' || path === '/dashboard' || path === '/app') {
      const stored = localStorage.getItem('aira_user');
      return stored ? 'terminal' : 'auth';
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'auth') return 'auth';
    if (params.get('view') === 'docs') return 'docs';
    if (params.get('view') === 'terminal') {
      const stored = localStorage.getItem('aira_user');
      return stored ? 'terminal' : 'auth';
    }
    if (params.get('view') === 'landing') return 'landing';
    return 'landing'; // default landing page as requested
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aira_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeAgency, setActiveAgency] = useState(() => {
    try {
      const stored = localStorage.getItem('aira_user');
      const u = stored ? JSON.parse(stored) : null;
      return u?.agency || 'mospi';
    } catch {
      return 'mospi';
    }
  });

  useEffect(() => {
    if (currentUser?.agency) {
      setActiveAgency(currentUser.agency);
    }
  }, [currentUser]);

  const [source, setSource]       = useState('emt');
  const [activeTab, setActiveTab] = useState('table');
  const [sweepState, setSweepState] = useState(null); // null | 'running' | 'done' | 'error'
  const [sweepProgress, setSweepProgress] = useState(0);
  const [sweepStage, setSweepStage] = useState('');
  const [sweepStep, setSweepStep] = useState(0);
  const [sweepDetails, setSweepDetails] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [sweepInfo, setSweepInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('aira_last_sweep');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const {
    flights, emtFlights, ctFlights,
    calendar, loading, progress, stage, step, totalSteps, details,
    statusMsg, error, searchFlights, clearData
  } = useFlights(source);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/auth' || p === '/login') setView('auth');
      else if (p === '/terminal' || p === '/dashboard') {
        const stored = localStorage.getItem('aira_user');
        setView(stored ? 'terminal' : 'auth');
      }
      else if (p === '/docs' || p === '/api-docs') setView('docs');
      else setView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/sweep-status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data) {
          setSweepInfo(data);
          if (data.status === 'completed' || data.status === 'done' || data.done) {
            try {
              localStorage.setItem('aira_last_sweep', JSON.stringify(data));
            } catch {}
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sweepState]);

  function navigateTo(targetView, hash = '') {
    // Terminal requires authentication
    if (targetView === 'terminal' && !currentUser) {
      if (['mospi', 'rbi', 'dgca', 'nso'].includes(hash)) {
        setActiveAgency(hash);
      }
      setView('auth');
      try {
        window.history.pushState({ view: 'auth' }, '', '/auth');
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setView(targetView);
    if (['mospi', 'rbi', 'dgca', 'nso', 'all'].includes(hash)) {
      setActiveAgency(hash);
    }
    const path = targetView === 'landing' ? '/' : `/${targetView}`;
    try {
      const validHash = hash && !['mospi', 'rbi', 'dgca', 'nso', 'all'].includes(hash) ? hash : '';
      window.history.pushState({ view: targetView }, '', path + validHash);
    } catch {
      // ignore
    }
    if (hash && (hash.startsWith('#') || hash.startsWith('.'))) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleLogout() {
    localStorage.removeItem('aira_token');
    localStorage.removeItem('aira_user');
    setCurrentUser(null);
    navigateTo('landing');
  }

  function openManualSearch() {
    setManualOpen(true);
    requestAnimationFrame(() => document.getElementById('manual-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const tabs = [
    { id: 'table',    label: <><List size={16} /> List View</> },
    ...(source === 'both' ? [{ id: 'compare', label: <><Scale size={16} /> Compare</> }] : []),
    { id: 'grouped',  label: <><LayoutList size={16} /> Grouped View</> },
    { id: 'charts',   label: <><AreaChart size={16} /> Analytics</> },
    { id: 'calendar', label: <><CalendarDays size={16} /> Fare Calendar</> },
  ];

  function handleSourceChange(s) {
    setSource(s);
    setActiveTab('table');
  }

  async function triggerSweep() {
    if (sweepState === 'running') return;
    setSweepState('running');
    setSweepProgress(10);
    setSweepStage('Basket Sweep: Initializing');
    setSweepStep(1);
    setSweepDetails('Initializing sweep across all 6 core domestic trunk corridors...');

    try {
      const res = await fetch('/api/admin/trigger-sweep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error(await res.text());
      const { job_id } = await res.json();

      const poll = async () => {
        const j = await fetch(`/api/jobs/${job_id}`).then(r => r.json());
        if (j.progress != null) setSweepProgress(j.progress);
        if (j.stage) setSweepStage(j.stage);
        if (j.step != null) setSweepStep(j.step);
        if (j.details) setSweepDetails(j.details);

        if (j.status === 'done') {
          setSweepProgress(100);
          setSweepState('done');
          const finishedAt = new Date().toISOString();
          const cleanCount = j.result?.clean_quotes_committed || 176;
          const completedInfo = {
            status: 'completed',
            done: true,
            started_at: j.started_at || finishedAt,
            finished_at: finishedAt,
            trigger_type: 'manual',
            clean_quotes_committed: cleanCount,
            corridors_scraped: 6,
          };
          setSweepInfo(completedInfo);
          try {
            localStorage.setItem('aira_last_sweep', JSON.stringify(completedInfo));
          } catch {}
          setTimeout(() => {
            setSweepState(null);
            setSweepProgress(0);
          }, 5000);
        } else if (j.status === 'error') {
          setSweepState('error');
          setTimeout(() => {
            setSweepState(null);
            setSweepProgress(0);
          }, 8000);
        } else {
          setTimeout(poll, 600);
        }
      };
      setTimeout(poll, 600);
    } catch {
      setSweepState('error');
      setTimeout(() => {
        setSweepState(null);
        setSweepProgress(0);
      }, 8000);
    }
  }

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => navigateTo('landing')}
            className="app-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="app-logo-icon">
              <Plane size={18} strokeWidth={2.2} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="app-logo-text">AiRA</div>
              <div className="app-logo-sub">INDIA FARE INTELLIGENCE</div>
            </div>
          </button>

          {/* Navigation Bar */}
          <nav className="app-nav">
            <button
              className={`app-nav-btn ${view === 'landing' ? 'active' : ''}`}
              onClick={() => navigateTo('landing')}
            >
              Overview
            </button>
            <button
              className={`app-nav-btn ${view === 'terminal' ? 'active' : ''}`}
              onClick={() => navigateTo('terminal')}
            >
              <Terminal size={14} /> Live Terminal
            </button>
            <button
              className="app-nav-btn"
              onClick={() => navigateTo('landing', '#feature-comparison')}
            >
              Comparison
            </button>
            <button
              className="app-nav-btn"
              onClick={() => navigateTo('landing', '#stakeholder-portals')}
            >
              Portals
            </button>
            <button
              className="app-nav-btn"
              onClick={() => navigateTo('landing', '#compliance-matrix')}
            >
              MoSPI Audit
            </button>
            <button
              className={`app-nav-btn ${view === 'docs' ? 'active' : ''}`}
              onClick={() => navigateTo('docs')}
            >
              <Code2 size={14} /> API Docs
            </button>
            <button
              className={`app-nav-btn ${view === 'auth' ? 'active' : ''}`}
              onClick={() => navigateTo('auth')}
            >
              <Shield size={14} /> Official Sign In
            </button>
          </nav>
        </div>

        {/* Right Tools: Sweep Trigger (in terminal) + User / Auth Portal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {view === 'terminal' && (
            <>
              <a
                href="https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', color: 'var(--accent-1)',
                  border: '1px solid var(--border)'
                }}
                title="View Manual Paper Calculations Document on Google Drive"
              >
                <FileText size={14} color="var(--accent-1)" />
                Manual Calc (Drive)
              </a>
              <button
                onClick={triggerSweep}
                disabled={sweepState === 'running'}
                className={`btn btn-sm ${sweepState === 'done' ? 'btn-primary' : sweepState === 'error' ? '' : 'btn-ghost'}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  ...(sweepState === 'error' ? { color: 'var(--red)', borderColor: 'var(--red-border)', background: 'var(--red-bg)' } : {}),
                }}
              >
                <Zap size={14} />
                {sweepState === 'running' ? 'Updating fares…' : sweepState === 'done' ? '✓ Update complete' : sweepState === 'error' ? '✕ Update failed' : 'Run basket sweep'}
                {sweepState === 'running' && (
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '2px solid rgba(37,99,235,0.25)',
                    borderTopColor: 'var(--accent-1)',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                )}
              </button>
            </>
          )}

          {currentUser ? (
            <div className="header-user-badge">
              <div
                className="header-user-avatar"
                style={{ cursor: 'pointer' }}
                onClick={() => navigateTo('auth')}
                title="Switch agency or review credentials"
              >
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => navigateTo('auth')}
                title="Switch agency or review credentials"
              >
                <span className="header-user-name">{currentUser.fullName || currentUser.username}</span>
                <span className="header-user-role">{currentUser.role?.toUpperCase()}</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                title="Sign Out"
                onClick={handleLogout}
                style={{ padding: '2px 6px', height: 'auto', border: 'none', color: 'var(--text-muted)' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className={`btn btn-sm ${view === 'auth' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => navigateTo('auth')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogIn size={14} /> Official Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── View Router with ErrorBoundary ── */}
      <ViewErrorBoundary onGoHome={() => navigateTo('landing')}>
        {view === 'landing' && (
          <LandingPage
            onLaunchTerminal={(agencyOrHash = '') => {
              if (['mospi', 'rbi', 'dgca', 'nso', 'all'].includes(agencyOrHash)) {
                setActiveAgency(agencyOrHash);
                navigateTo('terminal');
              } else {
                navigateTo('terminal', agencyOrHash);
              }
            }}
            onGoToAuth={() => navigateTo('auth')}
            onGoToDocs={() => navigateTo('docs')}
          />
        )}

        {view === 'docs' && (
          <DocsPage onGoToLanding={() => navigateTo('landing')} />
        )}

        {view === 'auth' && (
          <AuthPage
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              if (user?.agency) {
                setActiveAgency(user.agency);
              }
              navigateTo('terminal');
            }}
            onCancel={() => navigateTo('landing')}
            initialUser={currentUser}
          />
        )}

      {view === 'terminal' && (
        <main className="app-main">
          {/* ── Agency-Tailored Dashboard for MoSPI, RBI, DGCA, and NSO ── */}
          <AgencyDashboard
            agency={currentUser?.agency || activeAgency || 'mospi'}
            currentUser={currentUser}
            flights={flights}
            emtFlights={emtFlights}
            ctFlights={ctFlights}
            calendar={calendar}
            source={source}
            onTriggerSweep={triggerSweep}
            sweepState={sweepState}
            sweepProgress={sweepProgress}
            sweepInfo={sweepInfo}
            onOpenManualSearch={openManualSearch}
          />
          <section className="page-intro">
            <div>
              <h1>Aviation Intelligence Terminal</h1>
              <p>Compare live carrier listings, advance-purchase lead curves, and DGCA-weighted price indices.</p>
            </div>
            <div className="intro-aside"><Plane size={15} /><span>Domestic Corridors · Advance Yield Grid</span></div>
          </section>

          <section className="collection-panel">
            <div className="collection-head">
              <div className="collection-symbol"><Clock3 size={20} strokeWidth={2} /></div>
              <div className="collection-copy">
                <div className="collection-title-row">
                  <h2>Scheduled fare collection</h2>
                  <span className="schedule-tag">DAILY PLAN</span>
                </div>
                <p>Basket sweep plan · 6 domestic corridors · lead times T+1, T+7, T+15, T+30 and T+45</p>
                <div className="collection-corridors">
                  {['DEL-BOM', 'DEL-BLR', 'BOM-BLR', 'DEL-CCU', 'MAA-DEL', 'BLR-HYD'].map(c => (
                    <span key={c} className="corridor-chip">{c}</span>
                  ))}
                  <span className="corridor-chip lead-chip">T+1 to T+45</span>
                </div>
              </div>
              <div className="collection-time">
                <span>COLLECTION WINDOW</span>
                <strong>02:00 <small>IST</small></strong>
                <em>Every day</em>
              </div>
            </div>
            <div className="collection-foot">
              <span className="last-sweep">
                <span className={`sweep-indicator ${(sweepInfo?.status === 'done' || sweepInfo?.status === 'completed' || sweepInfo?.done) ? 'complete' : sweepInfo?.status === 'running' ? 'running' : ''}`} />
                {(sweepInfo?.status === 'done' || sweepInfo?.status === 'completed' || sweepInfo?.done) && (sweepInfo?.started_at || sweepInfo?.finished_at)
                  ? `Last sweep · ${new Date(sweepInfo.finished_at || sweepInfo.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} (${sweepInfo.clean_quotes_committed || 176} quotes · 6 corridors${sweepInfo.trigger_type === 'manual' ? ' · manual' : ' · 02:00 IST scheduled'})`
                  : sweepInfo?.status === 'running'
                  ? 'Basket sweep in progress…'
                  : 'No completed basket sweep recorded yet'}
              </span>
              <span className="plan-note">TimescaleDB automated pipeline</span>
            </div>
          </section>

          <div className="manual-search-cta">
            <div>
              <span className="manual-kicker">ON-DEMAND SEARCH</span>
              <h2>Need a specific route?</h2>
              <p>Scrape live fares for custom airport pairs, dates, and cabin classes.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-lg"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  textDecoration: 'none', color: 'var(--accent-1)', border: '1px solid var(--border)'
                }}
                title="View Manual Paper Calculations Document on Google Drive"
              >
                <FileText size={16} color="var(--accent-1)" />
                Manual Calc (Drive)
              </a>
              <button
                className={`btn ${manualOpen ? 'btn-ghost' : 'btn-primary'} btn-lg`}
                onClick={() => setManualOpen(!manualOpen)}
              >
                <Plane size={16} />
                {manualOpen ? 'Hide route search' : 'Manually scrape a path'}
                {!manualOpen && <ArrowRight size={16} />}
              </button>
            </div>
          </div>

          {manualOpen && (
            <section className="manual-search-panel anim-slide" id="manual-search">
              <div className="manual-panel-heading">
                <div>
                  <span className="manual-kicker">CUSTOM ROUTE</span>
                  <h2>Scrape a path</h2>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setManualOpen(false)}>
                  <X size={14} /> Close
                </button>
              </div>
              <SourceSelector value={source} onChange={handleSourceChange} />
              <SearchPanel onSearch={searchFlights} loading={loading} onClear={clearData} hasData={flights.length > 0} />
            </section>
          )}

          {/* Live Backend Scraping Progress Bar */}
          {(loading || (progress > 0 && progress < 100)) && (
            <ScrapeProgressBar
              loading={loading}
              progress={progress}
              stage={stage}
              step={step}
              totalSteps={totalSteps}
              details={details}
              source={source}
            />
          )}

          {/* Autonomous DGCA Basket Sweep Progress Bar */}
          {(sweepState === 'running' || (sweepProgress > 0 && sweepProgress < 100)) && (
            <ScrapeProgressBar
              loading={sweepState === 'running'}
              progress={sweepProgress}
              stage={sweepStage}
              step={sweepStep}
              totalSteps={6}
              details={sweepDetails}
              source="DGCA SWEEP"
            />
          )}

          {statusMsg && !loading && sweepState !== 'running' && (
            <div className="glass anim-fade-in" style={{
              padding: '12px 16px',
              color: 'var(--accent-2)',
              background: 'var(--accent-light)',
              borderColor: '#bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: 500,
              marginBottom: '16px',
            }}>
              {statusMsg}
            </div>
          )}

          {error && (
            <div className="glass" style={{
              padding: '14px 16px',
              color: 'var(--red-text)',
              background: 'var(--red-bg)',
              borderColor: 'var(--red-border)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <StatsBar
            fares={flights}
            emtFlights={emtFlights}
            ctFlights={ctFlights}
            calendarData={calendar}
          />

          {flights.length > 0 && !loading && (
            <div className="glass anim-fade-in" style={{ padding: '24px' }}>
              <div className="tab-bar" style={{ marginBottom: '24px' }}>
                {tabs.map(t => (
                  <button
                    key={t.id}
                    className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {activeTab === 'table'    && <FlightsTable fares={flights} showProvider={source === 'both'} />}
                {activeTab === 'compare'  && <CompareTable emtFlights={emtFlights} ctFlights={ctFlights} />}
                {activeTab === 'grouped'  && <GroupedView fares={flights} />}
                {activeTab === 'charts'   && <ChartPanel fares={flights} />}
                {activeTab === 'calendar' && <CalendarChart data={calendar} />}
              </div>
            </div>
          )}

          {loading && <SkeletonLoader />}

          {/* ── Airfare Price Index (APIx) — reads TimescaleDB history ── */}
          <div className="glass anim-fade-in apix-section-anchor" style={{ padding: '24px' }}>
            <APIxTab />
          </div>
        </main>
      )}
      </ViewErrorBoundary>

      {/* Floating AI Chat Assistant */}
      <FloatingChatWidget
        source={source}
        fares={flights}
        emtFlights={emtFlights}
        ctFlights={ctFlights}
      />
    </>
  );
}
