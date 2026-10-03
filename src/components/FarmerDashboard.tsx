import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations.ts';
import { api, clearStoredAuth } from '../api.ts';
import { Farmer, Crop, CropScan, Alert } from '../types.ts';

interface FarmerDashboardProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  farmer: Farmer;
}

const CROP_IMAGES: Record<string, string> = {
  Rice: '/assets/rice.jpg',
  Cotton: '/assets/farmer-3.jpg',
  Tomato: '/assets/user-ref/tomatoes.jpg',
  Maize: '/assets/farmer-2.jpg',
  Groundnut: '/assets/user-ref/onions.jpg',
  Chilli: '/assets/farmer-5.jpg'
};

const CROP_LIBRARY = [
  { name: 'Rice', desc: 'Paddy crop used for staple grain production. Requires adequate water during vegetative and flowering stages.', season: 'Kharif', use: 'Staple grain' },
  { name: 'Cotton', desc: 'Commercial fiber crop with visible bolls at maturity. Benefits from regulated irrigation and integrated pest monitoring.', season: 'Kharif', use: 'Natural fiber' },
  { name: 'Tomato', desc: 'High-value vegetable crop with green-to-red fruit development. Requires balanced calcium and blight monitoring.', season: 'Rabi', use: 'Vegetable' },
  { name: 'Maize', desc: 'Cereal crop grown for grain, feed, and food products. Fast growing with moderate water requirements.', season: 'Kharif', use: 'Cereal' },
  { name: 'Groundnut', desc: 'Oilseed and food legume crop grown below the soil surface. Prefers well-drained sandy-loam soils.', season: 'Kharif', use: 'Oilseed' }
];

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  lang,
  setLang,
  onNavigate,
  showToast,
  farmer: initialFarmer
}) => {
  const t = translations[lang];
  const [activeSection, setActiveSection] = useState('overview');
  const [farmer, setFarmer] = useState<Farmer>(initialFarmer);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scans, setScans] = useState<CropScan[]>([]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Library slider
  const [libraryIndex, setLibraryIndex] = useState(0);

  // Scanner state
  const [scanCropName, setScanCropName] = useState('Rice');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add crop modal
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('Rice');
  const [newCropArea, setNewCropArea] = useState('1.5 acres');
  const [newCropStage, setNewCropStage] = useState('Vegetative');
  const [newCropSeason, setNewCropSeason] = useState('Kharif');

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackTopic, setFeedbackTopic] = useState('crop');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: lang === 'te'
        ? 'నమస్కారం! పంటలు, పురుగులు, నేల, నీటిపారుదల మరియు వ్యాధి లక్షణాలపై నేను సహాయం చేస్తాను. మీ వాయిస్‌ను కూడా ఉపయోగించవచ్చు.'
        : 'Hi! I can help with crops, pests, soil, irrigation and disease symptoms. You can also use your voice.'
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [lastBotReply, setLastBotReply] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState({
    irrigation: false,
    leaves: false,
    weather: true,
    growth: false
  });

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: farmer.name || '',
    phone: farmer.phone || '',
    email: farmer.email || '',
    village: farmer.village || '',
    district: farmer.district || '',
    state: farmer.state || '',
    land_area: farmer.land_area || '',
    soil_type: farmer.soil_type || '',
    irrigation_type: farmer.irrigation_type || ''
  });

  const syncFormWithFarmer = (f: Farmer = farmer) => {
    setProfileForm({
      name: f.name || '',
      phone: f.phone || '',
      email: f.email || '',
      village: f.village || '',
      district: f.district || '',
      state: f.state || '',
      land_area: f.land_area || '',
      soil_type: f.soil_type || '',
      irrigation_type: f.irrigation_type || ''
    });
  };

  useEffect(() => {
    syncFormWithFarmer(farmer);
  }, [farmer]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.updateProfile(profileForm);
      if (res.farmer) {
        setFarmer(res.farmer);
        try {
          const userRaw = localStorage.getItem('agriraksha_user');
          if (userRaw) {
            const user = JSON.parse(userRaw);
            localStorage.setItem('agriraksha_user', JSON.stringify({ ...user, ...res.farmer }));
          }
        } catch {}
        setIsEditingProfile(false);
        showToast(t.profileUpdated || 'Profile updated successfully!');
      }
    } catch (err: any) {
      showToast(err.message || t.profileUpdateFailed || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Fetch farmer data on mount
  useEffect(() => {
    loadDashboardData();
  }, [farmer.id]);

  const loadDashboardData = async () => {
    try {
      const [cropsRes, alertsRes, scansRes, profileRes] = await Promise.all([
        api.getCrops(),
        api.getAlerts(),
        api.getScans(),
        api.getProfile()
      ]);
      setCrops(cropsRes.crops);
      setAlerts(alertsRes.alerts);
      setScans(scansRes.scans);
      if (profileRes.farmer) setFarmer(profileRes.farmer);
    } catch (err) {
      console.warn('Failed to load farmer live records, fallback to local', err);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    showToast(lang === 'te' ? 'లాగౌట్ విజయవంతం' : 'Logged out');
    onNavigate('home');
  };

  // Add Crop
  const handleAddCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addCrop({
        crop_name: newCropName,
        area: newCropArea,
        stage: newCropStage,
        season: newCropSeason,
        health: 'Healthy',
        status: 'Good'
      });
      setCrops(prev => [...prev, res.crop]);
      setShowAddCropModal(false);
      showToast(lang === 'te' ? 'పంట విజయవంతంగా జోడించబడింది!' : 'Crop added successfully!');
    } catch {
      showToast('Failed to add crop');
    }
  };

  // Crop Scanner
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setScanStatus(lang === 'te' ? 'చిత్రం విశ్లేషణకు సిద్ధంగా ఉంది.' : 'Image ready for analysis.');
  };

  const handleAnalyzeCrop = async () => {
    if (!previewImage) {
      setScanStatus(lang === 'te' ? 'ముందుగా పంట ఫోటోను ఎంచుకోండి.' : 'Please select or upload a crop photo first.');
      return;
    }

    setScanLoading(true);
    setScanStatus(lang === 'te' ? 'Gemini AI పంటను విశ్లేషిస్తోంది...' : 'Analyzing crop with Gemini AI vision...');

    try {
      // Convert previewImage or file to base64
      let base64 = previewImage;
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const res = await api.analyzeCropImage(base64, scanCropName, 'Farmer dashboard scan');
      setScanResult(res.result || res.scan);
      setScans(prev => [res.scan, ...prev]);
      setScanStatus(lang === 'te' ? 'విశ్లేషణ పూర్తయింది!' : 'AI Analysis completed successfully!');
      showToast(lang === 'te' ? 'స్కాన్ సేవ్ చేయబడింది!' : 'Scan saved to records!');
    } catch (err: any) {
      setScanStatus(err.message || 'Analysis failed. Please try again.');
    } finally {
      setScanLoading(false);
    }
  };

  // Open Scanner pre-selected
  const openScannerForCrop = (name: string) => {
    setScanCropName(name);
    setActiveSection('scanner');
    setScanStatus((lang === 'te' ? 'ఎంచుకున్న పంట: ' : 'Selected crop: ') + name);
  };

  // Library Navigation
  const nextLibrary = () => setLibraryIndex((libraryIndex + 1) % CROP_LIBRARY.length);
  const prevLibrary = () => setLibraryIndex((libraryIndex - 1 + CROP_LIBRARY.length) % CROP_LIBRARY.length);
  const useLibraryCrop = () => {
    const selected = CROP_LIBRARY[libraryIndex].name;
    openScannerForCrop(selected);
  };

  // Feedback Submit
  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) {
      setFeedbackStatus(lang === 'te' ? 'దయచేసి మీ అభిప్రాయాన్ని రాయండి.' : 'Please write your feedback message.');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await api.submitFeedback(feedbackRating, feedbackTopic, feedbackMessage.trim());
      setFeedbackStatus(lang === 'te' ? 'ధన్యవాదాలు! మీ అభిప్రాయం సేవ్ చేయబడింది.' : 'Thank you! Your feedback has been saved.');
      setFeedbackMessage('');
      showToast(lang === 'te' ? 'అభిప్రాయం సమర్పించబడింది' : 'Feedback submitted');
    } catch {
      setFeedbackStatus(lang === 'te' ? 'అభిప్రాయం సేవ్ కాలేదు.' : 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Chatbot Send
  const handleSendChat = async (userText?: string) => {
    const query = userText || chatInput.trim();
    if (!query) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setChatInput('');

    try {
      const res = await api.askAiChat(query, lang);
      setChatMessages(prev => [...prev, { sender: 'bot', text: res.reply }]);
      setLastBotReply(res.reply);
    } catch {
      const fallbackMsg = lang === 'te'
        ? 'AI సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.'
        : 'AI service is temporarily unavailable. Please try again later.';
      setChatMessages(prev => [...prev, { sender: 'bot', text: fallbackMsg }]);
      setLastBotReply(fallbackMsg);
    }
  };

  // Voice Input (Web Speech Recognition)
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setChatInput(transcript);
        handleSendChat(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text to Speech
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.');
      return;
    }

    const lastBot = lastBotReply || chatMessages.filter(m => m.sender === 'bot').slice(-1)[0]?.text;
    if (!lastBot) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastBot);
    utterance.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const healthyCropsCount = crops.filter(c => c.health.toLowerCase().includes('healthy')).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Top Header */}
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
          <button className="nav-btn" onClick={handleLogout}>{t.logout}</button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="portal-wrap">
        <div className="dashboard">
          {/* Side Menu */}
          <aside className="side">
            <h3>👨‍🌾 <span>{t.farmerDashboard}</span></h3>

            <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>
              🏠 <span>{t.overview}</span>
            </button>
            <button className={activeSection === 'crops' ? 'active' : ''} onClick={() => setActiveSection('crops')}>
              🌾 <span>{t.myCrops}</span>
            </button>
            <button className={activeSection === 'library' ? 'active' : ''} onClick={() => setActiveSection('library')}>
              🖼️ <span>{t.cropLibrary}</span>
            </button>
            <button className={activeSection === 'scanner' ? 'active' : ''} onClick={() => setActiveSection('scanner')}>
              📷 <span>{t.aiCropDetection}</span>
            </button>
            <button className={activeSection === 'guidance' ? 'active' : ''} onClick={() => setActiveSection('guidance')}>
              📚 <span>{t.farmGuidance}</span>
            </button>
            <button className={activeSection === 'planner' ? 'active' : ''} onClick={() => setActiveSection('planner')}>
              📅 <span>{t.farmPlanner}</span>
            </button>
            <button className={activeSection === 'yield' ? 'active' : ''} onClick={() => setActiveSection('yield')}>
              📈 <span>{t.yieldExpenses}</span>
            </button>
            <button className={activeSection === 'weather' ? 'active' : ''} onClick={() => setActiveSection('weather')}>
              🌦️ <span>{t.weatherIrrigation}</span>
            </button>
            <button className={activeSection === 'market' ? 'active' : ''} onClick={() => setActiveSection('market')}>
              💰 <span>{t.marketSchemes}</span>
            </button>
            <button className={activeSection === 'history' ? 'active' : ''} onClick={() => setActiveSection('history')}>
              🧾 <span>{t.scanHistory}</span>
            </button>
            <button className={activeSection === 'alerts' ? 'active' : ''} onClick={() => setActiveSection('alerts')}>
              🔔 <span>{t.farmAlerts}</span>
            </button>
            <button className={activeSection === 'feedback' ? 'active' : ''} onClick={() => setActiveSection('feedback')}>
              💬 <span>{t.feedbackSuggestions}</span>
            </button>
            <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>
              👤 <span>{t.myProfile}</span>
            </button>

            <div className="side-divider" />
            <div className="side-quick">
              <div className="side-quick-title">{t.quickTools}</div>
              <button onClick={() => setChatOpen(!chatOpen)}>
                🤖 <span>{t.agriAi}</span>
              </button>
              <button onClick={() => { setActiveSection('scanner'); setChatOpen(true); handleVoiceInput(); }}>
                🎙️ <span>{t.voiceAssistant}</span>
              </button>
            </div>
          </aside>

          {/* Main Dashboard Sections */}
          <section style={{ minWidth: 0 }}>
            {/* 1. OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{t.farmerDashboard}</div>
                    <h1>{farmer.name} 👋</h1>
                    <p className="muted">
                      {lang === 'te'
                        ? 'మీ పంటలు, వ్యవసాయ ఆరోగ్యం, వాతావరణం మరియు మార్గదర్శక సాధనాలు ఒకేచోట.'
                        : 'Your crops, farm health, weather and advisory tools in one place.'}
                    </p>
                  </div>
                </div>

                {/* Farmer Profile Hero */}
                <div className="farmer-profile-hero">
                  <div className="farmer-profile-photo">
                    <img src="/assets/user-ref/farmer-harvest.jpg" alt="Farmer holding harvested crop" />
                  </div>
                  <div className="farmer-profile-info">
                    <div className="profile-kicker">{t.yourFarmProfile}</div>
                    <h2>{farmer.name}</h2>
                    <p className="profile-meta">{farmer.village} • {farmer.district} • {farmer.state}</p>
                    <div className="profile-mini-grid">
                      <div>
                        <span>{t.land}</span>
                        <b>{farmer.land_area}</b>
                      </div>
                      <div>
                        <span>{t.soilType}</span>
                        <b>{farmer.soil_type}</b>
                      </div>
                      <div>
                        <span>{t.irrigation}</span>
                        <b>{farmer.irrigation_type}</b>
                      </div>
                    </div>
                    <button className="profile-view-btn" onClick={() => setActiveSection('profile')}>
                      {t.viewFullProfile}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="stats">
                  <div className="stat">
                    <div className="num">{crops.length}</div>
                    <small>{t.registeredCrops}</small>
                  </div>
                  <div className="stat">
                    <div className="num">{farmer.land_area}</div>
                    <small>{t.farmArea}</small>
                  </div>
                  <div className="stat">
                    <div className="num">{healthyCropsCount}</div>
                    <small>{t.healthyCrops}</small>
                  </div>
                  <div className="stat">
                    <div className="num">{alerts.filter(a => a.status === 'active').length}</div>
                    <small>{t.activeAlerts}</small>
                  </div>
                </div>

                {/* Overview Stack */}
                <div className="overview-stack">
                  <article className="dash-card overview-crops-card">
                    <div className="section-row">
                      <div>
                        <h2>{t.myCrops}</h2>
                        <p className="muted">
                          {lang === 'te'
                            ? 'మీ ప్రస్తుత పంటలు, నిజమైన చిత్రాలు మరియు ఆరోగ్య స్థితి.'
                            : 'Your active crops with real field images and health status.'}
                        </p>
                      </div>
                      <button className="action-btn" onClick={() => setActiveSection('library')}>
                        🖼️ <span>{t.exploreCropLibrary}</span>
                      </button>
                    </div>
                    <div className="crop-grid">
                      {crops.map(c => (
                        <div key={c.id} className="crop-card">
                          <div className="crop-photo-wrap">
                            <img
                              className="crop-photo"
                              src={CROP_IMAGES[c.crop_name] || '/assets/rice.jpg'}
                              alt={`${c.crop_name} crop`}
                            />
                            <span className="crop-photo-label">🌿 {c.crop_name}</span>
                          </div>
                          <div className="crop-card-body">
                            <div className="crop-card-top">
                              <div className="crop-icon">{c.icon || '🌱'}</div>
                              <span className="pill">{c.status}</span>
                            </div>
                            <h3>{c.crop_name}</h3>
                            <p className="muted" style={{ marginTop: '7px' }}>{c.area} • {c.stage}</p>
                            <small>{c.health} • {c.season}</small>
                            <div style={{ marginTop: '12px' }}>
                              <button className="action-btn" onClick={() => openScannerForCrop(c.crop_name)}>
                                {t.scanThisCrop}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  {/* Checklist Card */}
                  <article className="dash-card checklist-card">
                    <div className="section-row">
                      <div>
                        <h2>{t.farmerChecklist}</h2>
                        <p className="muted">{t.simpleActionsToday}</p>
                      </div>
                      <span className="pill">Today</span>
                    </div>
                    <div className="checklist-grid">
                      <div className="check-item">
                        <span className="check-icon">💧</span>
                        <div>
                          <b>{t.checkIrrigation}</b>
                          <p>{t.checkIrrigationDesc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checklist.irrigation}
                          onChange={e => setChecklist({ ...checklist, irrigation: e.target.checked })}
                          aria-label="Check irrigation"
                        />
                      </div>
                      <div className="check-item">
                        <span className="check-icon">🔎</span>
                        <div>
                          <b>{t.inspectLeaves}</b>
                          <p>{t.inspectLeavesDesc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checklist.leaves}
                          onChange={e => setChecklist({ ...checklist, leaves: e.target.checked })}
                          aria-label="Inspect leaves"
                        />
                      </div>
                      <div className="check-item">
                        <span className="check-icon">🌦️</span>
                        <div>
                          <b>{t.checkWeather}</b>
                          <p>{t.checkWeatherDesc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checklist.weather}
                          onChange={e => setChecklist({ ...checklist, weather: e.target.checked })}
                          aria-label="Check weather"
                        />
                      </div>
                      <div className="check-item">
                        <span className="check-icon">🌱</span>
                        <div>
                          <b>{t.checkCropGrowth}</b>
                          <p>{t.checkCropGrowthDesc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checklist.growth}
                          onChange={e => setChecklist({ ...checklist, growth: e.target.checked })}
                          aria-label="Check crop growth"
                        />
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 2. MY CROPS */}
            {activeSection === 'crops' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'నా వ్యవసాయం' : 'My Farm'}</div>
                    <h1>{t.myCrops}</h1>
                    <p className="muted">
                      {lang === 'te'
                        ? 'నిజమైన పంట చిత్రాలు, పెరుగుదల దశ మరియు ప్రస్తుత ఆరోగ్యం.'
                        : 'Real crop photos, growth stage and current health.'}
                    </p>
                  </div>
                  <button className="primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setShowAddCropModal(true)}>
                    {t.addCrop}
                  </button>
                </div>

                <div className="crop-grid">
                  {crops.map(c => (
                    <div key={c.id} className="crop-card">
                      <div className="crop-photo-wrap">
                        <img
                          className="crop-photo"
                          src={CROP_IMAGES[c.crop_name] || '/assets/rice.jpg'}
                          alt={`${c.crop_name} crop`}
                        />
                        <span className="crop-photo-label">🌿 {c.crop_name}</span>
                      </div>
                      <div className="crop-card-body">
                        <div className="crop-card-top">
                          <div className="crop-icon">{c.icon || '🌱'}</div>
                          <span className="pill">{c.status}</span>
                        </div>
                        <h3>{c.crop_name}</h3>
                        <p className="muted" style={{ marginTop: '7px' }}>{c.area} • {c.stage}</p>
                        <small>{c.health} • {c.season}</small>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button className="action-btn" onClick={() => openScannerForCrop(c.crop_name)}>
                            {t.scanThisCrop}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CROP LIBRARY */}
            {activeSection === 'library' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'పంటలను అన్వేషించండి' : 'Explore Crops'}</div>
                    <h1>{t.cropLibrary}</h1>
                    <p className="muted">
                      {lang === 'te'
                        ? 'బాణాలను ఉపయోగించి మునుపటి మరియు సూచించిన పంటలను చూడండి.'
                        : 'Browse previous and suggested crops using the arrows.'}
                    </p>
                  </div>
                </div>

                <div className="crop-showcase dash-card">
                  <button className="showcase-arrow" onClick={prevLibrary} aria-label="Previous crop">‹</button>
                  <div className="showcase-main">
                    <div className="showcase-image-wrap">
                      <img
                        className="showcase-image"
                        src={CROP_IMAGES[CROP_LIBRARY[libraryIndex].name] || '/assets/rice.jpg'}
                        alt={CROP_LIBRARY[libraryIndex].name}
                      />
                    </div>
                    <div className="showcase-copy">
                      <span className="pill" style={{ width: 'fit-content', marginBottom: '8px' }}>
                        {lang === 'te' ? 'సూచించిన పంట' : 'Suggested crop'}
                      </span>
                      <h2>{CROP_LIBRARY[libraryIndex].name}</h2>
                      <p className="muted">{CROP_LIBRARY[libraryIndex].desc}</p>
                      <div className="showcase-meta">
                        <span>🌱 {CROP_LIBRARY[libraryIndex].season}</span>
                        <span>📦 {CROP_LIBRARY[libraryIndex].use}</span>
                      </div>
                      <button className="primary showcase-btn" onClick={useLibraryCrop}>
                        {lang === 'te' ? 'పంట స్కాన్‌కు ఉపయోగించండి' : 'Use for Crop Scan'}
                      </button>
                    </div>
                  </div>
                  <button className="showcase-arrow" onClick={nextLibrary} aria-label="Next crop">›</button>
                </div>

                <div className="crop-dots">
                  {CROP_LIBRARY.map((x, i) => (
                    <button
                      key={x.name}
                      className={`dot ${i === libraryIndex ? 'active' : ''}`}
                      onClick={() => setLibraryIndex(i)}
                      aria-label={x.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. AI CROP SCANNER */}
            {activeSection === 'scanner' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{t.aiCropDoctor}</div>
                    <h1>{t.scanCropForDisease}</h1>
                    <p className="muted">{t.scannerDesc}</p>
                  </div>
                </div>

                <div className="dash-card scanner-stack">
                  <div className="scan-box">
                    <div style={{ fontSize: '48px' }}>📷</div>
                    <h2>{t.uploadOrTakePhoto}</h2>
                    <p className="muted">JPG/PNG • clear daylight image recommended</p>

                    <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <select
                        value={scanCropName}
                        onChange={e => setScanCropName(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}
                      >
                        <option value="Rice">Rice (వరి)</option>
                        <option value="Cotton">Cotton (పత్తి)</option>
                        <option value="Tomato">Tomato (టమాటా)</option>
                        <option value="Maize">Maize (మొక్కజొన్న)</option>
                        <option value="Chilli">Chilli (మిరప)</option>
                        <option value="Groundnut">Groundnut (వేరుశనగ)</option>
                      </select>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        className="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📁 Choose / Take Photo
                      </button>
                    </div>

                    {previewImage && (
                      <img
                        className="scan-preview"
                        src={previewImage}
                        alt="Crop preview"
                        style={{ display: 'block', margin: '12px auto' }}
                      />
                    )}

                    <button
                      className="primary"
                      onClick={handleAnalyzeCrop}
                      disabled={scanLoading}
                      style={{ maxWidth: '300px', margin: 'auto' }}
                    >
                      {scanLoading ? 'Analyzing...' : t.analyzeCropBtn}
                    </button>
                    <p className="muted" style={{ marginTop: '10px', fontWeight: 600 }}>{scanStatus}</p>
                  </div>

                  {/* Large AI Result Panel */}
                  <div className="scan-result-large">
                    <div className="result-title-row">
                      <div>
                        <div className="eyebrow">AI Analysis (Gemini Vision)</div>
                        <h2>{t.detectionResult}</h2>
                      </div>
                      <span className="result-live">
                        ● {scanResult ? 'Diagnosis Completed' : (lang === 'te' ? 'సిద్ధంగా ఉంది' : 'Ready')}
                      </span>
                    </div>

                    {scanResult ? (
                      <div>
                        <span className="result-badge">
                          Confidence: {scanResult.confidence}%
                        </span>
                        <h3 style={{ margin: '10px 0', fontSize: '24px', color: '#123b1e' }}>
                          🌿 {scanResult.crop || scanCropName}: {scanResult.condition || scanResult.detected_condition}
                        </h3>

                        {scanResult.symptoms && scanResult.symptoms.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <b>{t.symptoms}:</b>
                            <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                              {scanResult.symptoms.map((s: string, idx: number) => (
                                <li key={idx} style={{ margin: '3px 0' }}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scanResult.possible_causes && scanResult.possible_causes.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <b>{t.cause}:</b>
                            <p style={{ marginTop: '3px', color: '#444' }}>{scanResult.possible_causes.join(', ')}</p>
                          </div>
                        )}

                        <h4 style={{ marginTop: '16px', fontSize: '16px' }}>💊 {t.pesticideTreatmentOptions}</h4>
                        <div className="advice-list">
                          {(scanResult.recommendations || []).map((rec: string, idx: number) => (
                            <div key={idx} className="advice-item">{rec}</div>
                          ))}
                        </div>

                        {scanResult.preventive_steps && scanResult.preventive_steps.length > 0 && (
                          <>
                            <h4 style={{ marginTop: '16px', fontSize: '16px' }}>🌿 {t.alternativeIpmOptions}</h4>
                            <div className="advice-list">
                              {scanResult.preventive_steps.map((step: string, idx: number) => (
                                <div key={idx} className="advice-item">{step}</div>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="demo-note" style={{ marginTop: '16px' }}>
                          {scanResult.uncertainty_note || t.safetyNotice}
                        </div>
                      </div>
                    ) : (
                      <p className="muted">
                        {lang === 'te'
                          ? 'స్కాన్ చేసిన తర్వాత ఫలితం ఇక్కడ కనిపిస్తుంది.'
                          : 'Your result will appear here after scanning.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="demo-note" style={{ marginTop: '14px' }}>
                  {t.safetyNotice}
                </div>
              </div>
            )}

            {/* 5. FARM GUIDANCE */}
            {activeSection === 'guidance' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'జ్ఞాన కేంద్రం' : 'Knowledge Hub'}</div>
                    <h1>{t.farmGuidance}</h1>
                  </div>
                </div>
                <div className="feature-grid-dash">
                  <article className="feature-card">
                    🌱<h3>Soil & Sowing</h3>
                    <p className="muted">Choose suitable crops, maintain soil moisture, and use quality seed.</p>
                  </article>
                  <article className="feature-card">
                    💧<h3>Irrigation</h3>
                    <p className="muted">Adjust watering according to crop stage, soil, and weather conditions.</p>
                  </article>
                  <article className="feature-card">
                    🛡️<h3>Crop Protection</h3>
                    <p className="muted">Inspect leaves regularly and act early when symptoms appear.</p>
                  </article>
                  <article className="feature-card">
                    🌿<h3>Organic Alternatives</h3>
                    <p className="muted">Use integrated pest management, neem-based products, and beneficial microbes.</p>
                  </article>
                  <article className="feature-card">
                    📋<h3>Farm Records</h3>
                    <p className="muted">Keep crop, input, irrigation, and harvest records updated.</p>
                  </article>
                  <article className="feature-card">
                    🧪<h3>Spray Safety</h3>
                    <p className="muted">Use only registered products for the crop and follow the product label instructions.</p>
                  </article>
                </div>
              </div>
            )}

            {/* 6. FARM PLANNER */}
            {activeSection === 'planner' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'స్మార్ట్ ప్లానింగ్' : 'Smart Planning'}</div>
                    <h1>{t.farmPlanner}</h1>
                    <p className="muted">Plan today's work and upcoming crop activities.</p>
                  </div>
                </div>
                <div className="planner-grid">
                  <article className="dash-card planner-highlight">
                    <span>📅</span>
                    <h2>Today</h2>
                    <p>Inspect tomato leaves, check cotton moisture, and keep rice drainage clear after rainfall.</p>
                  </article>
                  <article className="dash-card">
                    <h2>Upcoming Tasks</h2>
                    <div className="task-row">
                      🌱 <span>Seed / nursery check</span>
                      <b>Tomorrow</b>
                    </div>
                    <div className="task-row">
                      💧 <span>Irrigation review</span>
                      <b>2 days</b>
                    </div>
                    <div className="task-row">
                      🔎 <span>Crop scouting</span>
                      <b>3 days</b>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 7. YIELD & EXPENSES */}
            {activeSection === 'yield' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'వ్యవసాయ ఆర్థికం' : 'Farm Economics'}</div>
                    <h1>{t.yieldExpenses}</h1>
                  </div>
                </div>
                <div className="stats">
                  <div className="stat">
                    <div className="num">{farmer.land_area}</div>
                    <small>Total Acres</small>
                  </div>
                  <div className="stat">
                    <div className="num">{crops.length}</div>
                    <small>Active Crops</small>
                  </div>
                  <div className="stat">
                    <div className="num">82%</div>
                    <small>Farm Health</small>
                  </div>
                  <div className="stat">
                    <div className="num">₹32,450</div>
                    <small>Season Expenses</small>
                  </div>
                </div>
                <div className="dash-card">
                  <h2>Expense Categories</h2>
                  <div className="expense-grid">
                    <div>🌱 Seeds<br /><b>₹8,500</b></div>
                    <div>💧 Irrigation<br /><b>₹5,200</b></div>
                    <div>🧪 Crop care<br /><b>₹6,750</b></div>
                    <div>🚜 Labour & field work<br /><b>₹12,000</b></div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. WEATHER & IRRIGATION */}
            {activeSection === 'weather' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'వ్యవసాయ ప్రణాళిక' : 'Farm Planning'}</div>
                    <h1>{t.weatherIrrigation}</h1>
                  </div>
                </div>
                <div className="cards">
                  <article className="dash-card">
                    <h2>🌦️ <span>Today</span></h2>
                    <div className="stat">
                      <div className="num">29°C</div>
                      <small>Partly cloudy • 65% humidity • Wind 14 km/h</small>
                    </div>
                    <p className="muted" style={{ marginTop: '12px' }}>
                      Check local weather before spraying. Avoid spraying immediately before anticipated rainfall.
                    </p>
                  </article>
                  <article className="dash-card">
                    <h2>💧 <span>Irrigation Planner</span></h2>
                    <div className="alert">
                      🌾 <div><b>Rice</b><br /><span>Review field water level today.</span></div>
                    </div>
                    <div className="alert">
                      🌿 <div><b>Cotton</b><br /><span>Check soil moisture before irrigation.</span></div>
                    </div>
                    <div className="alert">
                      🍅 <div><b>Tomato</b><br /><span>Prefer consistent moisture; avoid waterlogging.</span></div>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 9. MARKET & SCHEMES */}
            {activeSection === 'market' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'రైతు సహాయం' : 'Farmer Support'}</div>
                    <h1>{t.marketSchemes}</h1>
                  </div>
                </div>
                <div className="cards">
                  <article className="dash-card">
                    <h2>Indicative Market Watch</h2>
                    <div className="alert">
                      🌾 <div><b>Rice (Paddy Common)</b><br />₹2,350 / quintal <span className="muted">• Warangal Grain Mandi</span></div>
                    </div>
                    <div className="alert">
                      🍅 <div><b>Tomato</b><br />₹3,500 / quintal <span className="muted">• Bowenpally Market</span></div>
                    </div>
                    <div className="alert">
                      🌽 <div><b>Maize</b><br />₹2,050 / quintal <span className="muted">• Nizamabad APMC</span></div>
                    </div>
                    <div className="alert">
                      🌶️ <div><b>Chilli</b><br />₹12,500 / quintal <span className="muted">• Khammam Market Yard</span></div>
                    </div>
                  </article>
                  <article className="dash-card">
                    <h2>Government Support & Schemes</h2>
                    <div className="alert">
                      🏦 <div><b>PM-KISAN</b><br /><span>Check eligibility and official status through government portal (pmkisan.gov.in).</span></div>
                    </div>
                    <div className="alert">
                      🛡️ <div><b>Pradhan Mantri Fasal Bima Yojana (PMFBY)</b><br /><span>Review seasonal coverage deadlines for Kharif and Rabi crops.</span></div>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 10. SCAN HISTORY */}
            {activeSection === 'history' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">AI Records</div>
                    <h1>{t.scanHistory}</h1>
                  </div>
                </div>
                <div className="dash-card">
                  <div className="scan-history">
                    {scans.length > 0 ? (
                      scans.map(s => (
                        <div key={s.id} className="history-row">
                          <div>
                            📷 <b>{s.detected_crop}</b> — <span style={{ color: '#0f6b3b' }}>{s.detected_condition}</span>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              Confidence: {s.confidence}%
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#777' }}>
                            {new Date(s.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No scans recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 11. ALERTS */}
            {activeSection === 'alerts' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Notifications</div>
                    <h1>{t.farmAlerts}</h1>
                  </div>
                </div>
                <div className="dash-card">
                  {alerts.map(a => (
                    <div key={a.id} className="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>{a.icon || '🔔'}</span>
                        <div>
                          <b>{a.type}: {a.title}</b>
                          <div style={{ color: '#444' }}>{a.message}</div>
                        </div>
                      </div>
                      {a.status === 'active' && (
                        <button
                          className="action-btn"
                          onClick={async () => {
                            await api.markAlertRead(a.id);
                            setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, status: 'read' } : x));
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12. FEEDBACK */}
            {activeSection === 'feedback' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">{lang === 'te' ? 'రైతు అభిప్రాయం' : 'Farmer Voice'}</div>
                    <h1>{t.feedbackSuggestions}</h1>
                    <p className="muted">Tell us what is working well and what you want us to improve.</p>
                  </div>
                </div>
                <div className="dash-card feedback-card">
                  <div className="feedback-grid">
                    <div>
                      <label>{t.yourRating}</label>
                      <div className="rating-row">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            className={n <= feedbackRating ? 'selected' : ''}
                            onClick={() => setFeedbackRating(n)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label>{t.topic}</label>
                      <select value={feedbackTopic} onChange={e => setFeedbackTopic(e.target.value)}>
                        <option value="dashboard">Dashboard</option>
                        <option value="crop">Crop Detection</option>
                        <option value="ai">AI Assistant</option>
                        <option value="language">Language</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <label>{t.yourFeedback}</label>
                  <textarea
                    rows={5}
                    placeholder={t.feedbackPlaceholder}
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                  />
                  <button
                    className="primary"
                    type="button"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting}
                  >
                    {feedbackSubmitting ? 'Submitting...' : t.submitFeedback}
                  </button>
                  {feedbackStatus && <p className="feedback-status">{feedbackStatus}</p>}
                </div>
              </div>
            )}

            {/* 13. MY PROFILE */}
            {activeSection === 'profile' && (
              <div className="dash-section">
                <div className="content-head">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div className="eyebrow">Account</div>
                      <h1>{t.myProfile}</h1>
                    </div>
                    <button
                      type="button"
                      className={isEditingProfile ? 'secondary' : 'primary'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontSize: '13px' }}
                      onClick={() => {
                        if (!isEditingProfile) syncFormWithFarmer();
                        setIsEditingProfile(!isEditingProfile);
                      }}
                    >
                      {isEditingProfile ? `✕ ${lang === 'te' ? 'రద్దు చేయండి' : 'Cancel'}` : `✏️ ${t.editProfile || 'Edit Profile'}`}
                    </button>
                  </div>
                </div>

                {/* Profile Overview Card */}
                <div className="dash-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', margin: 0 }}>
                      📋 {lang === 'te' ? 'రైతు ఖాతా వివరాలు' : 'Farmer Account Details'}
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', background: '#f5f8f2', padding: '4px 10px', borderRadius: '8px' }}>
                      ID: <b>{farmer.id}</b>
                    </span>
                  </div>

                  <div className="profile-grid">
                    <div className="profile-item"><small>Farmer ID</small><b>{farmer.id}</b></div>
                    <div className="profile-item"><small>{t.profileName || 'Name'}</small><b>{farmer.name}</b></div>
                    <div className="profile-item"><small>{t.profilePhone || 'Phone'}</small><b>{farmer.phone}</b></div>
                    <div className="profile-item"><small>Aadhaar</small><b>XXXX-XXXX-{farmer.aadhaar_number?.slice(-4) || '1234'}</b></div>
                    <div className="profile-item"><small>{t.profileEmail || 'Email'}</small><b>{farmer.email || 'ramesh@agriraksha.demo'}</b></div>
                    <div className="profile-item"><small>{t.profileVillage || 'Village'}</small><b>{farmer.village}</b></div>
                    <div className="profile-item"><small>{t.profileDistrict || 'District'}</small><b>{farmer.district}</b></div>
                    <div className="profile-item"><small>{t.profileState || 'State'}</small><b>{farmer.state}</b></div>
                    <div className="profile-item"><small>{t.profileLandArea || 'Land Area'}</small><b>{farmer.land_area}</b></div>
                    <div className="profile-item"><small>{t.profileSoilType || 'Soil Type'}</small><b>{farmer.soil_type}</b></div>
                    <div className="profile-item"><small>{t.profileIrrigation || 'Irrigation Type'}</small><b>{farmer.irrigation_type}</b></div>
                    <div className="profile-item"><small>Joined Date</small><b>{farmer.joined_date}</b></div>
                  </div>
                </div>

                {/* Edit Profile Form (Placed exactly where the Firebase card was) */}
                <div className="dash-card" style={{ marginTop: '20px', borderTop: '4px solid var(--green)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '19px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✏️ {t.editProfile || 'Edit Profile'}
                      </h2>
                      <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
                        {lang === 'te'
                          ? 'మీ వ్యక్తిగత సమాచారం, ఫోన్ నంబర్, భూమి విస్తీర్ణం మరియు సాగు విధానాలను ఇక్కడ సవరించండి.'
                          : 'Update your personal details, land records, soil type, and irrigation preferences.'}
                      </p>
                    </div>

                    {!isEditingProfile && (
                      <button
                        type="button"
                        className="primary"
                        style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          syncFormWithFarmer();
                          setIsEditingProfile(true);
                        }}
                      >
                        ✏️ {t.editProfile || 'Edit Profile'}
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            👤 {t.profileName || 'Farmer Name'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. Ramesh Patel"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            📞 {t.profilePhone || 'Phone Number'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={profileForm.phone}
                            onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. 9876543210"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            ✉️ {t.profileEmail || 'Email Address'}
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. farmer@agriraksha.demo"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            🏡 {t.profileVillage || 'Village'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.village}
                            onChange={e => setProfileForm(prev => ({ ...prev, village: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. Rampur"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            📍 {t.profileDistrict || 'District'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.district}
                            onChange={e => setProfileForm(prev => ({ ...prev, district: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. Warangal"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            🗺️ {t.profileState || 'State'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.state}
                            onChange={e => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                            placeholder="e.g. Telangana"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            🌾 {t.profileLandArea || 'Land Area'} <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileForm.land_area}
                            onChange={e => setProfileForm(prev => ({ ...prev, land_area: e.target.value }))}
                            placeholder="e.g. 5.5 acres"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            🌱 {t.profileSoilType || 'Soil Type'}
                          </label>
                          <select
                            value={profileForm.soil_type}
                            onChange={e => setProfileForm(prev => ({ ...prev, soil_type: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                          >
                            <option value="Red Sandy Loam">Red Sandy Loam</option>
                            <option value="Black Cotton Soil">Black Cotton Soil</option>
                            <option value="Alluvial Soil">Alluvial Soil</option>
                            <option value="Clay Loam">Clay Loam</option>
                            <option value="Red Loamy Soil">Red Loamy Soil</option>
                            <option value="Laterite Soil">Laterite Soil</option>
                            <option value="Sandy Soil">Sandy Soil</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#123b24' }}>
                            💧 {t.profileIrrigation || 'Irrigation Type'}
                          </label>
                          <select
                            value={profileForm.irrigation_type}
                            onChange={e => setProfileForm(prev => ({ ...prev, irrigation_type: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', background: '#fff' }}
                          >
                            <option value="Drip Irrigation">Drip Irrigation</option>
                            <option value="Sprinkler Irrigation">Sprinkler Irrigation</option>
                            <option value="Borewell & Canal">Borewell & Canal</option>
                            <option value="Canal Irrigation">Canal Irrigation</option>
                            <option value="Borewell Irrigation">Borewell Irrigation</option>
                            <option value="Open Well">Open Well</option>
                            <option value="Rainfed">Rainfed</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="secondary"
                          disabled={profileSaving}
                          onClick={() => {
                            syncFormWithFarmer();
                            setIsEditingProfile(false);
                          }}
                          style={{ padding: '10px 20px', borderRadius: '10px' }}
                        >
                          ✕ {lang === 'te' ? 'రద్దు చేయండి' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="primary"
                          disabled={profileSaving}
                          style={{ padding: '10px 24px', borderRadius: '10px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          {profileSaving ? `⏳ ${t.savingProfile || 'Saving...'}` : `💾 ${t.saveProfile || 'Save Profile'}`}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#fbfdf9', padding: '16px 20px', borderRadius: '14px', border: '1px dashed #c8dec5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '24px', width: '44px', height: '44px', borderRadius: '12px', background: '#e8f5d7', display: 'grid', placeItems: 'center' }}>
                          ✍️
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#174828', fontSize: '15px' }}>
                            {lang === 'te' ? 'మీ ప్రొఫైల్ వివరాలను మార్చాలనుకుంటున్నారా?' : 'Need to modify your personal contact or farm information?'}
                          </div>
                          <p className="muted" style={{ fontSize: '12px', margin: '2px 0 0' }}>
                            {lang === 'te'
                              ? 'పేరు, ఫోన్, గ్రామం, భూమి విస్తీర్ణం మరియు నేల రకాన్ని సవరించడానికి ఎడిట్ బటన్ నొక్కండి.'
                              : 'Click edit to update name, phone number, village, soil type, land area or irrigation method.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="primary"
                        style={{ width: 'auto', padding: '9px 20px', fontSize: '13px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          syncFormWithFarmer();
                          setIsEditingProfile(true);
                        }}
                      >
                        ✏️ {t.editProfile || 'Edit Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Floating Agri AI Chatbot */}
      <div className="chat-wrap">
        <div className={`chat-box ${chatOpen ? 'open' : ''}`}>
          <div className="chat-head">
            <div>
              <b>🤖 {t.agriAiAssistant}</b>
              <small>{t.askSpeakExplore}</small>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{ background: 'none', border: 0, color: 'white', fontSize: '20px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div className="ai-quick">
            <button onClick={() => handleSendChat('What should I do for my crops today?')}>🌱 Today</button>
            <button onClick={() => handleSendChat('How can I check crop disease?')}>🦠 Disease</button>
            <button onClick={() => handleSendChat('Give me irrigation advice')}>💧 Irrigation</button>
          </div>

          <div className="chat-messages">
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <button
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              title="Voice input"
            >
              🎙️
            </button>
            <input
              placeholder={t.askAboutFarm}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
            />
            <button onClick={() => handleSendChat()}>➤</button>
          </div>

          <div className="ai-foot">
            <button onClick={handleReadAloud}>
              🔊 <span>{t.readAloud}</span>
            </button>
            <span>Agri AI • Gemini Powered</span>
          </div>
        </div>

        <button className="chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
          🤖
        </button>
      </div>

      {/* Add Crop Modal */}
      {showAddCropModal && (
        <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) setShowAddCropModal(false); }}>
          <div className="modal-box">
            <button className="close" onClick={() => setShowAddCropModal(false)}>×</button>
            <h2>Add New Crop</h2>
            <p>Register a crop to monitor its health and growth stage.</p>
            <form onSubmit={handleAddCropSubmit} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Crop Name</label>
                <select
                  value={newCropName}
                  onChange={e => setNewCropName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                >
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Maize">Maize</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Sugarcane">Sugarcane</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Area (acres)</label>
                <input
                  type="text"
                  value={newCropArea}
                  onChange={e => setNewCropArea(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Growth Stage</label>
                <select
                  value={newCropStage}
                  onChange={e => setNewCropStage(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                >
                  <option value="Sowing">Sowing</option>
                  <option value="Vegetative">Vegetative</option>
                  <option value="Flowering">Flowering</option>
                  <option value="Fruit Development">Fruit Development</option>
                  <option value="Maturity">Maturity / Harvest Ready</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Season</label>
                <select
                  value={newCropSeason}
                  onChange={e => setNewCropSeason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                >
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                </select>
              </div>
              <button className="primary" type="submit" style={{ marginTop: '10px' }}>
                Save Crop
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
