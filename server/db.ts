import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { syncToFirestore, deleteFromFirestore, syncAllDatabaseToFirestore } from './firebaseSync.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  role: 'admin' | 'farmer';
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  user_id: string;
  farmer_id: string;
  name: string;
  phone: string;
  aadhaar_number: string;
  email: string;
  village: string;
  district: string;
  state: string;
  land_area: string;
  soil_type: string;
  irrigation_type: string;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface Crop {
  id: string;
  farmer_id: string;
  crop_name: string;
  area: string;
  stage: string;
  health: string;
  season: string;
  status: string;
  icon?: string;
  planting_date: string;
  created_at: string;
  updated_at: string;
}

export interface CropScan {
  id: string;
  farmer_id: string;
  crop_id?: string;
  farmer_name?: string;
  image_url?: string;
  detected_crop: string;
  detected_condition: string;
  confidence: number;
  symptoms: string[];
  possible_causes?: string[];
  recommendations: string[];
  preventive_steps?: string[];
  uncertainty_note?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  farmer_id?: string; // null or undefined means system-wide/all farmers
  title: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  status: 'active' | 'read' | 'resolved';
  icon?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  farmer_id: string;
  farmer_name: string;
  topic: string;
  rating: number;
  message: string;
  created_at: string;
}

export interface MarketRate {
  id: string;
  crop_name: string;
  market_name: string;
  district: string;
  state: string;
  rate: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  date: string;
  source: string;
}

export interface WeatherRecord {
  id: string;
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: string;
  wind_speed: string;
  forecast_data: string;
  recorded_at: string;
}

export interface ChatbotConversation {
  id: string;
  farmer_id: string;
  user_message: string;
  ai_response: string;
  created_at: string;
}

export interface OtpRecord {
  identifier: string;
  otp_hash: string;
  expires_at: number;
  attempts: number;
}

export interface DatabaseSchema {
  users: User[];
  farmers: Farmer[];
  crops: Crop[];
  crop_scans: CropScan[];
  alerts: Alert[];
  feedback: Feedback[];
  market_rates: MarketRate[];
  weather_records: WeatherRecord[];
  chatbot_conversations: ChatbotConversation[];
  otps: OtpRecord[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'database.json');

function getInitialData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const managerPasswordHash = bcrypt.hashSync('Manager@123', 10);

  return {
    users: [
      {
        id: 'U001',
        name: 'AgriRaksha Administrator',
        email: 'admin@agriraksha.demo',
        phone: '9999900000',
        password_hash: adminPasswordHash,
        role: 'admin',
        status: 'active',
        created_at: '2026-01-10T10:00:00.000Z',
        updated_at: '2026-01-10T10:00:00.000Z'
      },
      {
        id: 'U002',
        name: 'Farm Operations Manager',
        email: 'manager@agriraksha.demo',
        phone: '9999900001',
        password_hash: managerPasswordHash,
        role: 'admin',
        status: 'active',
        created_at: '2026-01-15T10:00:00.000Z',
        updated_at: '2026-01-15T10:00:00.000Z'
      },
      {
        id: 'U003',
        name: 'Lakshmi',
        email: 'ramesh@agriraksha.demo',
        phone: '9876543210',
        role: 'farmer',
        status: 'active',
        created_at: '2026-06-12T08:30:00.000Z',
        updated_at: '2026-06-12T08:30:00.000Z'
      },
      {
        id: 'U004',
        name: 'Sita Devi',
        email: 'sita@agriraksha.demo',
        phone: '9123456780',
        role: 'farmer',
        status: 'active',
        created_at: '2026-05-20T09:15:00.000Z',
        updated_at: '2026-05-20T09:15:00.000Z'
      }
    ],
    farmers: [
      {
        id: 'F001',
        user_id: 'U003',
        farmer_id: 'F001',
        name: 'Lakshmi',
        phone: '9876543210',
        aadhaar_number: '123456789012',
        email: 'ramesh@agriraksha.demo',
        village: 'Lakshmi Nagar',
        district: 'Hyderabad',
        state: 'Telangana',
        land_area: '4.5 acres',
        soil_type: 'Loamy Soil',
        irrigation_type: 'Drip Irrigation',
        joined_date: '12 June 2026',
        created_at: '2026-06-12T08:30:00.000Z',
        updated_at: '2026-06-12T08:30:00.000Z'
      },
      {
        id: 'F002',
        user_id: 'U004',
        farmer_id: 'F002',
        name: 'Sita Devi',
        phone: '9123456780',
        aadhaar_number: '234567890123',
        email: 'sita@agriraksha.demo',
        village: 'Green Valley',
        district: 'Warangal',
        state: 'Telangana',
        land_area: '3 acres',
        soil_type: 'Red Loamy Soil',
        irrigation_type: 'Sprinkler',
        joined_date: '20 May 2026',
        created_at: '2026-05-20T09:15:00.000Z',
        updated_at: '2026-05-20T09:15:00.000Z'
      }
    ],
    crops: [
      {
        id: 'C001',
        farmer_id: 'F001',
        crop_name: 'Rice',
        area: '2 acres',
        stage: 'Flowering',
        health: 'Healthy',
        season: 'Kharif',
        status: 'Good',
        icon: '🌾',
        planting_date: '2026-06-15',
        created_at: '2026-06-15T08:00:00.000Z',
        updated_at: '2026-09-20T10:00:00.000Z'
      },
      {
        id: 'C002',
        farmer_id: 'F001',
        crop_name: 'Cotton',
        area: '1.5 acres',
        stage: 'Vegetative',
        health: 'Healthy',
        season: 'Kharif',
        status: 'Good',
        icon: '🌿',
        planting_date: '2026-06-25',
        created_at: '2026-06-25T08:00:00.000Z',
        updated_at: '2026-09-18T14:30:00.000Z'
      },
      {
        id: 'C003',
        farmer_id: 'F001',
        crop_name: 'Tomato',
        area: '1 acre',
        stage: 'Fruit Development',
        health: 'Needs Monitoring',
        season: 'Rabi',
        status: 'Monitor',
        icon: '🍅',
        planting_date: '2026-07-10',
        created_at: '2026-07-10T08:00:00.000Z',
        updated_at: '2026-09-22T16:45:00.000Z'
      },
      {
        id: 'C004',
        farmer_id: 'F002',
        crop_name: 'Maize',
        area: '1.5 acres',
        stage: 'Vegetative',
        health: 'Healthy',
        season: 'Kharif',
        status: 'Good',
        icon: '🌽',
        planting_date: '2026-06-18',
        created_at: '2026-06-18T08:00:00.000Z',
        updated_at: '2026-09-21T09:00:00.000Z'
      },
      {
        id: 'C005',
        farmer_id: 'F002',
        crop_name: 'Chilli',
        area: '1.5 acres',
        stage: 'Flowering',
        health: 'Healthy',
        season: 'Rabi',
        status: 'Good',
        icon: '🌶️',
        planting_date: '2026-07-05',
        created_at: '2026-07-05T08:00:00.000Z',
        updated_at: '2026-09-23T11:20:00.000Z'
      }
    ],
    crop_scans: [
      {
        id: 'S001',
        farmer_id: 'F001',
        farmer_name: 'Lakshmi',
        crop_id: 'C001',
        detected_crop: 'Rice',
        detected_condition: 'Rice Blast (Magnaporthe oryzae)',
        confidence: 89,
        symptoms: ['Spindle-shaped brown lesions on leaves', 'Ash-grey centers with dark brown borders'],
        possible_causes: ['Prolonged leaf wetness', 'Excess nitrogen application'],
        recommendations: [
          'Use only a crop-registered fungicide recommended by your local agriculture authority (e.g., tricyclazole).',
          'Follow the product label and protective-equipment instructions.'
        ],
        preventive_steps: [
          'Maintain balanced nitrogen fertilization.',
          'Improve field drainage and sanitation.'
        ],
        uncertainty_note: 'AI assistance result. Consult local Krishi Vigyan Kendra (KVK) or agriculture department.',
        created_at: '2026-09-21T14:32:00.000Z'
      },
      {
        id: 'S002',
        farmer_id: 'F001',
        farmer_name: 'Lakshmi',
        crop_id: 'C003',
        detected_crop: 'Tomato',
        detected_condition: 'Early Blight (Alternaria solani)',
        confidence: 91,
        symptoms: ['Concentric dark rings (target board pattern)', 'Yellowing around older lower leaves'],
        possible_causes: ['High humidity', 'Warm temperatures with frequent rainfall splashing'],
        recommendations: [
          'Apply an approved copper-based or chlorothalonil fungicide registered for tomatoes.',
          'Confirm registration and application safety precautions.'
        ],
        preventive_steps: [
          'Remove infected lower leaves to improve air circulation.',
          'Use straw or plastic mulch to prevent soil splashing onto foliage.'
        ],
        uncertainty_note: 'AI assistance estimate. Follow pesticide label directions.',
        created_at: '2026-09-23T10:15:00.000Z'
      }
    ],
    alerts: [
      {
        id: 'A001',
        farmer_id: 'F001',
        title: 'Weather & Drainage Notice',
        type: 'Weather',
        message: 'Rain is expected. Check drainage around the rice field.',
        severity: 'warning',
        status: 'active',
        icon: '🌦️',
        created_at: '2026-09-23T06:00:00.000Z'
      },
      {
        id: 'A002',
        farmer_id: 'F001',
        title: 'Crop Scouting Reminder',
        type: 'Crop',
        message: 'Tomato field should be inspected for leaf spots.',
        severity: 'warning',
        status: 'active',
        icon: '🔎',
        created_at: '2026-09-22T08:00:00.000Z'
      },
      {
        id: 'A003',
        farmer_id: 'F001',
        title: 'Irrigation Schedule',
        type: 'Irrigation',
        message: 'Cotton irrigation is due tomorrow morning.',
        severity: 'info',
        status: 'active',
        icon: '💧',
        created_at: '2026-09-23T12:00:00.000Z'
      },
      {
        id: 'A004',
        farmer_id: 'F002',
        title: 'Nutrient Application',
        type: 'Task',
        message: 'Apply the planned nutrient schedule after checking soil moisture.',
        severity: 'info',
        status: 'active',
        icon: '📋',
        created_at: '2026-09-23T07:30:00.000Z'
      },
      {
        id: 'A005',
        title: 'PM-KISAN Seasonal Verification',
        type: 'Scheme',
        message: 'Official e-KYC update deadline reminder for registered farmers.',
        severity: 'info',
        status: 'active',
        icon: '🏦',
        created_at: '2026-09-20T10:00:00.000Z'
      }
    ],
    feedback: [
      {
        id: 'FB001',
        farmer_id: 'F001',
        farmer_name: 'Lakshmi',
        topic: 'crop',
        rating: 5,
        message: 'The AI crop scanner provided clear suggestions and helped identify leaf spots quickly.',
        created_at: '2026-09-22T16:00:00.000Z'
      },
      {
        id: 'FB002',
        farmer_id: 'F002',
        farmer_name: 'Sita Devi',
        topic: 'language',
        rating: 5,
        message: 'Telugu language support is very clear and easy to navigate on mobile phone.',
        created_at: '2026-09-23T11:45:00.000Z'
      }
    ],
    market_rates: [
      {
        id: 'M001',
        crop_name: 'Tomato',
        market_name: 'Bowenpally Agricultural Market',
        district: 'Hyderabad',
        state: 'Telangana',
        rate: 3500,
        unit: 'quintal',
        trend: 'up',
        date: '2026-09-23',
        source: 'Telangana Agricultural Marketing Dept (Indicative Mandi Watch)'
      },
      {
        id: 'M002',
        crop_name: 'Rice (Paddy Common)',
        market_name: 'Warangal Grain Market',
        district: 'Warangal',
        state: 'Telangana',
        rate: 2350,
        unit: 'quintal',
        trend: 'stable',
        date: '2026-09-23',
        source: 'MSP / Regional Mandi Bulletin'
      },
      {
        id: 'M003',
        crop_name: 'Onion',
        market_name: 'Mahbubnagar Market Yard',
        district: 'Mahbubnagar',
        state: 'Telangana',
        rate: 1500,
        unit: 'quintal',
        trend: 'down',
        date: '2026-09-23',
        source: 'Daily Vegetable Market Arrival Reports'
      },
      {
        id: 'M004',
        crop_name: 'Maize',
        market_name: 'Nizamabad Agricultural Market',
        district: 'Nizamabad',
        state: 'Telangana',
        rate: 2050,
        unit: 'quintal',
        trend: 'stable',
        date: '2026-09-23',
        source: 'Grain Mandi Indices'
      },
      {
        id: 'M005',
        crop_name: 'Chilli (Dry Red)',
        market_name: 'Khammam APMC Market',
        district: 'Khammam',
        state: 'Telangana',
        rate: 12500,
        unit: 'quintal',
        trend: 'up',
        date: '2026-09-23',
        source: 'Spices Board & APMC Khammam'
      },
      {
        id: 'M006',
        crop_name: 'Cotton',
        market_name: 'Adilabad Cotton Yard',
        district: 'Adilabad',
        state: 'Telangana',
        rate: 7200,
        unit: 'quintal',
        trend: 'stable',
        date: '2026-09-23',
        source: 'Cotton Corporation of India Indicative Yard Rates'
      }
    ],
    weather_records: [
      {
        id: 'W001',
        location: 'Telangana Agricultural Zone (Hyderabad & Warangal)',
        temperature: 29,
        condition: 'Partly Cloudy',
        humidity: 65,
        rainfall: '10% chance',
        wind_speed: '14 km/h',
        forecast_data: 'Scattered cloud cover with light showers expected over select districts within 48 hours.',
        recorded_at: '2026-09-23T18:00:00.000Z'
      }
    ],
    chatbot_conversations: [
      {
        id: 'CB001',
        farmer_id: 'F001',
        user_message: 'What should I do for my crops today?',
        ai_response: 'Check irrigation and soil moisture for your Rice and Cotton fields. Walk the tomato field to inspect leaves for any early spots.',
        created_at: '2026-09-23T09:00:00.000Z'
      }
    ],
    otps: []
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database.json, initializing fresh data', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }

    // Automatically ensure all local data is seeded to Firestore
    setTimeout(() => {
      this.syncAllToFirestore().catch(err => {
        console.warn('[Firestore] Initial bootstrap sync warning:', err);
      });
    }, 1000);
  }

  public async syncAllToFirestore() {
    return await syncAllDatabaseToFirestore(this.data);
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database.json', err);
    }
  }

  // --- Users & Admins ---
  findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  // --- Farmers ---
  getFarmers() {
    return [...this.data.farmers];
  }

  findFarmerById(id: string) {
    return this.data.farmers.find(f => f.id === id || f.farmer_id === id);
  }

  findFarmerByPhone(phone: string) {
    const clean = phone.replace(/\s+/g, '');
    return this.data.farmers.find(f => f.phone.replace(/\s+/g, '') === clean);
  }

  findFarmerByEmail(email: string) {
    return this.data.farmers.find(f => f.email.toLowerCase() === email.toLowerCase());
  }

  findFarmerByAadhaar(aadhaar: string) {
    const clean = aadhaar.replace(/\s+/g, '');
    return this.data.farmers.find(f => f.aadhaar_number.replace(/\s+/g, '') === clean);
  }

  createFarmer(farmerData: Partial<Farmer>): Farmer {
    const id = 'F' + (this.data.farmers.length + 1).toString().padStart(3, '0');
    const now = new Date().toISOString();
    const newFarmer: Farmer = {
      id,
      farmer_id: id,
      user_id: farmerData.user_id || 'U_' + Date.now(),
      name: farmerData.name || 'Farmer ' + id,
      phone: farmerData.phone || '',
      aadhaar_number: farmerData.aadhaar_number || '',
      email: farmerData.email || '',
      village: farmerData.village || 'My Village',
      district: farmerData.district || 'My District',
      state: farmerData.state || 'Telangana',
      land_area: farmerData.land_area || '0 acres',
      soil_type: farmerData.soil_type || 'Loamy Soil',
      irrigation_type: farmerData.irrigation_type || 'Drip Irrigation',
      joined_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      created_at: now,
      updated_at: now
    };
    this.data.farmers.push(newFarmer);
    this.save();
    syncToFirestore('farmers', newFarmer.id, newFarmer);
    return newFarmer;
  }

  updateFarmer(id: string, updates: Partial<Farmer>) {
    const idx = this.data.farmers.findIndex(f => f.id === id || f.farmer_id === id);
    if (idx === -1) return null;
    this.data.farmers[idx] = {
      ...this.data.farmers[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    syncToFirestore('farmers', id, this.data.farmers[idx]);
    return this.data.farmers[idx];
  }

  // --- Crops ---
  getCrops(farmerId?: string) {
    if (farmerId) {
      return this.data.crops.filter(c => c.farmer_id === farmerId);
    }
    return [...this.data.crops];
  }

  getCropById(id: string) {
    return this.data.crops.find(c => c.id === id);
  }

  createCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Crop {
    const id = 'C' + (this.data.crops.length + 1).toString().padStart(3, '0');
    const now = new Date().toISOString();
    const newCrop: Crop = {
      ...cropData,
      id,
      created_at: now,
      updated_at: now
    };
    this.data.crops.push(newCrop);
    this.save();
    syncToFirestore('crops', newCrop.id, newCrop);
    return newCrop;
  }

  updateCrop(id: string, updates: Partial<Crop>) {
    const idx = this.data.crops.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.crops[idx] = {
      ...this.data.crops[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    syncToFirestore('crops', id, this.data.crops[idx]);
    return this.data.crops[idx];
  }

  deleteCrop(id: string) {
    const idx = this.data.crops.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.crops.splice(idx, 1);
    this.save();
    deleteFromFirestore('crops', id);
    return true;
  }

  // --- Crop Scans ---
  getCropScans(farmerId?: string) {
    if (farmerId) {
      return this.data.crop_scans
        .filter(s => s.farmer_id === farmerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...this.data.crop_scans].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createCropScan(scanData: Omit<CropScan, 'id' | 'created_at'>): CropScan {
    const id = 'S' + (this.data.crop_scans.length + 1).toString().padStart(3, '0');
    const newScan: CropScan = {
      ...scanData,
      id,
      created_at: new Date().toISOString()
    };
    this.data.crop_scans.unshift(newScan);
    this.save();
    syncToFirestore('scans', newScan.id, newScan);
    return newScan;
  }

  // --- Alerts ---
  getAlerts(farmerId?: string) {
    if (farmerId) {
      return this.data.alerts.filter(a => !a.farmer_id || a.farmer_id === farmerId);
    }
    return [...this.data.alerts];
  }

  createAlert(alertData: Omit<Alert, 'id' | 'created_at'>): Alert {
    const id = 'A' + (this.data.alerts.length + 1).toString().padStart(3, '0');
    const newAlert: Alert = {
      ...alertData,
      id,
      created_at: new Date().toISOString()
    };
    this.data.alerts.unshift(newAlert);
    this.save();
    syncToFirestore('alerts', newAlert.id, newAlert);
    return newAlert;
  }

  updateAlert(id: string, updates: Partial<Alert>) {
    const idx = this.data.alerts.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.alerts[idx] = {
      ...this.data.alerts[idx],
      ...updates
    };
    this.save();
    syncToFirestore('alerts', id, this.data.alerts[idx]);
    return this.data.alerts[idx];
  }

  deleteAlert(id: string) {
    const idx = this.data.alerts.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.alerts.splice(idx, 1);
    this.save();
    deleteFromFirestore('alerts', id);
    return true;
  }

  // --- Feedback ---
  getFeedback() {
    return [...this.data.feedback].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createFeedback(feedbackData: Omit<Feedback, 'id' | 'created_at'>): Feedback {
    const id = 'FB' + (this.data.feedback.length + 1).toString().padStart(3, '0');
    const newFeedback: Feedback = {
      ...feedbackData,
      id,
      created_at: new Date().toISOString()
    };
    this.data.feedback.unshift(newFeedback);
    this.save();
    syncToFirestore('feedback', newFeedback.id, newFeedback);
    return newFeedback;
  }

  // --- Market Rates ---
  getMarketRates() {
    return [...this.data.market_rates];
  }

  updateMarketRate(id: string, updates: Partial<MarketRate>) {
    const idx = this.data.market_rates.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.market_rates[idx] = { ...this.data.market_rates[idx], ...updates };
    this.save();
    syncToFirestore('marketRates', id, this.data.market_rates[idx]);
    return this.data.market_rates[idx];
  }

  // --- Weather ---
  getLatestWeather() {
    return this.data.weather_records[0] || null;
  }

  // --- Chatbot conversations ---
  getChatConversations(farmerId: string) {
    return this.data.chatbot_conversations.filter(c => c.farmer_id === farmerId);
  }

  saveChatMessage(farmerId: string, userMessage: string, aiResponse: string) {
    const id = 'CB' + (this.data.chatbot_conversations.length + 1).toString().padStart(3, '0');
    const convo: ChatbotConversation = {
      id,
      farmer_id: farmerId,
      user_message: userMessage,
      ai_response: aiResponse,
      created_at: new Date().toISOString()
    };
    this.data.chatbot_conversations.push(convo);
    this.save();
    return convo;
  }

  // --- OTP Verification Store ---
  saveOtp(identifier: string, otp: string) {
    const otp_hash = bcrypt.hashSync(otp, 8);
    const expires_at = Date.now() + 10 * 60 * 1000; // 10 minutes
    const idx = this.data.otps.findIndex(o => o.identifier === identifier);
    if (idx !== -1) {
      this.data.otps[idx] = { identifier, otp_hash, expires_at, attempts: 0 };
    } else {
      this.data.otps.push({ identifier, otp_hash, expires_at, attempts: 0 });
    }
    this.save();
  }

  verifyOtp(identifier: string, enteredOtp: string): boolean {
    const record = this.data.otps.find(o => o.identifier === identifier);
    if (!record) return false;
    if (Date.now() > record.expires_at) {
      this.data.otps = this.data.otps.filter(o => o.identifier !== identifier);
      this.save();
      return false;
    }
    const match = bcrypt.compareSync(enteredOtp, record.otp_hash);
    if (match) {
      // Invalidate once used
      this.data.otps = this.data.otps.filter(o => o.identifier !== identifier);
      this.save();
      return true;
    }
    record.attempts += 1;
    this.save();
    return false;
  }
}

export const db = new Database();
