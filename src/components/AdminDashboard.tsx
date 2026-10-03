import React, { useState, useEffect } from 'react';
import { translations } from '../translations.ts';
import { api, clearStoredAuth } from '../api.ts';
import { AdminUser, Farmer, Crop, CropScan, Alert } from '../types.ts';

interface AdminDashboardProps {
  lang: 'en' | 'te';
  setLang: (l: 'en' | 'te') => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string) => void;
  admin: AdminUser;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  setLang,
  onNavigate,
  showToast,
  admin
}) => {
  const t = translations[lang];
  const [activeSection, setActiveSection] = useState('overview');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Data states
  const [kpi, setKpi] = useState({
    registeredFarmers: 0,
    totalCrops: 0,
    healthyCrops: 0,
    openAlerts: 0,
    totalScans: 0,
    farmersWithAlerts: 0,
    supportedLanguages: 2
  });
  const [farmers, setFarmers] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [scans, setScans] = useState<CropScan[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [cropDistribution, setCropDistribution] = useState<Record<string, number>>({});

  // View Farmer Modal
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);

  // Create Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertType, setNewAlertType] = useState('Weather');
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<'info' | 'warning' | 'urgent'>('warning');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [dashRes, farmersRes, cropsRes, scansRes, alertsRes, feedbackRes, reportsRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminFarmers(),
        api.getAdminCrops(),
        api.getAdminScans(),
        api.getAdminAlerts(),
        api.getAdminFeedback(),
        api.getAdminReports()
      ]);

      setKpi(dashRes.kpi);
      setFarmers(farmersRes.farmers);
      setCrops(cropsRes.crops);
      setScans(scansRes.scans);
      setAlerts(alertsRes.alerts);
      setFeedback(feedbackRes.feedback);
      setCropDistribution(reportsRes.cropDistribution || {});
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    showToast(lang === 'te' ? 'అడ్మిన్ లాగౌట్ పూర్తయింది' : 'Admin logged out');
    onNavigate('home');
  };

  const handleViewFarmer = async (id: string) => {
    try {
      const res = await api.getAdminFarmerDetails(id);
      setSelectedFarmer(res.farmer);
    } catch {
      showToast('Could not load farmer details');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertMessage) return;

    try {
      const res = await api.createAdminAlert({
        title: newAlertTitle,
        type: newAlertType,
        message: newAlertMessage,
        severity: newAlertSeverity,
        status: 'active'
      });
      setAlerts(prev => [res.alert, ...prev]);
      setShowAlertModal(false);
      setNewAlertTitle('');
      setNewAlertMessage('');
      showToast(lang === 'te' ? 'కొత్త హెచ్చరిక ప్రచురించబడింది!' : 'New alert broadcasted to farmers!');
    } catch {
      showToast('Failed to create alert');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await api.deleteAdminAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      showToast('Alert removed');
    } catch {
      showToast('Failed to delete alert');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Top Portal Nav */}
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

      {/* Main Admin Wrap */}
      <main className="portal-wrap">
        <div className="dashboard">
          {/* Side Menu */}
          <aside className="side">
            <h3>🛡️ <span>Admin Dashboard</span></h3>
            <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>
              🏠 <span>Overview</span>
            </button>
            <button className={activeSection === 'farmers' ? 'active' : ''} onClick={() => setActiveSection('farmers')}>
              👥 <span>Farmer Management</span>
            </button>
            <button className={activeSection === 'crops' ? 'active' : ''} onClick={() => setActiveSection('crops')}>
              🌾 <span>Crop Monitoring</span>
            </button>
            <button className={activeSection === 'disease' ? 'active' : ''} onClick={() => setActiveSection('disease')}>
              🦠 <span>Disease Scans</span>
            </button>
            <button className={activeSection === 'weather' ? 'active' : ''} onClick={() => setActiveSection('weather')}>
              🌦️ <span>Weather & Alerts</span>
            </button>
            <button className={activeSection === 'reports' ? 'active' : ''} onClick={() => setActiveSection('reports')}>
              📊 <span>Reports & Analytics</span>
            </button>
            <button className={activeSection === 'schemes' ? 'active' : ''} onClick={() => setActiveSection('schemes')}>
              🏦 <span>Schemes & Content</span>
            </button>
            <button className={activeSection === 'settings' ? 'active' : ''} onClick={() => setActiveSection('settings')}>
              ⚙️ <span>System Settings</span>
            </button>
          </aside>

          {/* Admin Content Sections */}
          <section style={{ minWidth: 0 }}>
            {/* 1. OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Administrator Dashboard</div>
                    <h1>AgriRaksha Control Center</h1>
                    <p className="muted">{admin.name} • Manage farmer activity and portal data.</p>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat">
                    <div className="num">{kpi.registeredFarmers}</div>
                    <small>Registered Farmers</small>
                  </div>
                  <div className="stat">
                    <div className="num">{kpi.totalCrops}</div>
                    <small>Total Crops</small>
                  </div>
                  <div className="stat">
                    <div className="num">{kpi.healthyCrops}</div>
                    <small>Healthy Crops</small>
                  </div>
                  <div className="stat">
                    <div className="num">{kpi.openAlerts}</div>
                    <small>Open Alerts</small>
                  </div>
                </div>

                <div className="admin-kpi">
                  <div className="feature-card">
                    <b>AI Scans Logged</b>
                    <div className="num" style={{ fontSize: '28px', color: 'var(--green)', marginTop: '7px' }}>
                      {kpi.totalScans}
                    </div>
                  </div>
                  <div className="feature-card">
                    <b>Farmers with Alerts</b>
                    <div className="num" style={{ fontSize: '28px', color: 'var(--green)', marginTop: '7px' }}>
                      {kpi.farmersWithAlerts}
                    </div>
                  </div>
                  <div className="feature-card">
                    <b>Supported Languages</b>
                    <div className="num" style={{ fontSize: '28px', color: 'var(--green)', marginTop: '7px' }}>
                      {kpi.supportedLanguages} (EN/TE)
                    </div>
                  </div>
                </div>

                <div className="cards" style={{ marginTop: '16px' }}>
                  <article className="dash-card">
                    <h2>Recent Farmer Activity</h2>
                    {farmers.slice(0, 5).map((f: any) => (
                      <div key={f.id} className="alert">
                        <span>👤</span>
                        <div>
                          <b>{f.name}</b>
                          <div style={{ color: '#555' }}>
                            {f.cropCount || 0} crops • {f.district} • {f.land_area}
                          </div>
                        </div>
                      </div>
                    ))}
                  </article>

                  <article className="dash-card">
                    <h2>Priority Alerts</h2>
                    {alerts.slice(0, 5).map(a => (
                      <div key={a.id} className="alert">
                        <span>{a.icon || '⚠️'}</span>
                        <div>
                          <b>{a.type}: {a.title}</b>
                          <div style={{ color: '#555' }}>{a.message}</div>
                        </div>
                      </div>
                    ))}
                  </article>
                </div>
              </div>
            )}

            {/* 2. FARMER MANAGEMENT */}
            {activeSection === 'farmers' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Records</div>
                    <h1>Farmer Management</h1>
                    <p className="muted">Review farmer accounts, land, crops and contact details.</p>
                  </div>
                </div>
                <div className="dash-card table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Farmer</th>
                        <th>Phone</th>
                        <th>District</th>
                        <th>Land</th>
                        <th>Crops</th>
                        <th>Alerts</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmers.map(f => (
                        <tr key={f.id}>
                          <td><b>{f.id}</b></td>
                          <td>
                            <b>{f.name}</b><br />
                            <small className="muted">{f.email || 'No email'}</small>
                          </td>
                          <td>{f.phone}</td>
                          <td>{f.district}</td>
                          <td>{f.land_area}</td>
                          <td>{f.cropCount || 0}</td>
                          <td>{f.alertCount || 0}</td>
                          <td>
                            <button className="action-btn" onClick={() => handleViewFarmer(f.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. CROP MONITORING */}
            {activeSection === 'crops' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Monitoring</div>
                    <h1>Crop Monitoring</h1>
                    <p className="muted">Field-level crops, growth stages, and status indicators.</p>
                  </div>
                </div>
                <div className="dash-card table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Crop</th>
                        <th>Area</th>
                        <th>Stage</th>
                        <th>Health</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crops.map((c: any) => (
                        <tr key={c.id}>
                          <td><b>{c.farmer_name || 'Farmer'}</b></td>
                          <td>{c.icon || '🌱'} {c.crop_name}</td>
                          <td>{c.area}</td>
                          <td>{c.stage}</td>
                          <td>
                            <span style={{ color: c.health.toLowerCase().includes('healthy') ? '#1e7e34' : '#d39e00', fontWeight: 800 }}>
                              {c.health}
                            </span>
                          </td>
                          <td><span className="pill">{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. DISEASE SCANS */}
            {activeSection === 'disease' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">AI Monitoring</div>
                    <h1>Disease Scan Center</h1>
                    <p className="muted">Review recent crop-detection activity and common issues.</p>
                  </div>
                </div>
                <div className="cards">
                  <article className="dash-card">
                    <h2>Recent Scans ({scans.length})</h2>
                    <div className="scan-history">
                      {scans.map(s => (
                        <div key={s.id} className="history-row">
                          <div>
                            📷 <b>{s.detected_crop}</b> — <span style={{ color: '#0f6b3b' }}>{s.detected_condition}</span>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              Farmer: {s.farmer_name || s.farmer_id} • Confidence: {s.confidence}%
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#777' }}>
                            {new Date(s.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="dash-card">
                    <h2>Common Issues Advisory</h2>
                    <div className="alert">
                      🦠 <div>
                        <b>Leaf spots / blight</b><br />
                        <span>Encourage early photo-based inspection and local agricultural officer confirmation.</span>
                      </div>
                    </div>
                    <div className="alert">
                      🐛 <div>
                        <b>Pest damage / Borer warning</b><br />
                        <span>Use integrated pest management and crop-specific registered products complying with CIBRC.</span>
                      </div>
                    </div>
                    <div className="alert">
                      💧 <div>
                        <b>Root rot / waterlogging</b><br />
                        <span>Ensure proper drainage channels are opened before seasonal rains.</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 5. WEATHER & ALERTS */}
            {activeSection === 'weather' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Operations</div>
                    <h1>Weather & Alerts</h1>
                  </div>
                  <button className="primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setShowAlertModal(true)}>
                    + Create Alert
                  </button>
                </div>
                <div className="cards">
                  <article className="dash-card">
                    <h2>🌦️ <span>Regional Weather Snapshot</span></h2>
                    <div className="stat">
                      <div className="num">29°C</div>
                      <small>Telangana Central Agricultural Zone • 65% humidity</small>
                    </div>
                    <p className="muted" style={{ marginTop: '12px' }}>
                      Operational weather monitoring data. Farmers are advised to avoid foliar sprays before anticipated rainfall.
                    </p>
                  </article>

                  <article className="dash-card">
                    <h2>Broadcast Alerts ({alerts.length})</h2>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {alerts.map(a => (
                        <div key={a.id} className="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '20px' }}>{a.icon || '📢'}</span>
                            <div>
                              <b>{a.type}: {a.title}</b>
                              <div style={{ color: '#444' }}>{a.message}</div>
                            </div>
                          </div>
                          <button className="action-btn" onClick={() => handleDeleteAlert(a.id)}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 6. REPORTS & ANALYTICS */}
            {activeSection === 'reports' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Analytics</div>
                    <h1>Reports & Analytics</h1>
                  </div>
                </div>
                <div className="cards">
                  <article className="dash-card">
                    <h2>Crop Distribution (Database Realtime)</h2>
                    <div className="mini-chart">
                      {Object.entries(cropDistribution).map(([name, count]) => (
                        <div
                          key={name}
                          className="bar"
                          style={{ height: `${Math.max(45, count * 35)}px` }}
                        >
                          <span>{name}<br />{count}</span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="dash-card">
                    <h2>Farm Health Summary</h2>
                    <div className="alert">
                      ✅ <div>
                        <b>{kpi.healthyCrops} Healthy Crops</b><br />
                        <span>Verified records in database</span>
                      </div>
                    </div>
                    <div className="alert">
                      ⚠️ <div>
                        <b>{kpi.openAlerts} Active Alerts</b><br />
                        <span>Farmer notices and seasonal warnings</span>
                      </div>
                    </div>
                    <div className="alert">
                      📷 <div>
                        <b>{kpi.totalScans} AI Diagnostic Scans</b><br />
                        <span>Assisted with Gemini Vision AI</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            )}

            {/* 7. SCHEMES & CONTENT */}
            {activeSection === 'schemes' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Content</div>
                    <h1>Schemes & Farmer Information</h1>
                  </div>
                </div>
                <div className="feature-grid-dash">
                  <article className="feature-card">
                    🏦<h3>PM-KISAN</h3>
                    <p className="muted">Manage e-KYC guidelines, instalment announcements, and official verification portal links.</p>
                  </article>
                  <article className="feature-card">
                    🛡️<h3>Crop Insurance (PMFBY)</h3>
                    <p className="muted">Publish seasonal enrolment deadlines, claim procedures, and crop loss assessment notices.</p>
                  </article>
                  <article className="feature-card">
                    📢<h3>Farmer Notices</h3>
                    <p className="muted">Broadcast multilingual seasonal advisories directly to all registered farmers.</p>
                  </article>
                </div>
              </div>
            )}

            {/* 8. SYSTEM SETTINGS */}
            {activeSection === 'settings' && (
              <div className="dash-section">
                <div className="content-head">
                  <div>
                    <div className="eyebrow">Administration</div>
                    <h1>System Settings</h1>
                  </div>
                </div>
                <div className="dash-card">
                  <div className="profile-grid">
                    <div className="profile-item"><small>Portal</small><b>AgriRaksha 2.5</b></div>
                    <div className="profile-item"><small>Languages</small><b>English / తెలుగు</b></div>
                    <div className="profile-item"><small>Farmer Login Methods</small><b>Phone + OTP / Email Direct</b></div>
                    <div className="profile-item"><small>AI Engine</small><b>Google Gemini 2.5 Flash Vision & Chat</b></div>
                    <div className="profile-item"><small>Database Engine</small><b>Firebase Firestore (Enterprise DB: ai-studio-agriraksha-fa291813-dcaa-4e22-b500-08bb3871f343)</b></div>
                    <div className="profile-item"><small>Current Administrator</small><b>{admin.name} ({admin.email})</b></div>
                  </div>
                  <div className="demo-note" style={{ marginTop: '16px' }}>
                    AgriRaksha is operating in full-stack production architecture with secure server-side role validation, password hashing, and real Gemini multimodal intelligence.
                  </div>
                </div>

                <div className="dash-card" style={{ marginTop: '20px', borderLeft: '4px solid #16a34a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🔥 Firebase Firestore Cloud Database
                        <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'normal' }}>
                          Active & Synchronized
                        </span>
                      </h2>
                      <p className="muted" style={{ marginTop: '4px', fontSize: '13px' }}>
                        All agricultural records, crops, AI scans, alerts, and feedback are stored persistently in Google Cloud Firestore.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn-accent"
                        style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={async () => {
                          try {
                            showToast('Syncing all records to Firebase...');
                            const res = await api.syncToFirebase();
                            showToast(`✅ Synced ${res.result.synced} items to Firebase successfully!`);
                          } catch (err: any) {
                            showToast('Sync failed: ' + err.message);
                          }
                        }}
                      >
                        🔄 Sync All to Firebase Now
                      </button>
                      <a
                        href="https://console.firebase.google.com/project/coherent-genre-kcb1c/firestore/databases/ai-studio-agriraksha-fa291813-dcaa-4e22-b500-08bb3871f343/data"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        ↗ Open Firebase Console
                      </a>
                    </div>
                  </div>

                  <div className="profile-grid" style={{ marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                    <div className="profile-item"><small>Database ID</small><b style={{ fontFamily: 'monospace', fontSize: '12px' }}>ai-studio-agriraksha-fa291813-dcaa-4e22-b500-08bb3871f343</b></div>
                    <div className="profile-item"><small>Firebase Project ID</small><b style={{ fontFamily: 'monospace', fontSize: '12px' }}>coherent-genre-kcb1c</b></div>
                    <div className="profile-item"><small>Farmers Stored</small><b>{farmers.length} profiles</b></div>
                    <div className="profile-item"><small>Crops Stored</small><b>{crops.length} crops</b></div>
                    <div className="profile-item"><small>AI Scans Stored</small><b>{scans.length} scans</b></div>
                    <div className="profile-item"><small>Feedback & Alerts</small><b>{feedback.length} feedback / {alerts.length} alerts</b></div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Professional Detail Modal for "View Farmer" (Replacing alert popups) */}
      {selectedFarmer && (
        <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) setSelectedFarmer(null); }}>
          <div className="modal-box">
            <button className="close" onClick={() => setSelectedFarmer(null)}>×</button>
            <h2>👨‍🌾 Farmer Details: {selectedFarmer.name}</h2>
            <p className="muted">Authorized administrator view with masked sensitive identifiers.</p>

            <div className="profile-grid" style={{ marginTop: '14px' }}>
              <div className="profile-item"><small>Farmer ID</small><b>{selectedFarmer.id}</b></div>
              <div className="profile-item"><small>Name</small><b>{selectedFarmer.name}</b></div>
              <div className="profile-item"><small>Phone Number</small><b>{selectedFarmer.phone}</b></div>
              <div className="profile-item"><small>Aadhaar (Protected)</small><b>{selectedFarmer.maskedAadhaar}</b></div>
              <div className="profile-item"><small>Email</small><b>{selectedFarmer.email || 'N/A'}</b></div>
              <div className="profile-item"><small>Village</small><b>{selectedFarmer.village}</b></div>
              <div className="profile-item"><small>District & State</small><b>{selectedFarmer.district}, {selectedFarmer.state}</b></div>
              <div className="profile-item"><small>Land Area</small><b>{selectedFarmer.land_area}</b></div>
              <div className="profile-item"><small>Soil Type</small><b>{selectedFarmer.soil_type}</b></div>
              <div className="profile-item"><small>Irrigation Type</small><b>{selectedFarmer.irrigation_type}</b></div>
            </div>

            <h3 style={{ marginTop: '18px', fontSize: '17px' }}>🌾 Registered Crops ({selectedFarmer.crops?.length || 0})</h3>
            <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
              {selectedFarmer.crops?.map((c: any) => (
                <div key={c.id} className="alert">
                  <span>{c.icon || '🌱'}</span>
                  <div>
                    <b>{c.crop_name}</b> ({c.area}) — {c.stage}
                    <div style={{ fontSize: '12px', color: '#555' }}>Health: {c.health} • Season: {c.season}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="primary"
              style={{ marginTop: '18px' }}
              onClick={() => setSelectedFarmer(null)}
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) setShowAlertModal(false); }}>
          <div className="modal-box">
            <button className="close" onClick={() => setShowAlertModal(false)}>×</button>
            <h2>Create New Alert</h2>
            <p>Broadcast an advisory or notification to farmers.</p>
            <form onSubmit={handleCreateAlert} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Alert Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Heavy Rain Advisory"
                  value={newAlertTitle}
                  onChange={e => setNewAlertTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Category</label>
                <select
                  value={newAlertType}
                  onChange={e => setNewAlertType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                >
                  <option value="Weather">Weather Alert 🌦️</option>
                  <option value="Crop">Crop Health 🔎</option>
                  <option value="Irrigation">Irrigation 💧</option>
                  <option value="Scheme">Scheme Notice 🏦</option>
                  <option value="General">General Announcement 📢</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Severity</label>
                <select
                  value={newAlertSeverity}
                  onChange={e => setNewAlertSeverity(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                >
                  <option value="info">Info / Notice</option>
                  <option value="warning">Warning / Action Recommended</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800 }}>Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write clear instructions for farmers..."
                  value={newAlertMessage}
                  onChange={e => setNewAlertMessage(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--line)' }}
                />
              </div>
              <button className="primary" type="submit" style={{ marginTop: '10px' }}>
                Publish Alert
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">AgriRaksha — Smart Agriculture Development System</footer>
    </div>
  );
};
