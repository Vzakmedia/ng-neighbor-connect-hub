export const NIGERIA_BOUNDS = {
    north: 13.9,  // Northern Nigeria border
    south: 4.3,   // Southern Nigeria border
    east: 14.7,   // Eastern Nigeria border
    west: 2.7     // Western Nigeria border
};

export const DEFAULT_CENTER = { lat: 9.0820, lng: 8.6753 };
export const DEFAULT_ZOOM = 6;
export const USER_LOCATION_ZOOM = 14;

export const SEVERITY_COLORS = {
    low: '#3B82F6',      // blue
    medium: '#F59E0B',   // yellow
    high: '#F97316',     // orange
    critical: '#EF4444'  // red
} as const;

export type SeverityType = keyof typeof SEVERITY_COLORS;

export interface MapLocation {
    lat: number;
    lng: number;
}

export const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

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
    profiles: {
        full_name: string;
        avatar_url?: string;
    } | null;
}
