export interface Farmer {
  id: string;
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
  planting_date?: string;
}

export interface CropScan {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  crop_id?: string;
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
  farmer_id?: string;
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

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: string;
  wind_speed: string;
  forecast_data: string;
  recorded_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}
