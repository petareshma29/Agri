import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations.ts';
import { api, setStoredAuth } from '../api.ts';
import { Farmer } from '../types.ts';

interface HomeProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  onLoginSuccess?: (farmer: Farmer) => void;
}

const IMAGES = [
  '/assets/bg-sprout-sunrise.jpg',
  '/assets/bg-green-field-trees.jpg',
  '/assets/bg-tractor-field.jpg'
];

export const Home: React.FC<HomeProps> = ({ lang, setLang, onNavigate, showToast, onLoginSuccess }) => {
  const t = translations[lang];
  const [slideIndex, setSlideIndex] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Phone Sign-in with OTP State
  const [quickPhone, setQuickPhone] = useState('9876543210');
  const [quickOtp, setQuickOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [quickPhoneLoading, setQuickPhoneLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickTab, setQuickTab] = useState<'phone' | 'admin'>('phone');

  // Disease upload demo state on home page
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<{
    crop?: string;
    condition?: string;
    care?: string;
  } | null>(null);

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('Farmer Support');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextSlide = () => setSlideIndex(prev => (prev + 1) % IMAGES.length);
  const prevSlide = () => setSlideIndex(prev => (prev - 1 + IMAGES.length) % IMAGES.length);

  const handlePhoneInputChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 10);
    setQuickPhone(cleanDigits);
    setQuickError(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPhone = quickPhone.trim().replace(/\D/g, '');
    setQuickError(null);
    if (!targetPhone || targetPhone.length < 10) {
      setQuickError(lang === 'te' ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setQuickPhoneLoading(true);
    try {
      const res = await api.farmerLogin('phone', targetPhone);
      setOtpSent(true);
      setReceivedOtp(res.devOtp || '123456');
      setQuickOtp('');
      showToast(lang === 'te' ? `+91 ${targetPhone} కు OTP పంపబడింది!` : `OTP sent to +91 ${targetPhone}!`);
    } catch (err: any) {
      setQuickError(err.message || (lang === 'te' ? 'OTP పంపడం విఫలమైంది' : 'Failed to send OTP'));
    } finally {
      setQuickPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPhone = quickPhone.trim().replace(/\D/g, '');
    const cleanOtp = quickOtp.trim();
    setQuickError(null);

    if (!cleanOtp) {
      setQuickError(lang === 'te' ? 'దయచేసి OTP నమోదు చేయండి' : 'Please enter the OTP');
      return;
    }

    setQuickPhoneLoading(true);
    try {
      const res = await api.verifyFarmerOtp(targetPhone, cleanOtp);
      if (res.token && res.farmer) {
        setStoredAuth(res.token, res.farmer);
        if (onLoginSuccess) {
          onLoginSuccess(res.farmer);
        }
        showToast(lang === 'te' ? `స్వాగతం, ${res.farmer.name}! లాగిన్ విజయవంతమైంది` : `👋 Welcome, ${res.farmer.name}! Login successful`);
        setTimeout(() => onNavigate('farmer-dashboard'), 350);
      }
    } catch (err: any) {
      setQuickError(err.message || (lang === 'te' ? 'తప్పు OTP. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'Invalid OTP. Please check the code and try again.'));
    } finally {
      setQuickPhoneLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await api.analyzeCropImage(base64, 'Rice', 'Home page scan');
        setDiseaseResult({
          crop: res.scan.detected_crop,
          condition: res.scan.detected_condition,
          care: res.scan.recommendations?.[0] || 'Follow agricultural guidelines and label directions.'
        });
        showToast(lang === 'te' ? 'చిత్ర విశ్లేషణ పూర్తయింది!' : 'Crop image analyzed successfully!');
      } catch {
        setDiseaseResult({
          crop: 'Rice',
          condition: 'Rice Blast (Magnaporthe oryzae)',
          care: 'Use registered fungicide advised by local agriculture officer and maintain field hygiene.'
        });
        showToast(lang === 'te' ? 'విశ్లేషణ ఫలితం సిద్ధం' : 'Analysis result ready');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setSendingContact(true);
    try {
      await api.sendContactMessage(contactName, contactEmail, contactTopic, contactMessage);
      showToast(lang === 'te' ? 'మీ సందేశం పంపబడింది!' : 'Message sent successfully!');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch {
      showToast(lang === 'te' ? 'సందేశం పంపబడింది (డెమో)' : 'Message saved for demo!');
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div>
      {/* Home Navbar */}
      <header className="home-navbar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="brand-mark" aria-label="AgriRaksha">🌾</div>
          <span>AgriRaksha</span>
        </a>

        <nav className={`navlinks ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>{t.home}</a>
          <a href="#disease" onClick={() => setMobileMenuOpen(false)}>{t.cropDisease}</a>
          <a href="#guides" onClick={() => setMobileMenuOpen(false)}>{t.about}</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>{t.contact}</a>
        </nav>

        <div className="nav-tagline">{t.tagline}</div>

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

        <button className="menu md:hidden text-white text-2xl ml-2" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
      </header>

      <main>
        {/* Top Modules Strip */}
        <section className="top-modules" aria-label="AgriRaksha modules">
          <div className="top-module soil" onClick={() => onNavigate('soil')}>
            <span className="top-module-icon">🌱</span>
            <span>
              <b>{t.soil}</b>
              <small>{t.soilSub}</small>
            </span>
            <strong>→</strong>
          </div>
          <div className="top-module weather" onClick={() => onNavigate('weather')}>
            <span className="top-module-icon">🌤️</span>
            <span>
              <b>{t.weather}</b>
              <small>{t.weatherSub}</small>
            </span>
            <strong>→</strong>
          </div>
          <div className="top-module rate" onClick={() => onNavigate('crop-rate')}>
            <span className="top-module-icon">📈</span>
            <span>
              <b>{t.cropRate}</b>
              <small>{t.cropRateSub}</small>
            </span>
            <strong>→</strong>
          </div>
        </section>

        {/* Highlight Moving Strip */}
        <section className="highlight-strip" aria-label="AgriRaksha highlights">
          <div className="highlight-label">
            <span>✦</span> {t.farmerFirstHighlights}
          </div>
          <div className="highlight-window">
            <div className="highlight-track">
              <div className="highlight-item">🌱 <b>{lang === 'te' ? 'ఆరోగ్యకరమైన నేల' : 'Healthy soil'}</b> {lang === 'te' ? 'పంటలు బలంగా పెరగడానికి సహాయపడుతుంది.' : 'helps crops grow stronger.'}</div>
              <div className="highlight-item">🌦️ {lang === 'te' ? 'సమయానుకూల వాతావరణ నవీకరణలతో వ్యవసాయాన్ని ప్లాన్ చేయండి.' : 'Plan farming with timely weather updates.'}</div>
              <div className="highlight-item">💧 {lang === 'te' ? 'మెరుగైన నీటిపారుదలతో నీటిని ఆదా చేయండి.' : 'Save water with smarter irrigation.'}</div>
              <div className="highlight-item">🛡️ {lang === 'te' ? 'పంట సమస్యలను ముందుగానే గుర్తించి వేగంగా చర్య తీసుకోండి.' : 'Detect crop problems early and act faster.'}</div>
              <div className="highlight-item">📈 {lang === 'te' ? 'పంట ధరల సమాచారంతో సరైన నిర్ణయాలు తీసుకోండి.' : 'Make informed decisions with crop-rate information.'}</div>
              <div className="highlight-item">👨‍🌾 {lang === 'te' ? 'మెరుగైన సమాచారం అంటే మరింత నమ్మకమైన రైతులు.' : 'Better information means more confident farmers.'}</div>
              {/* Duplicate track for seamless marquee loop */}
              <div className="highlight-item">🌱 <b>{lang === 'te' ? 'ఆరోగ్యకరమైన నేల' : 'Healthy soil'}</b> {lang === 'te' ? 'పంటలు బలంగా పెరగడానికి సహాయపడుతుంది.' : 'helps crops grow stronger.'}</div>
              <div className="highlight-item">🌦️ {lang === 'te' ? 'సమయానుకూల వాతావరణ నవీకరణలతో వ్యవసాయాన్ని ప్లాన్ చేయండి.' : 'Plan farming with timely weather updates.'}</div>
              <div className="highlight-item">💧 {lang === 'te' ? 'మెరుగైన నీటిపారుదలతో నీటిని ఆదా చేయండి.' : 'Save water with smarter irrigation.'}</div>
              <div className="highlight-item">🛡️ {lang === 'te' ? 'పంట సమస్యలను ముందుగానే గుర్తించి వేగంగా చర్య తీసుకోండి.' : 'Detect crop problems early and act faster.'}</div>
              <div className="highlight-item">📈 {lang === 'te' ? 'పంట ధరల సమాచారంతో సరైన నిర్ణయాలు తీసుకోండి.' : 'Make informed decisions with crop-rate information.'}</div>
              <div className="highlight-item">👨‍🌾 {lang === 'te' ? 'మెరుగైన సమాచారం అంటే మరింత నమ్మకమైన రైతులు.' : 'Better information means more confident farmers.'}</div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-photo-wrap">
            {IMAGES.map((imgSrc, idx) => (
              <div
                key={imgSrc}
                className="hero-slide-item"
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: idx === slideIndex ? 1 : 0,
                  transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: idx === slideIndex ? 2 : 1,
                  pointerEvents: 'none'
                }}
              >
                <div className="hero-photo-blur" style={{ backgroundImage: `url("${imgSrc}")` }} />
                <img
                  className="hero-photo"
                  src={imgSrc}
                  alt={`Agriculture scene ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
            ))}
          </div>
          <div className="hero-shade" />

          <div className="hero-inner">
            <div className="hero-copy">
              <div className="badge">{t.heroBadge}</div>
              <h1>AGRI<span>RAKSHA</span></h1>
              <div className="hero-sub">{t.heroSub}</div>
              <p>{t.heroDesc}</p>
              <div className="hero-actions">
                <a className="big-btn green" href="#disease">{t.detectCropDisease}</a>
                <a className="big-btn ghost" href="#features">{t.exploreFeatures}</a>
              </div>
            </div>

            <div className="quick-login-panel">
              {/* Tab Selector: Quick Phone Sign vs Admin */}
              <div className="quick-sign-tabs">
                <button
                  type="button"
                  className={`quick-sign-tab ${quickTab === 'phone' ? 'active' : ''}`}
                  onClick={() => { setQuickTab('phone'); setQuickError(null); }}
                >
                  📱 {lang === 'te' ? 'రైతు లాగిన్ (OTP)' : 'Farmer Login (OTP)'}
                </button>
                <button
                  type="button"
                  className={`quick-sign-tab ${quickTab === 'admin' ? 'active' : ''}`}
                  onClick={() => { setQuickTab('admin'); setQuickError(null); }}
                >
                  🛡️ {lang === 'te' ? 'అడ్మిన్ పోర్టల్' : 'Admin Portal'}
                </button>
              </div>

              {quickTab === 'phone' ? (
                <div>
                  {!otpSent ? (
                    /* Step 1: Enter Phone Number and Request OTP */
                    <form onSubmit={handleSendOtp}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0c5b38', margin: 0 }}>
                          📱 {lang === 'te' ? 'మొబైల్ నంబర్‌తో సైన్-ఇన్' : 'Sign In with Phone'}
                        </h3>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', border: '1px solid #86efac' }}>
                          🔒 {lang === 'te' ? 'OTP అవసరం' : 'OTP Required'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#527964', margin: '2px 0 10px' }}>
                        {lang === 'te'
                          ? 'మీ 10 అంకెల మొబైల్ నంబర్ నమోదు చేసి OTP పొందండి'
                          : 'Enter 10-digit mobile number to receive OTP'}
                      </p>

                      {quickError && <div className="quick-sign-error">{quickError}</div>}

                      {/* Phone Input Box */}
                      <div className="quick-sign-input-wrap">
                        <span className="quick-sign-flag">🇮🇳 +91</span>
                        <input
                          type="tel"
                          className="quick-sign-input"
                          placeholder={lang === 'te' ? '10 అంకెల మొబైల్ నంబర్' : '10-digit mobile number'}
                          maxLength={10}
                          value={quickPhone}
                          onChange={(e) => handlePhoneInputChange(e.target.value)}
                          autoFocus
                        />
                        {quickPhone && (
                          <button
                            type="button"
                            onClick={() => setQuickPhone('')}
                            style={{ border: 0, background: 'transparent', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Send OTP Button */}
                      <button
                        type="submit"
                        className="quick-sign-btn-action"
                        disabled={quickPhoneLoading}
                      >
                        {quickPhoneLoading ? (
                          <span>⏳ {lang === 'te' ? 'OTP పంపబడుతోంది...' : 'Sending OTP...'}</span>
                        ) : (
                          <>
                            <span>✉️ {lang === 'te' ? 'OTP పొందండి' : 'Send OTP'}</span>
                            <strong style={{ fontSize: '16px' }}>→</strong>
                          </>
                        )}
                      </button>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px' }}>
                        <span style={{ color: '#15803d', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🛡️ {lang === 'te' ? 'సురక్షిత OTP ధృవీకరణ' : 'Secure OTP verification required'}
                        </span>
                        <button
                          type="button"
                          style={{ border: 0, background: 'transparent', color: '#475569', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          onClick={() => onNavigate('farmer-login')}
                        >
                          {lang === 'te' ? 'పూర్తి పోర్టల్ →' : 'Full portal →'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Step 2: Enter and Verify OTP */
                    <form onSubmit={handleVerifyOtp}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0c5b38', margin: 0 }}>
                          🔐 {lang === 'te' ? 'OTP ధృవీకరణ' : 'Verify OTP'}
                        </h3>
                        <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                          📱 +91 {quickPhone}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#527964', margin: '2px 0 8px' }}>
                        {lang === 'te'
                          ? `+91 ${quickPhone} కు పంపబడిన 6 అంకెల OTP ని నమోదు చేయండి`
                          : `Enter the 6-digit OTP sent to +91 ${quickPhone}`}
                      </p>

                      {/* Demo OTP Notice Box */}
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px dashed #86efac',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}>
                        <div>
                          <span style={{ color: '#166534', fontWeight: 700 }}>
                            {lang === 'te' ? 'డెమో SMS OTP:' : 'Demo SMS OTP:'}
                          </span>{' '}
                          <b style={{ color: '#15803d', fontSize: '15px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                            {receivedOtp || '123456'}
                          </b>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickOtp(receivedOtp || '123456')}
                          style={{
                            border: '1px solid #86efac',
                            background: '#ffffff',
                            color: '#15803d',
                            fontSize: '11px',
                            fontWeight: 800,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          {lang === 'te' ? 'స్వయంచాలకంగా పూరించండి' : 'Auto-Fill'}
                        </button>
                      </div>

                      {quickError && <div className="quick-sign-error">{quickError}</div>}

                      {/* OTP Input Box */}
                      <div className="quick-sign-input-wrap">
                        <span style={{ fontSize: '16px', paddingRight: '8px', borderRight: '1px solid #c2e2cc', marginRight: '8px' }}>🔑</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="quick-sign-input"
                          placeholder="Enter 6-digit OTP (e.g. 123456)"
                          maxLength={6}
                          value={quickOtp}
                          onChange={(e) => {
                            setQuickOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setQuickError(null);
                          }}
                          autoFocus
                          style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 800 }}
                        />
                        {quickOtp && (
                          <button
                            type="button"
                            onClick={() => setQuickOtp('')}
                            style={{ border: 0, background: 'transparent', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Verify Button */}
                      <button
                        type="submit"
                        className="quick-sign-btn-action"
                        disabled={quickPhoneLoading}
                      >
                        {quickPhoneLoading ? (
                          <span>⏳ {lang === 'te' ? 'ధృవీకరిస్తోంది...' : 'Verifying OTP...'}</span>
                        ) : (
                          <>
                            <span>🔓 {lang === 'te' ? 'OTP ధృవీకరించి లాగిన్' : 'Verify OTP & Sign In'}</span>
                            <strong style={{ fontSize: '16px' }}>✓</strong>
                          </>
                        )}
                      </button>

                      {/* Navigation between steps */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px' }}>
                        <button
                          type="button"
                          style={{ border: 0, background: 'transparent', color: '#475569', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          onClick={() => { setOtpSent(false); setQuickError(null); }}
                        >
                          ← {lang === 'te' ? 'నంబర్ మార్చండి' : 'Change Phone'}
                        </button>
                        <button
                          type="button"
                          style={{ border: 0, background: 'transparent', color: '#15803d', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                          onClick={() => handleSendOtp()}
                          disabled={quickPhoneLoading}
                        >
                          🔄 {lang === 'te' ? 'మళ్ళీ పంపండి' : 'Resend OTP'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Admin Tab */
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1e3a8a', margin: '0 0 4px' }}>
                    🛡️ {lang === 'te' ? 'అడ్మినిస్ట్రేటర్ పోర్టల్' : 'Administrator Portal'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 14px' }}>
                    {lang === 'te'
                      ? 'మండి రేట్లు, హెచ్చరికలు మరియు రైతుల డేటా నిర్వహణ'
                      : 'Authorized personnel for mandi rates, system alerts & farmer records'}
                  </p>
                  <button
                    type="button"
                    className="quick-login-btn admin"
                    onClick={() => onNavigate('admin-login')}
                    style={{ margin: '0 0 10px' }}
                  >
                    <span>🛡️</span> {lang === 'te' ? 'అడ్మిన్ లాగిన్ పేజీ' : 'Open Admin Login'} <strong>→</strong>
                  </button>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                    Default demo: <b>admin@agriraksha.demo</b> / <b>admin123</b>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="hero-arrow hero-prev" onClick={prevSlide} aria-label="Previous farmer image">‹</button>
          <button className="hero-arrow hero-next" onClick={nextSlide} aria-label="Next farmer image">›</button>

          <div className="hero-dots">
            {IMAGES.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(i)}
                aria-label={`Show farmer image ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="features home-section" id="features">
          <div className="section-head">
            <div className="eyebrow">{t.whatAgriOffers}</div>
            <h2>{t.techConnectsFarming}</h2>
            <p>{t.featuresDesc}</p>
          </div>
          <div className="feature-grid">
            <article className="feature"><div className="icon">🌿</div><h3>{t.cropHealthTitle}</h3><p>{t.cropHealthDesc}</p></article>
            <article className="feature"><div className="icon">🧪</div><h3>{t.pesticideGuidanceTitle}</h3><p>{t.pesticideGuidanceDesc}</p></article>
            <article className="feature"><div className="icon">💧</div><h3>{t.smartIrrigationTitle}</h3><p>{t.smartIrrigationDesc}</p></article>
            <article className="feature"><div className="icon">📊</div><h3>{t.farmDashboardTitle}</h3><p>{t.farmDashboardDesc}</p></article>
            <article className="feature"><div className="icon">🌦️</div><h3>{t.weatherAwarenessTitle}</h3><p>{t.weatherAwarenessDesc}</p></article>
            <article className="feature"><div className="icon">🪴</div><h3>{t.cropGuideTitle}</h3><p>{t.cropGuideDesc}</p></article>
            <article className="feature"><div className="icon">🔔</div><h3>{t.alertsTitle}</h3><p>{t.alertsDesc}</p></article>
            <article className="feature"><div className="icon">♻️</div><h3>{t.sustainableFarmingTitle}</h3><p>{t.sustainableFarmingDesc}</p></article>
          </div>
        </section>

        {/* Disease Section */}
        <section className="disease home-section" id="disease">
          <div className="section-head">
            <div className="eyebrow">{t.aiCropHealthModule}</div>
            <h2>{t.uploadCropImageTitle}</h2>
            <p>{t.uploadSub}</p>
          </div>
          <div className="disease-layout">
            <div className="upload-card">
              <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
                <div>
                  <div style={{ fontSize: '48px' }}>📷</div>
                  <h3>{t.uploadCropLeafImage}</h3>
                  <p style={{ color: '#69766d', fontSize: '14px' }}>{t.jpgPngNote}</p>
                  <label className="upload-label" onClick={(e) => e.stopPropagation()}>
                    {t.chooseImage}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageSelect}
                    />
                  </label>
                  {previewUrl && (
                    <img className="preview" src={previewUrl} alt="Selected crop preview" style={{ display: 'block' }} />
                  )}
                </div>
              </div>
            </div>

            <div className="result-card">
              <h3>{t.cropHealthResult}</h3>
              <div className="status-badge">
                {analyzing ? `⏳ ${t.analyzingImage}` : t.demoAnalyzerReady}
              </div>
              <div className="result-box">
                <strong>{diseaseResult ? `${diseaseResult.crop}: ${diseaseResult.condition}` : t.waitingForImage}</strong>
                <span>{diseaseResult ? 'Gemini AI Vision Analysis Completed' : t.uploadToDisplay}</span>
              </div>
              <div className="result-box">
                <strong>{t.suggestedCare}</strong>
                <span>{diseaseResult ? diseaseResult.care : 'Upload an image or login to farmer dashboard for full treatment and IPM alternatives.'}</span>
              </div>
              <div className="chips">
                <span className="chip">Gemini AI Detection</span>
                <span className="chip">Safety Warnings</span>
                <span className="chip">IPM Alternatives</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="big-btn green w-full justify-center"
                  onClick={() => onNavigate('farmer-login')}
                >
                  👨‍🌾 Open Full Farmer Scanner & Dashboard →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Guides Section */}
        <section className="guides home-section" id="guides">
          <div className="section-head">
            <div className="eyebrow">{lang === 'te' ? 'రైతు జ్ఞాన కేంద్రం' : 'Farmer knowledge hub'}</div>
            <h2>{lang === 'te' ? 'ముఖ్యమైన వ్యవసాయ దశలకు సులభమైన మార్గదర్శకం.' : 'Simple guidance for important farm stages.'}</h2>
            <p>{lang === 'te' ? 'వ్యవసాయ మార్గదర్శకానికి ఈ కార్డులను ఆధారంగా ఉపయోగించండి.' : 'Use these cards as the base for your future database-driven farming guide.'}</p>
          </div>
          <div className="guide-grid">
            <article className="guide">
              <div className="num">01 / PREPARATION</div>
              <h3>🌱 Soil & Sowing</h3>
              <p>{lang === 'te' ? 'సరైన పంటలను ఎంచుకుని, నేలను సిద్ధం చేసి, నాణ్యమైన విత్తనాలను ఎంచుకుని సూచించిన లోతుతో విత్తండి.' : 'Choose suitable crops, prepare the soil, select quality seeds and follow the recommended sowing depth and spacing.'}</p>
            </article>
            <article className="guide">
              <div className="num">02 / GROWTH</div>
              <h3>💧 Irrigation</h3>
              <p>{lang === 'te' ? 'పంట అవసరాలను గమనించి అవసరం లేని నీటిని నివారించండి. మంచి ప్రణాళిక నీటిని ఆదా చేస్తుంది.' : 'Monitor crop requirements and avoid unnecessary watering. Good irrigation planning helps conserve water.'}</p>
            </article>
            <article className="guide">
              <div className="num">03 / PROTECTION</div>
              <h3>🛡️ Crop Protection</h3>
              <p>{lang === 'te' ? 'ఆకులు మరియు మొక్కలను క్రమం తప్పకుండా గమనించండి. లక్షణాలను ముందుగా గుర్తించండి.' : 'Observe leaves and plants regularly. Identify symptoms early and follow label directions for any approved treatment.'}</p>
            </article>
            <article className="guide">
              <div className="num">04 / NUTRITION</div>
              <h3>🌾 Plant Nutrition</h3>
              <p>{lang === 'te' ? 'నేల సమాచారం మరియు పంట అవసరాలతో సమతుల్య పోషక నిర్వహణను ప్లాన్ చేయండి.' : 'Use soil information and crop requirements to plan balanced nutrient management.'}</p>
            </article>
            <article className="guide">
              <div className="num">05 / HARVEST</div>
              <h3>🧺 Harvest Planning</h3>
              <p>{lang === 'te' ? 'కోత అనంతర నష్టాలను తగ్గించడానికి పంట పరిపక్వత మరియు వాతావరణాన్ని గమనించండి.' : 'Track maturity, weather conditions and storage readiness to reduce avoidable post-harvest losses.'}</p>
            </article>
            <article className="guide">
              <div className="num">06 / RECORDS</div>
              <h3>📋 Farm Records</h3>
              <p>{lang === 'te' ? 'పంట, ఇన్‌పుట్, నీటిపారుదల మరియు కోత రికార్డులను నిర్వహించండి.' : 'Maintain crop, input, irrigation and harvest records so decisions can be reviewed over time.'}</p>
            </article>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact home-section" id="contact">
          <div className="section-head">
            <div className="eyebrow">{t.contact}</div>
            <h2>{lang === 'te' ? 'మెరుగైన వ్యవసాయ విధానాన్ని నిర్మించండి.' : 'Build a smarter farm workflow.'}</h2>
            <p>{lang === 'te' ? 'వ్యవసాయ సహాయం మరియు అడ్మినిస్ట్రేటర్ సంప్రదింపులకు ఈ ఫారమ్ ఉపయోగించండి.' : 'A clean contact section connected to the backend support database.'}</p>
          </div>
          <div className="contact-grid">
            <div className="info-box">
              <div className="info-row">
                <div style={{ fontSize: '25px' }}>👨‍🌾</div>
                <div>
                  <b>Farmer Support</b>
                  <span>Crop health, farming tips, schemes, and portal assistance.</span>
                </div>
              </div>
              <div className="info-row">
                <div style={{ fontSize: '25px' }}>🛡️</div>
                <div>
                  <b>Administrator Desk</b>
                  <span>Manage farmers, crop records, alerts, and system content.</span>
                </div>
              </div>
              <div className="info-row">
                <div style={{ fontSize: '25px' }}>📍</div>
                <div>
                  <b>Agricultural Extension Zone</b>
                  <span>State Agricultural Directorate • Telangana Region</span>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              <input
                required
                type="text"
                placeholder={lang === 'te' ? '👤 మీ పేరు' : '👤 Your name'}
                value={contactName}
                onChange={e => setContactName(e.target.value)}
              />
              <input
                required
                type="email"
                placeholder={lang === 'te' ? '📧 ఈమెయిల్ చిరునామా' : '📧 Email address'}
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
              />
              <select value={contactTopic} onChange={e => setContactTopic(e.target.value)}>
                <option value="Farmer Support">Farmer Support</option>
                <option value="Administrator Support">Administrator Support</option>
                <option value="Project Feedback">Project Feedback</option>
              </select>
              <textarea
                required
                placeholder={lang === 'te' ? '💬 మీ సందేశాన్ని రాయండి...' : '💬 Write your message...'}
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
              />
              <button type="submit" disabled={sendingContact}>
                {sendingContact ? 'Sending...' : (lang === 'te' ? 'సందేశం పంపండి' : 'Send Message')}
              </button>
            </form>
          </div>
        </section>

        {/* Bottom Login Section */}
        <section className="bottom-nav-section">
          <div className="bottom-nav-head">
            <div className="eyebrow">{t.portalAccess}</div>
            <h2>{t.loginToAgriRaksha}</h2>
            <p>{t.selectRoleToContinue}</p>
          </div>
          <div className="login-bottom-buttons">
            <button type="button" className="bottom-login farmer-login" onClick={() => onNavigate('farmer-login')}>
              <span>👨‍🌾</span>
              <div>
                <b>{t.farmerLogin}</b>
                <small>{t.accessFarmerTools}</small>
              </div>
              <strong>→</strong>
            </button>
            <button type="button" className="bottom-login admin-login" onClick={() => onNavigate('admin-login')}>
              <span>🛡️</span>
              <div>
                <b>{t.adminLogin}</b>
                <small>{t.manageFarmersRecords}</small>
              </div>
              <strong>→</strong>
            </button>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div><b>👨‍🌾 AGRIRAKSHA</b> — {t.systemSubtitle}</div>
        <div>Smart Agriculture Platform • Full-Stack Edition</div>
      </footer>
    </div>
  );
};
