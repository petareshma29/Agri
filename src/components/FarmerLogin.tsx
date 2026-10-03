import React, { useState } from 'react';
import { translations } from '../translations.ts';
import { api, setStoredAuth } from '../api.ts';
import { Farmer } from '../types.ts';

interface FarmerLoginProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  onLoginSuccess: (farmer: Farmer) => void;
}

export const FarmerLogin: React.FC<FarmerLoginProps> = ({
  lang,
  setLang,
  onNavigate,
  showToast,
  onLoginSuccess
}) => {
  const t = translations[lang];
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('9876543210');
  const [otpInput, setOtpInput] = useState('');
  const [receivedDevOtp, setReceivedDevOtp] = useState<string | null>(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleMethodChange = (m: 'phone' | 'email') => {
    setMethod(m);
    setError(null);
    setShowOtpBox(false);
    setReceivedDevOtp(null);
    setIdentifier(m === 'phone' ? '9876543210' : 'ramesh@agriraksha.demo');
  };

  const handleSend = async () => {
    setError(null);
    if (!identifier.trim()) {
      setError(lang === 'te' ? 'దయచేసి మీ వివరాలను నమోదు చేయండి.' : 'Please enter your details.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.farmerLogin(method, identifier.trim());
      if (method === 'phone') {
        setReceivedDevOtp(res.devOtp || '123456');
        setShowOtpBox(true);
        showToast(lang === 'te' ? `OTP పంపబడింది!` : `OTP sent to ${identifier}!`);
      } else {
        // Direct email login succeeded
        if (res.token && res.farmer) {
          setStoredAuth(res.token, res.farmer);
          onLoginSuccess(res.farmer);
          showToast(lang === 'te' ? 'ధృవీకరణ విజయవంతం! డాష్‌బోర్డ్‌కు వెళ్తోంది...' : 'Verified successfully! Redirecting...');
          setTimeout(() => onNavigate('farmer-dashboard'), 600);
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'te' ? 'లాగిన్ విఫలమైంది' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otpInput.trim()) {
      setError(lang === 'te' ? 'దయచేసి OTP నమోదు చేయండి.' : 'Please enter the OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyFarmerOtp(identifier.trim(), otpInput.trim());
      if (res.token && res.farmer) {
        setStoredAuth(res.token, res.farmer);
        onLoginSuccess(res.farmer);
        showToast(lang === 'te' ? 'లాగిన్ విజయవంతం!' : 'Login successful!');
        setTimeout(() => onNavigate('farmer-dashboard'), 500);
      }
    } catch (err: any) {
      setError(err.message || (lang === 'te' ? 'తప్పు OTP.' : 'Incorrect OTP.'));
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

      {/* Main Form Wrap */}
      <main className="portal-wrap">
        <div className="auth-grid">
          {/* Hero Panel */}
          <section className="panel hero-panel">
            <div className="eyebrow">{t.farmerPortal}</div>
            <h1>{t.welcomeFarmer}</h1>
            <p>{t.farmerLoginDesc}</p>
            <div className="feature-list">
              <div>
                📱 <b>{t.phoneOtp}</b><br />
                <span className="muted" style={{ color: '#526b59' }}>{t.phoneOtpDesc}</span>
              </div>
              <div>
                📧 <b>{t.emailDirect}</b><br />
                <span style={{ color: '#526b59' }}>{t.emailDirectDesc}</span>
              </div>
            </div>
          </section>

          {/* Auth Panel */}
          <section className="panel auth-panel">
            <h2>{t.farmerLogin}</h2>
            <p className="sub">{t.chooseVerifyMethod}</p>

            <div className="method-tabs" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <button
                className={`method-tab ${method === 'phone' ? 'active' : ''}`}
                onClick={() => handleMethodChange('phone')}
              >
                📱 <span>{t.phone}</span>
              </button>
              <button
                className={`method-tab ${method === 'email' ? 'active' : ''}`}
                onClick={() => handleMethodChange('email')}
              >
                📧 <span>{t.email}</span>
              </button>
            </div>

            {error && <div className="error show">{error}</div>}

            <div className="form-grid">
              <div className="field">
                <label>
                  {method === 'phone' ? t.registeredPhone : (lang === 'te' ? 'నమోదైన ఈమెయిల్ చిరునామా' : 'Registered Email Address')}
                </label>
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  placeholder={method === 'phone' ? t.enter10DigitPhone : 'ramesh@agriraksha.demo'}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                />
              </div>
              <button className="primary" onClick={handleSend} disabled={loading}>
                {loading ? 'Please wait...' : (method === 'phone' ? t.sendOtp : (lang === 'te' ? 'ధృవీకరించి లాగిన్' : 'Verify & Login'))}
              </button>
            </div>

            {showOtpBox && (
              <div className="otp-box show" style={{ display: 'block' }}>
                <b>{t.demoOtpSent}</b>
                <div className="otp-code">{receivedDevOtp}</div>
                <small>{t.demoOtpNote}</small>
                <div className="field" style={{ marginTop: '12px' }}>
                  <label>{t.enterOtp}</label>
                  <input
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                  />
                </div>
                <button
                  className="primary"
                  style={{ marginTop: '10px' }}
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : t.verifyContinue}
                </button>
              </div>
            )}

            <div className="demo-note">
              <b>{t.demoLoginInfo}</b><br />
              <span>{t.demoPhoneHint}</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
