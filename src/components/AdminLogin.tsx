import React, { useState } from 'react';
import { translations } from '../translations.ts';
import { api, setStoredAuth } from '../api.ts';
import { AdminUser } from '../types.ts';

interface AdminLoginProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  lang,
  setLang,
  onNavigate,
  showToast,
  onLoginSuccess
}) => {
  const t = translations[lang];
  const [email, setEmail] = useState('admin@agriraksha.demo');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError(lang === 'te' ? 'దయచేసి ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.' : 'Please enter admin email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin(email.trim(), password);
      if (res.token && res.admin) {
        setStoredAuth(res.token, res.admin);
        onLoginSuccess(res.admin);
        showToast(lang === 'te' ? 'అడ్మిన్ లాగిన్ విజయవంతం!' : 'Administrator authenticated!');
        setTimeout(() => onNavigate('admin-dashboard'), 500);
      }
    } catch (err: any) {
      setError(err.message || (lang === 'te' ? 'తప్పు అడ్మిన్ ఈమెయిల్ లేదా పాస్‌వర్డ్.' : 'Incorrect admin email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Portal Nav */}
      <header className="portal-nav">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <div className="brand-mark" aria-label="AgriRaksha">🌾</div>
          <span>AgriRaksha</span>
        </a>

        <div className="nav-right">
          <div className="language-switcher">
            <button className="lang-btn" type="button" onClick={() => setLangMenuOpen(!langMenuOpen)}>
              🌐 <span>{lang === 'te' ? 'తెలుగు' : 'English'}</span> ▾
            </button>
            {langMenuOpen && (
              <div className="lang-menu" onMouseLeave={() => setLangMenuOpen(false)}>
                <button type="button" onClick={() => { setLang('en'); setLangMenuOpen(false); }}>🇬🇧 English</button>
                <button type="button" onClick={() => { setLang('te'); setLangMenuOpen(false); }}>🇮🇳 తెలుగు</button>
              </div>
            )}
          </div>
          <button className="nav-btn" onClick={() => onNavigate('home')}>← Home</button>
        </div>
      </header>

      {/* Main Wrap */}
      <main className="portal-wrap">
        <div className="auth-grid">
          {/* Hero Panel */}
          <section className="panel hero-panel">
            <div className="eyebrow">{t.adminPortal}</div>
            <h1>{t.adminControlCenter}</h1>
            <p>{t.adminLoginDesc}</p>
            <div className="feature-list">
              <div>
                👥 <b>{t.farmerManagement}</b><br />
                <span style={{ color: '#526b59' }}>{lang === 'te' ? 'రైతు ప్రొఫైళ్లు మరియు నమోదైన పంటలను చూడండి.' : 'View farmer profiles and registered crops.'}</span>
              </div>
              <div>
                🌾 <b>{t.cropMonitoring}</b><br />
                <span style={{ color: '#526b59' }}>{lang === 'te' ? 'పంట దశలు మరియు ఆరోగ్య హెచ్చరికలను సమీక్షించండి.' : 'Review crop stages and health alerts.'}</span>
              </div>
              <div>
                📊 <b>{t.systemOverview}</b><br />
                <span style={{ color: '#526b59' }}>{lang === 'te' ? 'ఒకే డాష్‌బోర్డ్ నుండి పోర్టల్ గణాంకాలను చూడండి.' : 'Track portal statistics from one dashboard.'}</span>
              </div>
            </div>
          </section>

          {/* Auth Panel */}
          <section className="panel auth-panel">
            <h2>{t.adminLogin}</h2>
            <p className="sub">{lang === 'te' ? 'కొనసాగడానికి అడ్మినిస్ట్రేటర్ వివరాలను నమోదు చేయండి.' : 'Enter administrator credentials to continue.'}</p>

            {error && <div className="error show">{error}</div>}

            <div className="form-grid">
              <div className="field">
                <label>{t.adminEmail}</label>
                <input
                  type="email"
                  value={email}
                  placeholder="admin@agriraksha.demo"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                />
              </div>
              <div className="field">
                <label>{t.password}</label>
                <input
                  type="password"
                  value={password}
                  placeholder="Enter password"
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                />
              </div>
              <button className="primary" onClick={handleLogin} disabled={loading}>
                {loading ? 'Authenticating...' : t.loginToDashboard}
              </button>
            </div>

            <div className="demo-note">
              <b>{t.demoLoginInfo}</b><br />
              <span>{t.demoAdminNote}</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
