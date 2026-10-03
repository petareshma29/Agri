import React, { useState, useEffect } from 'react';
import { translations } from '../translations.ts';
import { api } from '../api.ts';
import { WeatherData } from '../types.ts';

interface WeatherDetailsProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ lang, setLang, onNavigate }) => {
  const t = translations[lang];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    api.getWeather().then(res => setWeather(res.weather)).catch(() => {});
  }, []);

  const forecast = [
    { day: 'Today', temp: '29°C', condition: 'Partly Cloudy', rain: '10%', advice: 'Ideal for weeding & fertiliser application.' },
    { day: 'Tomorrow', temp: '31°C', condition: 'Sunny & Clear', rain: '5%', advice: 'Good window for foliar spraying.' },
    { day: 'Day 3', temp: '28°C', condition: 'Light Showers', rain: '65%', advice: 'Avoid spraying; hold back field irrigation.' },
    { day: 'Day 4', temp: '27°C', condition: 'Moderate Rain', rain: '80%', advice: 'Keep drainage open in paddy and cotton fields.' },
    { day: 'Day 5', temp: '30°C', condition: 'Clear Sky', rain: '15%', advice: 'Inspect crops for fungal symptoms after rain.' }
  ];

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
            <div className="eyebrow">🌦️ {t.weather}</div>
            <h1>{lang === 'te' ? 'వాతావరణ సూచన & వ్యవసాయ ప్రణాళిక' : 'Real-Time Weather & Advisory'}</h1>
            <p className="muted">{t.weatherSub}</p>
          </div>
        </div>

        {/* Current Live Weather Snapshot */}
        <div className="dash-card" style={{ background: 'linear-gradient(135deg,#e3f2fd,#f3f8fd)' }}>
          <div className="section-row">
            <div>
              <span className="pill">Live Agricultural Zone</span>
              <h2 style={{ fontSize: '32px', marginTop: '6px' }}>{weather?.location || 'Telangana Region'}</h2>
              <p className="muted">{weather?.condition || 'Partly cloudy with mild breeze'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#0b5394' }}>
                {weather?.temperature || 29}°C
              </div>
              <small className="muted">Recorded {weather?.recorded_at || 'Today'}</small>
            </div>
          </div>

          <div className="profile-grid" style={{ marginTop: '20px' }}>
            <div className="profile-item"><small>Relative Humidity</small><b>{weather?.humidity || 65}%</b></div>
            <div className="profile-item"><small>Rainfall Chance</small><b>{weather?.rainfall || '10%'}</b></div>
            <div className="profile-item"><small>Wind Speed</small><b>{weather?.wind_speed || '14 km/h'}</b></div>
            <div className="profile-item"><small>Farming Recommendation</small><b>Safe for field work & spraying</b></div>
          </div>
        </div>

        {/* 5-Day Agricultural Forecast */}
        <div className="dash-card" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>
            📅 {lang === 'te' ? '5 రోజుల వ్యవసాయ వాతావరణ ప్రణాళిక' : '5-Day Farming Forecast & Action Plan'}
          </h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            {forecast.map((f, idx) => (
              <div
                key={idx}
                className="alert"
                style={{ display: 'grid', gridTemplateColumns: '120px 100px 100px 1fr', alignItems: 'center', gap: '14px' }}
              >
                <div><b>{f.day}</b></div>
                <div style={{ color: '#0b5394', fontWeight: 800 }}>{f.temp}</div>
                <div><span className="pill">{f.rain} Rain</span></div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <b>{f.condition}:</b> {f.advice}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spray & Irrigation Advisory Rules */}
        <div className="cards" style={{ marginTop: '24px' }}>
          <div className="dash-card">
            <h3>🧪 {lang === 'te' ? 'పురుగుమందుల స్ప్రే సూచన' : 'Spray Advisory Rules'}</h3>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: 1.8, fontSize: '14px', color: '#444' }}>
              <li>Avoid spraying if wind speed exceeds 15 km/h to prevent spray drift.</li>
              <li>Do not apply foliar sprays if rain is forecast within 4 hours.</li>
              <li>Early morning or late afternoon (4 PM - 6 PM) is optimal for pesticide effectiveness.</li>
            </ul>
          </div>
          <div className="dash-card">
            <h3>💧 {lang === 'te' ? 'నీటిపారుదల సంరక్షణ' : 'Smart Irrigation Guidelines'}</h3>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: 1.8, fontSize: '14px', color: '#444' }}>
              <li>Skip scheduled irrigation before expected showers to save pump electricity.</li>
              <li>Paddy fields require 2-3 cm standing water during panicle initiation.</li>
              <li>Ensure good field surface drainage to protect chilli and tomato plants from wilt.</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
