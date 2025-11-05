export interface SafetyAlert {
  id: string;
  title: string;
  description: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
  latitude: number;
  longitude: number;
  address: string;
  images: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  verified_at?: string;
  verified_by?: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    city?: string;
    state?: string;
  } | null;
}

export interface PanicAlert {
  id: string;
  user_id: string;
  situation_type: string;
  message?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  latitude: number;
  longitude: number;
  profiles?: {
    full_name: string;
    avatar_url?: string;
    state?: string;
    city?: string;
  };
}

export interface EmergencyFilters {
  severity: string;
  type: string;
  status: string;
  category?: 'all' | 'break_in' | 'theft' | 'accident' | 'suspicious_activity' | 'harassment' | 'fire' | 'flood' | 'power_outage' | 'road_closure' | 'other';
}

export interface EmergencyViewMode {
  mode: 'list' | 'map' | 'feed' | 'system';
}

export interface EmergencyStats {
  activeAlerts: number;
  resolvedToday: number;
  investigating: number;
  myPanicAlerts: number;
  totalReports: number;
}

export const ALERT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'break_in', label: 'Break-in' },
  { value: 'theft', label: 'Theft' },
  { value: 'accident', label: 'Accident' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'road_closure', label: 'Road Closure' },
  { value: 'other', label: 'Other' }
];

export const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};