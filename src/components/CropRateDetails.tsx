import React, { useState, useEffect } from 'react';
import { translations } from '../translations.ts';
import { api } from '../api.ts';
import { MarketRate } from '../types.ts';

interface CropRateDetailsProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
}

export const CropRateDetails: React.FC<CropRateDetailsProps> = ({ lang, setLang, onNavigate }) => {
  const t = translations[lang];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    api.getMarketRates().then(res => setRates(res.rates)).catch(() => {});
  }, []);

  const filteredRates = rates.filter(r =>
    r.crop_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.market_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.district.toLowerCase().includes(filterQuery.toLowerCase())
  );

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
            <div className="eyebrow">📈 {t.cropRate}</div>
            <h1>{lang === 'te' ? 'తాజా మార్కెట్ & మండి ధరలు' : 'Daily Mandi Rates & Market Trends'}</h1>
            <p className="muted">{t.cropRateSub}</p>
          </div>
        </div>

        {/* Filter Input */}
        <div className="dash-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <input
            type="text"
            placeholder={lang === 'te' ? '🔍 పంట లేదా మార్కెట్ పేరు వెతకండి (ఉదా: Rice, Warangal, Chilli)...' : '🔍 Search crop or market name (e.g. Rice, Cotton, Bowenpally)...'}
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--line)', background: '#fff' }}
          />
        </div>

        {/* Rates Table */}
        <div className="dash-card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Crop Name</th>
                <th>APMC Market</th>
                <th>District / State</th>
                <th>Rate (₹)</th>
                <th>Trend</th>
                <th>Reported Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.length > 0 ? (
                filteredRates.map(r => (
                  <tr key={r.id}>
                    <td>
                      <b>{r.crop_name}</b>
                    </td>
                    <td>{r.market_name}</td>
                    <td>{r.district}, {r.state}</td>
                    <td>
                      <b style={{ fontSize: '16px', color: '#134e2c' }}>
                        ₹{r.rate.toLocaleString('en-IN')}
                      </b>{' '}
                      <small className="muted">/ {r.unit}</small>
                    </td>
                    <td>
                      <span className={`pill ${r.trend === 'up' ? 'status-good' : r.trend === 'down' ? 'status-alert' : ''}`}>
                        {r.trend === 'up' ? '▲ Upward' : r.trend === 'down' ? '▼ Downward' : '● Stable'}
                      </span>
                    </td>
                    <td><small className="muted">{r.date}</small></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }} className="muted">
                    No mandi rates match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MSP Minimum Support Price Note */}
        <div className="dash-card" style={{ marginTop: '24px', background: 'linear-gradient(135deg,#fff8e7,#fffdf5)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '38px' }}>⚖️</div>
            <div>
              <h3 style={{ fontSize: '18px' }}>Minimum Support Price (MSP) Protection</h3>
              <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                MSP declared by Government of India guarantees a safety floor for major Kharif & Rabi produce.
                Verify procurement centres and slot bookings through official state portals.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
