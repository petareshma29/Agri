import React, { useState } from 'react';
import { translations } from '../translations.ts';

interface SoilDetailsProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
}

export const SoilDetails: React.FC<SoilDetailsProps> = ({ lang, setLang, onNavigate }) => {
  const t = translations[lang];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedSoil, setSelectedSoil] = useState('black');

  const soilData: Record<string, any> = {
    black: {
      title: lang === 'te' ? 'నల్ల రేగడి నేల (Black Cotton Soil)' : 'Black Cotton Soil (Regur)',
      ph: '7.2 - 8.5 (Neutral to mildly alkaline)',
      moistureRetention: 'High (Excellent water retention capacity)',
      suitableCrops: ['Cotton (పత్తి)', 'Soybean', 'Chilli (మిరప)', 'Wheat', 'Maize'],
      nutrients: 'Rich in Calcium, Magnesium, Potassium, Carbonates; Low in Nitrogen and Phosphorus.',
      managementTips: [
        'Avoid over-irrigation during early vegetative stages to prevent root asphyxiation.',
        'Apply well-decomposed FYM (Farm Yard Manure) to maintain aeration and porosity.',
        'Use balanced phosphatic fertilizers like Single Super Phosphate (SSP) or DAP.'
      ]
    },
    red: {
      title: lang === 'te' ? 'ఎర్ర నేల (Red Sandy Loam Soil)' : 'Red Sandy Loam Soil',
      ph: '6.0 - 7.0 (Slightly acidic to neutral)',
      moistureRetention: 'Moderate to Low (Quick drainage)',
      suitableCrops: ['Groundnut (వేరుశనగ)', 'Paddy (వరి)', 'Ragi', 'Tomato (టమాటా)', 'Pulses'],
      nutrients: 'Rich in Potash and Iron; Deficient in Nitrogen, Humus, and Phosphorus.',
      managementTips: [
        'Adopt drip irrigation or mulching to minimize rapid moisture evaporation.',
        'Add organic matter, green manure (dhaincha / sunnhemp) to boost moisture capacity.',
        'Split nitrogen applications to reduce leaching losses during monsoon rains.'
      ]
    },
    alluvial: {
      title: lang === 'te' ? 'ఒండ్రు నేల (Alluvial Soil)' : 'Alluvial Soil',
      ph: '6.5 - 7.8 (Optimal neutral)',
      moistureRetention: 'Very High (Ideal balanced texture)',
      suitableCrops: ['Rice (వరి)', 'Sugarcane (చెరకు)', 'Banana', 'Vegetables', 'Maize'],
      nutrients: 'Rich in Potash, Lime, and Phosphoric acid; Adequate organic nitrogen.',
      managementTips: [
        'Maintain level terraces to prevent nutrient runoff during heavy water release.',
        'Adopt crop rotation with legumes to sustain nitrogen fixing bacteria.',
        'Perform annual soil testing through official soil health card centers.'
      ]
    }
  };

  const current = soilData[selectedSoil];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Portal Header */}
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
          <button className="nav-btn" onClick={() => onNavigate('home')}>{t.backToHome}</button>
        </div>
      </header>

      <main className="portal-wrap" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        <div className="content-head" style={{ marginBottom: '24px' }}>
          <div>
            <div className="eyebrow">🌱 {t.soil}</div>
            <h1>{lang === 'te' ? 'నేల ఆరోగ్యం & పోషక నిర్వహణ' : 'Soil Health & Nutrient Management'}</h1>
            <p className="muted">{t.soilSub}</p>
          </div>
        </div>

        {/* Soil Selector Tabs */}
        <div className="method-tabs" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <button
            className={`method-tab ${selectedSoil === 'black' ? 'active' : ''}`}
            onClick={() => setSelectedSoil('black')}
          >
            🪨 <span>{lang === 'te' ? 'నల్ల రేగడి నేల' : 'Black Soil'}</span>
          </button>
          <button
            className={`method-tab ${selectedSoil === 'red' ? 'active' : ''}`}
            onClick={() => setSelectedSoil('red')}
          >
            🧱 <span>{lang === 'te' ? 'ఎర్ర నేల' : 'Red Loam'}</span>
          </button>
          <button
            className={`method-tab ${selectedSoil === 'alluvial' ? 'active' : ''}`}
            onClick={() => setSelectedSoil('alluvial')}
          >
            🌊 <span>{lang === 'te' ? 'ఒండ్రు నేల' : 'Alluvial'}</span>
          </button>
        </div>

        {/* Soil Details Card */}
        <div className="dash-card">
          <div className="section-row" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="pill" style={{ marginBottom: '6px' }}>Soil Health Profile</span>
              <h2 style={{ fontSize: '26px', color: '#133e21' }}>{current.title}</h2>
            </div>
            <span style={{ fontSize: '38px' }}>🌱</span>
          </div>

          <div className="profile-grid" style={{ marginTop: '20px' }}>
            <div className="profile-item">
              <small>Optimal pH Range</small>
              <b>{current.ph}</b>
            </div>
            <div className="profile-item">
              <small>Moisture Retention</small>
              <b>{current.moistureRetention}</b>
            </div>
            <div className="profile-item" style={{ gridColumn: 'span 2' }}>
              <small>Nutrient Availability Profile</small>
              <b>{current.nutrients}</b>
            </div>
          </div>

          <div style={{ marginTop: '22px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🌾 {lang === 'te' ? 'అనుకూలమైన పంటలు' : 'Highly Suitable Crops'}</h3>
            <div className="chips">
              {current.suitableCrops.map((c: string, idx: number) => (
                <span key={idx} className="chip" style={{ fontSize: '14px', padding: '8px 14px' }}>{c}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>📋 {lang === 'te' ? 'రైతు నిర్వహణ సూచనలు' : 'Best Management Practices for Farmers'}</h3>
            <div className="advice-list">
              {current.managementTips.map((tip: string, idx: number) => (
                <div key={idx} className="advice-item">
                  <b>{idx + 1}.</b> {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Soil Card Banner */}
        <div className="dash-card" style={{ marginTop: '24px', background: 'linear-gradient(135deg,#e9f7dc,#fdfefb)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '38px' }}>📜</div>
            <div>
              <h3 style={{ fontSize: '19px' }}>{lang === 'te' ? 'సాయిల్ హెల్త్ కార్డ్ స్కీమ్' : 'Soil Health Card Scheme (Government of India)'}</h3>
              <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                {lang === 'te'
                  ? 'ప్రతి 3 సంవత్సరాలకు ఒకసారి మీ గ్రామ వ్యవసాయ విస్తరణ అధికారి (AEO) ద్వారా నేల నమూనాలను పరీక్షించండి.'
                  : 'Get your soil tested every 3 years through your local Village Agricultural Extension Officer (AEO) to optimize fertilizer spending.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
