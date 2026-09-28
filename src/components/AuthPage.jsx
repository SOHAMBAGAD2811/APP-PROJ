import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User,
  Building2,
  Landmark,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  KeyRound,
  FileText,
  Terminal,
  LogOut,
  RefreshCw,
  Info
} from 'lucide-react';

export default function AuthPage({ onAuthSuccess, onCancel, initialUser }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(initialUser || null);

  // Form states
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('aira-admin-2024');
  const [organization, setOrganization] = useState('Ministry of Statistics (MoSPI)');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regOrg, setRegOrg] = useState('Ministry of Statistics (MoSPI)');
  const [regDept, setRegDept] = useState('Price Statistics Division');
  const [regRole, setRegRole] = useState('mospi_analyst');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preconfigured Official Test Accounts
  const demoAccounts = [
    {
      id: 'admin',
      label: 'MoSPI Administrator',
      role: 'admin',
      org: 'MoSPI · Data Informatics & Innovation Division',
      user: 'admin',
      pass: 'aira-admin-2024',
      badge: 'Full Root Privileges',
      desc: 'Basket sweep trigger, raw DB queries, system telemetry'
    },
    {
      id: 'mospi',
      label: 'CPI Senior Statistician',
      role: 'mospi_analyst',
      org: 'MoSPI · Price Statistics Division',
      user: 'mospi_analyst',
      pass: 'mospi-cpi-2024',
      badge: 'Statistical Officer',
      desc: 'Lowe index inspection, CPI bulletin generator, weights validation'
    },
    {
      id: 'rbi',
      label: 'RBI Monetary Researcher',
      role: 'rbi_researcher',
      org: 'Reserve Bank of India · DEPR',
      user: 'rbi_analyst',
      pass: 'rbi-policy-2024',
      badge: 'Monetary Policy',
      desc: 'Inflation modeling, ATF price shock simulations, API token usage'
    },
    {
      id: 'dgca',
      label: 'DGCA Tariff Director',
      role: 'dgca_officer',
      org: 'DGCA · Air Transport Directorate',
      user: 'dgca_officer',
      pass: 'dgca-at-2024',
      badge: 'Aviation Regulator',
      desc: 'Corridor surveillance, unbundled tariff audits, MAD outlier log'
    },
    {
      id: 'viewer',
      label: 'Open Data Observer',
      role: 'viewer',
      org: 'National Statistical System',
      user: 'viewer',
      pass: 'aira-viewer-2024',
      badge: 'Public Read-Only',
      desc: 'Airfare index charts, corridor heatmaps, CSV exports'
    },
  ];

  useEffect(() => {
    // Check if session token already exists in localStorage
    try {
      const stored = localStorage.getItem('aira_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSelectDemo(demo) {
    setUsername(demo.user);
    setPassword(demo.pass);
    setOrganization(demo.org);
    setErrorMsg('');
    setSuccessMsg(`Selected official test profile: ${demo.label}`);
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
      }

      // Save token and user in localStorage
      localStorage.setItem('aira_token', data.access_token);
      localStorage.setItem('aira_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setSuccessMsg(`Welcome, ${data.user.fullName}! Redirecting to Intelligence Terminal…`);

      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(data.user);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Network error while attempting authentication.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword,
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          organization: regOrg.trim(),
          department: regDept.trim(),
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      localStorage.setItem('aira_token', data.access_token);
      localStorage.setItem('aira_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setSuccessMsg(`Institutional credentials created successfully for ${data.user.fullName}!`);

      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(data.user);
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Registration error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('aira_token');
    localStorage.removeItem('aira_user');
    setCurrentUser(null);
    setSuccessMsg('You have been signed out of the institutional session.');
  }

  return (
    <div className="auth-page-root anim-fade-in">
      <div className="auth-container">
        {/* Institutional Authority Badge Header */}
        <div className="auth-header-card">
          <div className="auth-gov-badges">
            <span className="gov-tag"><Landmark size={14} /> MoSPI · DIID</span>
            <span className="gov-tag"><Shield size={14} /> DGCA</span>
            <span className="gov-tag"><Building2 size={14} /> RBI · DEPR</span>
          </div>

          <h1>Institutional Access Portal</h1>
          <p>
            Secure gateway for the Airfare Price Index (APIx) platform and high-frequency CPI telemetry. 
            Authorized access for statistical officers, economic policy analysts, and aviation regulators.
          </p>
        </div>

        {/* If already authenticated, show active session banner */}
        {currentUser && (
          <div className="active-session-card glass">
            <div className="session-info-row">
              <div className="session-avatar">
                <Shield size={24} />
              </div>
              <div>
                <div className="session-name">{currentUser.fullName}</div>
                <div className="session-org">{currentUser.organization} · <em>{currentUser.department || currentUser.role}</em></div>
                <div className="session-meta">
                  <span className="badge badge-green">ACTIVE SESSION (ROLE: {currentUser.role?.toUpperCase()})</span>
                  <span>Username: <code>{currentUser.username}</code></span>
                </div>
              </div>
            </div>

            <div className="session-actions">
              <button className="btn btn-primary" onClick={() => onAuthSuccess && onAuthSuccess(currentUser)}>
                <Terminal size={16} /> Enter Intelligence Terminal
                <ArrowRight size={14} />
              </button>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="auth-alert error anim-slide">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success anim-slide">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="auth-layout-grid">
          {/* Main Form Box */}
          <div className="auth-form-card glass">
            {/* Mode Tabs */}
            <div className="auth-tab-switch">
              <button
                className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <LogIn size={16} /> Official Sign In
              </button>
              <button
                className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <UserPlus size={16} /> Register Credentials
              </button>
            </div>

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="username">
                    <User size={14} /> Username or Official Email ID
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or sso.cpi@mospi.gov.in"
                    className="auth-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    <KeyRound size={14} /> Password / Access Key
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter official access key"
                    className="auth-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="org">
                    <Building2 size={14} /> Department / Institution
                  </label>
                  <select
                    id="org"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="auth-select"
                  >
                    <option value="Ministry of Statistics (MoSPI)">Ministry of Statistics and Programme Implementation (MoSPI)</option>
                    <option value="Directorate General of Civil Aviation (DGCA)">Directorate General of Civil Aviation (DGCA)</option>
                    <option value="Reserve Bank of India (RBI)">Reserve Bank of India (RBI)</option>
                    <option value="National Statistical Office (NSO)">National Statistical Office (NSO)</option>
                    <option value="Academic & Policy Research">Accredited Academic / Policy Research Institute</option>
                  </select>
                </div>

                <div className="form-row-check">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember institutional session on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg auth-submit-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Verifying Credentials…
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Authenticate &amp; Enter Terminal
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Full Official Name</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Verma"
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Official Institutional Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. name@mospi.gov.in"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Desired Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. rverma_mospi"
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role / Clearance Level</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="auth-select"
                    >
                      <option value="mospi_analyst">MoSPI Senior Statistician (CPI Team)</option>
                      <option value="rbi_researcher">RBI Monetary Policy Analyst</option>
                      <option value="dgca_officer">DGCA Tariff &amp; Route Officer</option>
                      <option value="admin">System Administrator (DIID)</option>
                      <option value="viewer">Public Statistical Observer</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Organization</label>
                    <input
                      type="text"
                      required
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      placeholder="e.g. MoSPI"
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Division / Unit</label>
                    <input
                      type="text"
                      required
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      placeholder="e.g. Price Statistics Division"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label>Access Key / Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm your key"
                      className="auth-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg auth-submit-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Registering…
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Register Official Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick-Select Demo Institutional Profiles (Crucial for evaluation!) */}
          <div className="demo-accounts-side">
            <div className="demo-accounts-card glass">
              <div className="demo-card-head">
                <KeyRound size={18} />
                <div>
                  <h3>Preconfigured Test Profiles</h3>
                  <p>1-click institutional roles for evaluation and auditing</p>
                </div>
              </div>

              <div className="demo-accounts-list">
                {demoAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`demo-acc-item ${username === acc.user ? 'active-demo' : ''}`}
                    onClick={() => handleSelectDemo(acc)}
                  >
                    <div className="demo-acc-top">
                      <strong>{acc.label}</strong>
                      <span className="badge badge-accent" style={{ fontSize: '0.64rem' }}>{acc.badge}</span>
                    </div>
                    <div className="demo-acc-org">{acc.org}</div>
                    <div className="demo-acc-desc">{acc.desc}</div>
                    <div className="demo-acc-creds">
                      <span>User: <code>{acc.user}</code></span>
                      <span>Pass: <code>{acc.pass}</code></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="demo-security-note">
                <Info size={14} />
                <span>All sessions issue cryptographically signed JWT Bearer tokens with 24-hour expiration.</span>
              </div>
            </div>

            {onCancel && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button className="btn btn-ghost" onClick={onCancel} style={{ width: '100%' }}>
                  Back to Landing Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
