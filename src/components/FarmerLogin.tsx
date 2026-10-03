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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleMethodChange = (m: 'phone' | 'email') => {
    setMethod(m);
    setError(null);
    setShowOtpBox(false);
    setReceivedDevOtp(null);
    setIdentifier(m === 'phone' ? '9876543210' : 'ramesh@agriraksha.demo');
  };

  const handlePhoneChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 10);
    setIdentifier(cleanDigits);
    setError(null);
  };

  const handleSend = async () => {
    setError(null);
    const clean = identifier.trim();
    if (!clean) {
      setError(lang === 'te' ? 'దయచేసి మీ వివరాలను నమోదు చేయండి.' : 'Please enter your details.');
      return;
    }
    if (method === 'phone' && clean.replace(/\D/g, '').length < 10) {
      setError(lang === 'te' ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.farmerLogin(method, clean);
      if (method === 'phone') {
        setReceivedDevOtp(res.devOtp || '123456');
        setShowOtpBox(true);
        showToast(lang === 'te' ? `+91 ${clean} కు OTP పంపబడింది!` : `OTP sent to +91 ${clean}!`);
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await api.loginWithGoogle();
      if (res.farmer) {
        setStoredAuth(res.token, res.farmer);
        onLoginSuccess(res.farmer);
        showToast(lang === 'te' ? `స్వాగతం, ${res.farmer.name}! Google ద్వారా లాగిన్ విజయవంతమైంది` : `👋 Welcome, ${res.farmer.name}! Signed in with Google`);
        setTimeout(() => onNavigate('farmer-dashboard'), 350);
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED_DOMAIN') {
        const demoGoogleUser = {
          name: 'Farmer (Google Account)',
          email: 'farmer.google@gmail.com'
        };
        const res = await api.loginWithGoogle(demoGoogleUser);
        if (res.farmer) {
          setStoredAuth(res.token, res.farmer);
          onLoginSuccess(res.farmer);
          showToast(lang === 'te' ? 'స్వాగతం! Google ఖాతాతో లాగిన్ చేయబడింది' : '👋 Welcome! Signed in with Google Account');
          setTimeout(() => onNavigate('farmer-dashboard'), 350);
        }
      } else {
        setError(lang === 'te' ? 'Google లాగిన్ విఫలమైంది.' : 'Google sign-in was cancelled or failed.');
      }
    } finally {
      setGoogleLoading(false);
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {method === 'phone' && (
                    <span style={{
                      padding: '10px 12px',
                      background: '#e2e8f0',
                      borderRadius: '8px 0 0 8px',
                      fontWeight: 800,
                      color: '#334155',
                      fontSize: '14px',
                      border: '1px solid #cbd5e1',
                      borderRight: 'none'
                    }}>
                      🇮🇳 +91
                    </span>
                  )}
                  <input
                    type={method === 'phone' ? 'tel' : 'email'}
                    value={identifier}
                    placeholder={method === 'phone' ? t.enter10DigitPhone : 'ramesh@agriraksha.demo'}
                    onChange={e => {
                      if (method === 'phone') handlePhoneChange(e.target.value);
                      else setIdentifier(e.target.value);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (!showOtpBox) handleSend(); else handleVerifyOtp(); } }}
                    style={method === 'phone' ? { borderRadius: '0 8px 8px 0' } : {}}
                    disabled={showOtpBox && method === 'phone'}
                  />
                </div>
                {method === 'phone' && !showOtpBox && (
                  <small style={{ color: '#15803d', fontWeight: 700, marginTop: '5px', display: 'block' }}>
                    🔒 {lang === 'te' ? 'మీ మొబైల్ నంబర్‌కు OTP పంపబడుతుంది' : 'An OTP will be sent to your mobile number'}
                  </small>
                )}
              </div>

              {!showOtpBox && (
                <>
                  <button
                    type="button"
                    className="primary"
                    onClick={handleSend}
                    disabled={loading}
                    style={{ width: '100%', fontWeight: 800 }}
                  >
                    {loading ? (lang === 'te' ? 'దయచేసి వేచి ఉండండి...' : 'Please wait...') : (
                      method === 'phone' ? `✉️ ${lang === 'te' ? 'OTP పొందండి' : 'Send OTP'}` : (lang === 'te' ? 'ధృవీకరించి లాగిన్' : 'Verify & Login')
                    )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 10px', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span style={{ padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {lang === 'te' ? 'లేదా' : 'or'}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '11px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>
                      {googleLoading
                        ? (lang === 'te' ? 'Google తో కనెక్ట్ అవుతోంది...' : 'Connecting with Google...')
                        : (lang === 'te' ? 'Google తో సైన్-ఇన్ చేయండి' : 'Sign in with Google')}
                    </span>
                  </button>
                </>
              )}
            </div>

            {showOtpBox && (
              <div className="otp-box show" style={{ display: 'block', marginTop: '14px' }}>
                <b>{t.demoOtpSent}</b>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  margin: '8px 0'
                }}>
                  <div className="otp-code" style={{ margin: 0 }}>{receivedDevOtp}</div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(receivedDevOtp || '123456')}
                    style={{
                      border: '1px solid #16a34a',
                      background: '#ffffff',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: 800,
                      borderRadius: '6px',
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'te' ? 'ఆటో-ఫిల్' : 'Auto-Fill'}
                  </button>
                </div>
                <small>{t.demoOtpNote}</small>

                <div className="field" style={{ marginTop: '14px' }}>
                  <label>{t.enterOtp}</label>
                  <input
                    maxLength={6}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                    autoFocus
                    style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="primary"
                    style={{ flex: 1, fontWeight: 800 }}
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (lang === 'te' ? 'ధృవీకరిస్తోంది...' : 'Verifying...') : `🔓 ${t.verifyContinue}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOtpBox(false); setOtpInput(''); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'te' ? 'మార్చండి' : 'Change'}
                  </button>
                </div>
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
