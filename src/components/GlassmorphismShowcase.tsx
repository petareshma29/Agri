import React, { useState, useEffect } from 'react';
import { Farmer, Crop, MarketRate } from '../types.ts';

interface GlassmorphismShowcaseProps {
  lang: 'en' | 'te';
  farmer?: Farmer | null;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  crops?: Crop[];
  marketRates?: MarketRate[];
  onLoginSuccess?: (farmer: Farmer) => void;
}

export const GlassmorphismShowcase: React.FC<GlassmorphismShowcaseProps> = ({
  lang,
  farmer,
  onNavigate,
  showToast,
  crops = [],
  marketRates = [],
  onLoginSuccess
}) => {
  // Theme Color Switcher (Matches top right 3 dots from user reference image)
  const [themeColor, setThemeColor] = useState<'blue' | 'sky' | 'coral'>('blue');
  const [viewMode, setViewMode] = useState<'showcase' | 'app'>('showcase');
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);

  // Background Images Auto-Cycle (2.5 seconds)
  const [bgSlide, setBgSlide] = useState(0);
  const BG_IMAGES = [
    '/assets/bg-sprout-sunrise.jpg',
    '/assets/bg-green-field-trees.jpg',
    '/assets/bg-tractor-field.jpg'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBgSlide(prev => (prev + 1) % BG_IMAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Screen 2 (Login) state
  const [loginPhone, setLoginPhone] = useState('9876543210');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Screen 4 & 5 (Crop Planning) state
  const [planMonth, setPlanMonth] = useState('September');
  const [planCrop, setPlanCrop] = useState('Rice (Paddy)');
  const [planAcres, setPlanAcres] = useState('2.5');
  const [planCalculated, setPlanCalculated] = useState(false);

  // Handle color accent change
  const handleColorChange = (c: 'blue' | 'sky' | 'coral') => {
    setThemeColor(c);
    document.documentElement.setAttribute('data-glass-theme', c);
    showToast(`Accent switched to ${c.toUpperCase()}`);
  };

  const handleQuickLogin = () => {
    showToast('✨ Logging in to Modern Agriculture...');
    const demoFarmer: Farmer = farmer || {
      id: 'F001',
      farmer_id: 'F001',
      name: 'Ramesh Patel',
      phone: loginPhone || '9876543210',
      aadhaar_number: 'XXXX-XXXX-4321',
      email: 'ramesh@agriraksha.demo',
      village: 'Rampur',
      district: 'Warangal',
      state: 'Telangana',
      land_area: '5.5 acres',
      soil_type: 'Red Sandy Loam',
      irrigation_type: 'Drip Irrigation',
      joined_date: '15 August 2024'
    };
    if (onLoginSuccess) {
      onLoginSuccess(demoFarmer);
    }
    setActiveScreenIndex(2); // Jump to Home screen
    showToast('👋 Welcome back, ' + demoFarmer.name);
  };

  // Crop Planning Calculation
  const numericAcres = parseFloat(planAcres) || 1;
  const estimatedYield = (numericAcres * 22).toFixed(1); // quintals
  const estimatedRevenue = (numericAcres * 22 * 2350).toLocaleString('en-IN');
  const waterReq = (numericAcres * 1200).toLocaleString('en-IN') + ' Liters/week';

  return (
    <div className="relative min-h-screen text-slate-900 pb-24 overflow-x-hidden font-sans">
      {/* Background Scenic Ambient Canvas with Auto-Cycling Images (2.5s) */}
      <div className="glass-ambient-canvas">
        {BG_IMAGES.map((img, i) => (
          <div
            key={img}
            style={{
              position: 'absolute',
              inset: '-20px',
              backgroundImage: `url("${img}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: i === bgSlide ? 0.38 : 0,
              filter: 'blur(16px) saturate(1.35) brightness(1.05)',
              transform: 'scale(1.08)',
              transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        ))}
        <div className="glass-ambient-orb-1" />
        <div className="glass-ambient-orb-2" />
      </div>

      {/* Top Bar: "9. Glassmorphism Model - Modern, premium, transparent cards" */}
      <header className="glass-model-banner">
        <div className="glass-model-brand">
          <h1 className="glass-model-title">
            <span style={{ color: 'var(--glass-accent)', fontSize: '20px' }}>✦</span>
            9. Glassmorphism Model
          </h1>
          <span className="glass-model-badge">Modern, premium, transparent cards</span>
        </div>

        <div className="glass-model-controls">
          {/* 3 Color Dots from Mockup */}
          <div className="glass-color-dots" title="Select theme accent color">
            <button
              type="button"
              className={`glass-dot glass-dot-blue ${themeColor === 'blue' ? 'active' : ''}`}
              onClick={() => handleColorChange('blue')}
              aria-label="Cobalt Blue Accent"
            />
            <button
              type="button"
              className={`glass-dot glass-dot-sky ${themeColor === 'sky' ? 'active' : ''}`}
              onClick={() => handleColorChange('sky')}
              aria-label="Sky Cyan Accent"
            />
            <button
              type="button"
              className={`glass-dot glass-dot-coral ${themeColor === 'coral' ? 'active' : ''}`}
              onClick={() => handleColorChange('coral')}
              aria-label="Coral Peach Accent"
            />
          </div>

          {/* Toggle between 5-Screen Mockup and Full App */}
          <button
            type="button"
            className="glass-view-toggle"
            onClick={() => setViewMode(viewMode === 'showcase' ? 'app' : 'showcase')}
          >
            {viewMode === 'showcase' ? '🖥️ Fullscreen View' : '📱 5-Screen Mockup'}
          </button>

          <button
            type="button"
            className="glass-view-toggle"
            onClick={() => onNavigate('home')}
            title="Return to standard dashboard"
          >
            🏠 Exit
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: 5-Screen Mockup Gallery (Exact replication of user reference) */}
      {viewMode === 'showcase' && (
        <section className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Interactive 5-Screen Mobile Architecture
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
              Swipe or scroll horizontally to interact with all five glassmorphism screens from your design mockup.
            </p>
          </div>

          <div className="glass-showcase-gallery">
            {/* SCREEN 1: Welcome / Splash */}
            <div>
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                1. Splash / Welcome
              </div>
              <div className="glass-phone-container">
                <div className="glass-phone-notch" />
                <div className="glass-phone-inner justify-between items-center text-center">
                  <div className="w-full flex justify-between text-[11px] font-bold text-slate-700 px-2 opacity-80">
                    <span>9:41</span>
                    <span>5G • 100%</span>
                  </div>

                  <div className="my-auto flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-lg grid place-items-center mb-5">
                      <span className="text-4xl">🌱</span>
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                      Modern<br />Agriculture
                    </h2>

                    <p className="text-sm font-semibold text-slate-700 mt-3 max-w-[200px]">
                      Better Crops<br />Better Future
                    </p>
                  </div>

                  <div className="w-full pb-4">
                    <button
                      type="button"
                      className="glass-btn-primary w-full shadow-lg"
                      onClick={() => {
                        showToast('Next: Login Screen');
                      }}
                    >
                      Get Started →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SCREEN 2: Login */}
            <div>
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                2. Login Screen
              </div>
              <div className="glass-phone-container">
                <div className="glass-phone-notch" />
                <div className="glass-phone-inner justify-between">
                  <div className="w-full flex justify-between text-[11px] font-bold text-slate-700 px-2 opacity-80">
                    <span>9:41</span>
                    <span>5G • 100%</span>
                  </div>

                  <div className="my-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-slate-900">Login</h3>
                      <p className="text-xs font-semibold text-slate-600">Welcome Back!</p>
                    </div>

                    <div className="space-y-3">
                      <div className="glass-field-group">
                        <span className="glass-field-icon">👤</span>
                        <input
                          type="text"
                          className="glass-field-input"
                          value={loginPhone}
                          onChange={e => setLoginPhone(e.target.value)}
                          placeholder="Username or Phone"
                        />
                      </div>

                      <div className="glass-field-group">
                        <span className="glass-field-icon">🔒</span>
                        <input
                          type="password"
                          className="glass-field-input"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Password / OTP"
                        />
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          className="text-[11px] font-bold text-slate-700 hover:text-slate-900"
                          onClick={() => showToast('Demo Password/OTP is 123456')}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="button"
                        className="glass-btn-white w-full font-black text-sm"
                        onClick={handleQuickLogin}
                      >
                        Login
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          className="text-xs font-bold text-slate-800 underline decoration-slate-400"
                          onClick={handleQuickLogin}
                        >
                          Create Account / Demo Login
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-600 pb-1">
                    AgriRaksha Verified Glass ID
                  </div>
                </div>
              </div>
            </div>

            {/* SCREEN 3: Home */}
            <div>
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                3. Home Dashboard
              </div>
              <div className="glass-phone-container">
                <div className="glass-phone-notch" />
                <div className="glass-phone-inner">
                  <div className="w-full flex justify-between text-[11px] font-bold text-slate-700 px-2 mb-3 opacity-80">
                    <span>9:41</span>
                    <span>5G • 100%</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">Home</h3>
                    <p className="text-xs font-bold text-slate-700">Good Morning, {farmer?.name?.split(' ')[0] || 'Farmer'} 🌾</p>
                  </div>

                  {/* 4 Glass Action Cards (2x2 Grid from reference image) */}
                  <div className="glass-tile-grid">
                    <div
                      className="glass-action-tile glass-tile-plan"
                      onClick={() => {
                        showToast('Opened Crop Planning');
                      }}
                    >
                      <div className="glass-tile-icon-box">🛡️</div>
                      <div className="glass-tile-title">Plan Crop</div>
                      <div className="glass-tile-subtitle">Seasons & Yield</div>
                    </div>

                    <div
                      className="glass-action-tile glass-tile-farm"
                      onClick={() => onNavigate('farmer-dashboard')}
                    >
                      <div className="glass-tile-icon-box">🏡</div>
                      <div className="glass-tile-title">My Farm</div>
                      <div className="glass-tile-subtitle">Land & Irrigation</div>
                    </div>

                    <div
                      className="glass-action-tile glass-tile-crops"
                      onClick={() => onNavigate('farmer-dashboard')}
                    >
                      <div className="glass-tile-icon-box">🍃</div>
                      <div className="glass-tile-title">Crops</div>
                      <div className="glass-tile-subtitle">{crops.length || 6} Active Crops</div>
                    </div>

                    <div
                      className="glass-action-tile glass-tile-market"
                      onClick={() => onNavigate('crop-rate')}
                    >
                      <div className="glass-tile-icon-box">💰</div>
                      <div className="glass-tile-title">Market</div>
                      <div className="glass-tile-subtitle">Mandi Rates</div>
                    </div>
                  </div>

                  {/* Mini Weather Glass Banner */}
                  <div className="bg-white/35 backdrop-blur-md rounded-2xl p-3 border border-white/50 mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Today's Weather</div>
                      <div className="text-sm font-black text-slate-900">29°C • Partly Sunny</div>
                    </div>
                    <span className="text-2xl">🌤️</span>
                  </div>

                  {/* Bottom Navigation Mockup */}
                  <div className="mt-auto bg-white/45 backdrop-blur-lg rounded-full py-2 px-3 border border-white/60 flex justify-around text-slate-700">
                    <button type="button" className="text-xs font-black text-blue-700">🏠 Home</button>
                    <button type="button" className="text-xs font-bold text-slate-700">📅 Plan</button>
                    <button type="button" className="text-xs font-bold text-slate-700">🌾 Crops</button>
                    <button type="button" className="text-xs font-bold text-slate-700" onClick={() => onNavigate('farmer-dashboard')}>👤 Profile</button>
                  </div>
                </div>
              </div>
            </div>

            {/* SCREEN 4: Crop Planning Step 1 */}
            <div>
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                4. Crop Planning (Step 1)
              </div>
              <div className="glass-phone-container">
                <div className="glass-phone-notch" />
                <div className="glass-phone-inner justify-between">
                  <div>
                    <div className="w-full flex justify-between text-[11px] font-bold text-slate-700 px-2 mb-3 opacity-80">
                      <span>9:41</span>
                      <span>5G • 100%</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-4">Crop Planning</h3>

                    {/* Month Selector Dropdown with Glass styling */}
                    <div className="mb-3">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Month</label>
                      <select
                        className="glass-input cursor-pointer"
                        value={planMonth}
                        onChange={e => setPlanMonth(e.target.value)}
                      >
                        <option value="September">September (Kharif Transition)</option>
                        <option value="October">October (Rabi Sowing)</option>
                        <option value="November">November (Winter Crops)</option>
                        <option value="June">June (Monsoon Kharif)</option>
                      </select>
                    </div>

                    {/* Crop Selector Dropdown */}
                    <div className="mb-4">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Crop</label>
                      <select
                        className="glass-input cursor-pointer"
                        value={planCrop}
                        onChange={e => setPlanCrop(e.target.value)}
                      >
                        <option value="Rice (Paddy)">Rice (Paddy - BPT 5204)</option>
                        <option value="Cotton">Cotton (Bt Cotton Hybrid)</option>
                        <option value="Tomato">Tomato (Arka Rakshak)</option>
                        <option value="Maize">Maize (DHM 117)</option>
                        <option value="Chilli">Chilli (G4 Super)</option>
                        <option value="Groundnut">Groundnut (TMV 2)</option>
                      </select>
                    </div>

                    {/* Crop Specs Card */}
                    <div className="bg-white/35 backdrop-blur-md rounded-2xl p-3 border border-white/60 text-xs space-y-1.5">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                        <span>🌱 {planCrop}</span>
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Optimal</span>
                      </div>
                      <div className="text-slate-700"><b>Soil:</b> Well-drained Loam / Clay</div>
                      <div className="text-slate-700"><b>Water Need:</b> Moderate to High</div>
                      <div className="text-slate-700"><b>Maturity:</b> 115 - 130 Days</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="glass-btn-primary w-full mt-4"
                    onClick={() => showToast('Switched to Step 2 with your crop specs!')}
                  >
                    Next: Enter Acreage →
                  </button>
                </div>
              </div>
            </div>

            {/* SCREEN 5: Crop Planning Step 2 */}
            <div>
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                5. Crop Planning (Step 2)
              </div>
              <div className="glass-phone-container">
                <div className="glass-phone-notch" />
                <div className="glass-phone-inner justify-between">
                  <div>
                    <div className="w-full flex justify-between text-[11px] font-bold text-slate-700 px-2 mb-3 opacity-80">
                      <span>9:41</span>
                      <span>5G • 100%</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-3">Crop Planning</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Selected Month</label>
                        <div className="glass-input font-bold text-xs bg-white/20">{planMonth}</div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Eligible Crop</label>
                        <div className="glass-input font-bold text-xs bg-white/20">{planCrop}</div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Enter Acres</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="100"
                          className="glass-input"
                          value={planAcres}
                          onChange={e => setPlanAcres(e.target.value)}
                        />
                      </div>

                      {/* Calculation Outcome */}
                      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/60 space-y-1.5 text-xs">
                        <div className="font-black text-slate-900 text-sm">📊 Planning Estimates:</div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Est. Yield:</span>
                          <b>{estimatedYield} Quintals</b>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Water Req:</span>
                          <b>{waterReq}</b>
                        </div>
                        <div className="flex justify-between text-green-900 font-bold">
                          <span>Est. Revenue:</span>
                          <b>₹{estimatedRevenue}</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      className="glass-btn-primary w-full"
                      onClick={() => {
                        setPlanCalculated(true);
                        showToast(`✅ Plan saved for ${planAcres} acres of ${planCrop}!`);
                      }}
                    >
                      Next / Save Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIEW MODE 2: Fullscreen Interactive Glass Experience */}
      {viewMode === 'app' && (
        <main className="max-w-6xl mx-auto px-4 py-8 relative z-10 space-y-8">
          {/* Hero Welcome Glass Banner */}
          <section className="glass-panel p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/70 text-xs font-bold text-slate-800">
                <span>🌱</span> Modern Agriculture Platform
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Better Crops,<br />Better Future.
              </h2>
              <p className="text-base text-slate-700 font-medium">
                Experience transparent glassmorphic precision. Plan your crops, monitor real-time weather, scan crop diseases with AI, and track market Mandi rates.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="glass-btn-primary"
                  onClick={() => onNavigate('farmer-dashboard')}
                >
                  🚀 Open Full Farm Dashboard
                </button>
                <button
                  type="button"
                  className="glass-btn-white"
                  onClick={() => setViewMode('showcase')}
                >
                  📱 View 5-Screen Mockup
                </button>
              </div>
            </div>

            {/* 4 Action Cards Grid (Live) */}
            <div className="w-full md:w-[420px] glass-tile-grid m-0">
              <div
                className="glass-action-tile glass-tile-plan"
                onClick={() => setViewMode('showcase')}
              >
                <div className="glass-tile-icon-box">🛡️</div>
                <div className="glass-tile-title">Plan Crop</div>
                <div className="glass-tile-subtitle">Seasons & Yield</div>
              </div>

              <div
                className="glass-action-tile glass-tile-farm"
                onClick={() => onNavigate('farmer-dashboard')}
              >
                <div className="glass-tile-icon-box">🏡</div>
                <div className="glass-tile-title">My Farm</div>
                <div className="glass-tile-subtitle">{farmer?.village || 'Warangal'}, {farmer?.land_area || '5.5 acres'}</div>
              </div>

              <div
                className="glass-action-tile glass-tile-crops"
                onClick={() => onNavigate('farmer-dashboard')}
              >
                <div className="glass-tile-icon-box">🍃</div>
                <div className="glass-tile-title">Crops</div>
                <div className="glass-tile-subtitle">{crops.length || 6} Registered</div>
              </div>

              <div
                className="glass-action-tile glass-tile-market"
                onClick={() => onNavigate('crop-rate')}
              >
                <div className="glass-tile-icon-box">💰</div>
                <div className="glass-tile-title">Market</div>
                <div className="glass-tile-subtitle">Daily Mandi Rates</div>
              </div>
            </div>
          </section>

          {/* Interactive Crop Planning Studio (From screens 4 & 5) */}
          <section className="glass-panel p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Crop Planning Studio</h3>
                <p className="text-sm text-slate-600">Estimate production, water needs, and Mandi revenue with transparent calculation cards.</p>
              </div>
              <span className="text-xs font-bold bg-white/60 px-3 py-1 rounded-full border border-white/80">
                September 2026 Season
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">1. Select Planting Month</label>
                <select
                  className="glass-input"
                  value={planMonth}
                  onChange={e => setPlanMonth(e.target.value)}
                >
                  <option value="September">September (Kharif Late / Rabi Early)</option>
                  <option value="October">October (Rabi Sowing Peak)</option>
                  <option value="November">November (Wheat, Mustard & Bengal Gram)</option>
                  <option value="June">June (Monsoon Paddy & Cotton)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">2. Select Crop Variety</label>
                <select
                  className="glass-input"
                  value={planCrop}
                  onChange={e => setPlanCrop(e.target.value)}
                >
                  <option value="Rice (Paddy)">Rice (Paddy Common - ₹2,350/Qtl)</option>
                  <option value="Cotton">Cotton (Medium Staple - ₹7,120/Qtl)</option>
                  <option value="Tomato">Tomato (Hybrid Fresh - ₹2,800/Qtl)</option>
                  <option value="Maize">Maize (Grain Mandi - ₹2,050/Qtl)</option>
                  <option value="Chilli">Chilli (Dry Red - ₹14,500/Qtl)</option>
                  <option value="Groundnut">Groundnut (Oilseed - ₹6,800/Qtl)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">3. Cultivation Land (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  className="glass-input"
                  value={planAcres}
                  onChange={e => setPlanAcres(e.target.value)}
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>

            {/* Calculated Plan Preview Card */}
            <div className="mt-6 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Target Crop</div>
                <div className="text-lg font-black text-slate-900 mt-1">{planCrop}</div>
                <div className="text-xs text-slate-600 mt-0.5">{planMonth} sowing window</div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Estimated Yield</div>
                <div className="text-lg font-black text-blue-700 mt-1">{estimatedYield} Quintals</div>
                <div className="text-xs text-slate-600 mt-0.5">Based on {planAcres} acres</div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Weekly Irrigation</div>
                <div className="text-lg font-black text-emerald-700 mt-1">{waterReq}</div>
                <div className="text-xs text-slate-600 mt-0.5">Drip efficiency recommended</div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Forecast Revenue</div>
                <div className="text-lg font-black text-green-700 mt-1">₹{estimatedRevenue}</div>
                <div className="text-xs text-slate-600 mt-0.5">MSP / Mandi spot rate</div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Floating Bottom Glass Navigation Dock */}
      <nav className="glass-bottom-dock">
        <button
          type="button"
          className="glass-dock-btn active"
          onClick={() => setViewMode(viewMode === 'showcase' ? 'app' : 'showcase')}
        >
          <span className="icon">📱</span>
          <span>{viewMode === 'showcase' ? 'App' : 'Mockup'}</span>
        </button>

        <button
          type="button"
          className="glass-dock-btn"
          onClick={() => onNavigate('farmer-dashboard')}
        >
          <span className="icon">👨‍🌾</span>
          <span>Farm</span>
        </button>

        <button
          type="button"
          className="glass-dock-btn"
          onClick={() => onNavigate('crop-rate')}
        >
          <span className="icon">💰</span>
          <span>Rates</span>
        </button>

        <button
          type="button"
          className="glass-dock-btn"
          onClick={() => onNavigate('weather')}
        >
          <span className="icon">🌦️</span>
          <span>Weather</span>
        </button>

        <button
          type="button"
          className="glass-dock-btn"
          onClick={() => onNavigate('home')}
        >
          <span className="icon">🏠</span>
          <span>Home</span>
        </button>
      </nav>
    </div>
  );
};
