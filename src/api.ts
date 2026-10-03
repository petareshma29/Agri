import { Farmer, Crop, CropScan, Alert, Feedback, MarketRate, WeatherData, AdminUser } from './types.ts';

const TOKEN_KEY = 'agriraksha_token';
const USER_KEY = 'agriraksha_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('agrirakshaFarmer');
  localStorage.removeItem('agrirakshaAdmin');
}

export function getStoredUser(): any {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Server request failed');
  }

  return data;
}

export const api = {
  // Auth
  farmerLogin: (method: 'phone' | 'email' | 'aadhaar', identifier: string) =>
    request<{ success: boolean; message: string; devMode?: boolean; devOtp?: string; token?: string; farmer?: Farmer }>('/api/auth/farmer/login', {
      method: 'POST',
      body: JSON.stringify({ method, identifier })
    }),

  verifyFarmerOtp: (identifier: string, otp: string) =>
    request<{ success: boolean; token: string; farmer: Farmer }>('/api/auth/farmer/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp })
    }),

  adminLogin: (email: string, password: string) =>
    request<{ success: boolean; token: string; admin: AdminUser }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request<{ authenticated: boolean; role?: 'admin' | 'farmer'; farmer?: Farmer; admin?: AdminUser }>('/api/auth/me'),

  logout: () => {
    clearStoredAuth();
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  // Farmer
  getProfile: () => request<{ success: boolean; farmer: Farmer }>('/api/farmer/profile'),
  updateProfile: (updates: Partial<Farmer>) => request<{ success: boolean; farmer: Farmer }>('/api/farmer/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),

  getCrops: () => request<{ success: boolean; crops: Crop[] }>('/api/farmer/crops'),
  addCrop: (crop: Partial<Crop>) => request<{ success: boolean; crop: Crop }>('/api/farmer/crops', {
    method: 'POST',
    body: JSON.stringify(crop)
  }),
  updateCrop: (id: string, crop: Partial<Crop>) => request<{ success: boolean; crop: Crop }>(`/api/farmer/crops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(crop)
  }),
  deleteCrop: (id: string) => request<{ success: boolean }>(`/api/farmer/crops/${id}`, {
    method: 'DELETE'
  }),

  getAlerts: () => request<{ success: boolean; alerts: Alert[] }>('/api/farmer/alerts'),
  markAlertRead: (id: string) => request<{ success: boolean; alert: Alert }>(`/api/farmer/alerts/${id}/read`, {
    method: 'POST'
  }),

  getScans: () => request<{ success: boolean; scans: CropScan[] }>('/api/farmer/scans'),

  submitFeedback: (rating: number, topic: string, message: string) =>
    request<{ success: boolean; feedback: Feedback }>('/api/farmer/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, topic, message })
    }),

  // AI
  analyzeCropImage: (image: string, cropName: string, notes?: string) =>
    request<{ success: boolean; scan: CropScan; result: any }>('/api/ai/crop-analysis', {
      method: 'POST',
      body: JSON.stringify({ image, cropName, notes })
    }),

  askAiChat: (message: string, lang: 'en' | 'te') =>
    request<{ success: boolean; reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, lang })
    }),

  // Public / Shared
  getWeather: () => request<{ success: boolean; weather: WeatherData }>('/api/weather'),
  getMarketRates: () => request<{ success: boolean; rates: MarketRate[]; timestamp: string; source: string }>('/api/market-rates'),
  sendContactMessage: (name: string, email: string, topic: string, message: string) =>
    request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, topic, message })
    }),

  // Admin
  getAdminDashboard: () => request<{
    success: boolean;
    kpi: {
      registeredFarmers: number;
      totalCrops: number;
      healthyCrops: number;
      openAlerts: number;
      totalScans: number;
      farmersWithAlerts: number;
      supportedLanguages: number;
    };
    recentFarmers: Farmer[];
    recentScans: CropScan[];
    recentAlerts: Alert[];
    recentFeedback: Feedback[];
  }>('/api/admin/dashboard'),

  getAdminFarmers: () => request<{ success: boolean; farmers: (Farmer & { cropCount: number; alertCount: number; crops: Crop[] })[] }>('/api/admin/farmers'),
  getAdminFarmerDetails: (id: string) => request<{ success: boolean; farmer: Farmer & { maskedAadhaar: string; crops: Crop[]; alerts: Alert[]; scans: CropScan[] } }>(`/api/admin/farmers/${id}`),

  getAdminCrops: () => request<{ success: boolean; crops: (Crop & { farmer_name: string })[] }>('/api/admin/crops'),
  getAdminScans: () => request<{ success: boolean; scans: CropScan[] }>('/api/admin/scans'),
  getAdminAlerts: () => request<{ success: boolean; alerts: Alert[] }>('/api/admin/alerts'),
  createAdminAlert: (alert: Partial<Alert>) => request<{ success: boolean; alert: Alert }>('/api/admin/alerts', {
    method: 'POST',
    body: JSON.stringify(alert)
  }),
  deleteAdminAlert: (id: string) => request<{ success: boolean }>(`/api/admin/alerts/${id}`, {
    method: 'DELETE'
  }),
  getAdminFeedback: () => request<{ success: boolean; feedback: Feedback[] }>('/api/admin/feedback'),
  getAdminReports: () => request<{
    success: boolean;
    cropDistribution: Record<string, number>;
    summary: {
      totalFarmers: number;
      totalCrops: number;
      healthyCrops: number;
      totalScans: number;
      openAlerts: number;
    };
  }>('/api/admin/reports'),
  getAdminSettings: () => request<{ success: boolean; system: any }>('/api/admin/settings'),
  getFirebaseStatus: () => request<{
    success: boolean;
    connected: boolean;
    databaseId: string;
    projectId: string;
    counts: Record<string, number>;
  }>('/api/firebase/status'),
  syncToFirebase: () => request<{
    success: boolean;
    message: string;
    result: { synced: number; errors: number };
  }>('/api/firebase/sync', { method: 'POST' })
};

