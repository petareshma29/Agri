import { useState, useEffect } from 'react';
import { Home } from './components/Home.tsx';
import { FarmerLogin } from './components/FarmerLogin.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { FarmerDashboard } from './components/FarmerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SoilDetails } from './components/SoilDetails.tsx';
import { WeatherDetails } from './components/WeatherDetails.tsx';
import { CropRateDetails } from './components/CropRateDetails.tsx';
import { api, getStoredUser } from './api.ts';
import { Farmer, AdminUser } from './types.ts';

export default function App() {
  const [lang, setLangState] = useState<'en' | 'te'>(() => {
    return (localStorage.getItem('agriraksha_lang') as 'en' | 'te') || 'en';
  });

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['farmer-login', 'admin-login', 'farmer-dashboard', 'admin-dashboard', 'soil', 'weather', 'crop-rate', 'home'].includes(hash)) {
      return hash;
    }
    return 'home';
  });

  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(() => {
    const u = getStoredUser();
    return u && !u.role ? u : null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const u = getStoredUser();
    return u && u.role === 'admin' ? u : null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const setLang = (newLang: 'en' | 'te') => {
    setLangState(newLang);
    localStorage.setItem('agriraksha_lang', newLang);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route === 'home' ? '' : route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['farmer-login', 'admin-login', 'farmer-dashboard', 'admin-dashboard', 'soil', 'weather', 'crop-rate', 'home'].includes(hash)) {
        setCurrentRoute(hash);
      } else if (!hash) {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Validate session on start
  useEffect(() => {
    api.getMe().then(res => {
      if (res.authenticated) {
        if (res.role === 'admin' && res.admin) {
          setCurrentAdmin(res.admin);
        } else if (res.farmer) {
          setCurrentFarmer(res.farmer);
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen text-slate-900 bg-[#f5f8ef]">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast show" role="alert">
          {toastMessage}
        </div>
      )}

      {/* View Routing */}
      {currentRoute === 'home' && (
        <Home
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          onLoginSuccess={(farmer) => {
            setCurrentFarmer(farmer);
          }}
        />
      )}

      {currentRoute === 'farmer-login' && (
        <FarmerLogin
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          onLoginSuccess={(farmer) => {
            setCurrentFarmer(farmer);
          }}
        />
      )}

      {currentRoute === 'admin-login' && (
        <AdminLogin
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          onLoginSuccess={(admin) => {
            setCurrentAdmin(admin);
          }}
        />
      )}

      {currentRoute === 'farmer-dashboard' && currentFarmer && (
        <FarmerDashboard
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          farmer={currentFarmer}
        />
      )}

      {currentRoute === 'farmer-dashboard' && !currentFarmer && (
        <FarmerLogin
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          onLoginSuccess={(farmer) => {
            setCurrentFarmer(farmer);
          }}
        />
      )}

      {currentRoute === 'admin-dashboard' && currentAdmin && (
        <AdminDashboard
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          admin={currentAdmin}
        />
      )}

      {currentRoute === 'admin-dashboard' && !currentAdmin && (
        <AdminLogin
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
          showToast={showToast}
          onLoginSuccess={(admin) => {
            setCurrentAdmin(admin);
          }}
        />
      )}

      {currentRoute === 'soil' && (
        <SoilDetails
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
        />
      )}

      {currentRoute === 'weather' && (
        <WeatherDetails
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
        />
      )}

      {currentRoute === 'crop-rate' && (
        <CropRateDetails
          lang={lang}
          setLang={setLang}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}
