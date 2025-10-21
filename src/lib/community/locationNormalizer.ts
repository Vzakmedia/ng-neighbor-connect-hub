/**
 * Location Normalization Utilities
 * 
 * This module provides functions to normalize location names across the platform
 * to ensure consistent matching between posts and user profiles.
 */

/**
 * City normalization map - maps variations to canonical names
 */
const CITY_NORMALIZATION_MAP: Record<string, string> = {
  // Kosofe variations
  'kosofe': 'Kosofe',
  'ojota': 'Kosofe',
  'ogudu': 'Kosofe',
  
  // Lekki variations
  'lekki': 'Lekki',
  'lekki phase 1': 'Lekki',
  'lekki phase 2': 'Lekki',
  
  // Ikeja variations
  'ikeja': 'Ikeja',
  'ikeja gra': 'Ikeja',
  'allen ikeja': 'Ikeja',
  
  // Add more city mappings as needed
};

/**
 * Neighborhood normalization map - organized by city
 */
const NEIGHBORHOOD_NORMALIZATION_MAP: Record<string, Record<string, string>> = {
  'Kosofe': {
    'ojota': 'Ojota',
    'ojota central': 'Ojota',
    'ojota/ogudu': 'Ojota',
    'ogudu': 'Ogudu',
    'ogudu gra': 'Ogudu',
    'ketu': 'Ketu',
  },
  'Lekki': {
    'lekki phase 1': 'Lekki Phase 1',
    'phase 1': 'Lekki Phase 1',
    'lekki phase 2': 'Lekki Phase 2',
    'phase 2': 'Lekki Phase 2',
  },
  'Ikeja': {
    'ikeja gra': 'Ikeja GRA',
    'gra': 'Ikeja GRA',
    'allen': 'Allen',
    'allen ikeja': 'Allen',
  },
  // Add more neighborhood mappings as needed
};

/**
 * Normalize a city name to its canonical form
 * @param city - The city name to normalize
 * @returns The normalized city name
 */
export function normalizeCity(city: string | null | undefined): string | null {
  if (!city) return null;
  
  const normalized = city.toLowerCase().trim();
  return CITY_NORMALIZATION_MAP[normalized] || city;
}

/**
 * Normalize a neighborhood name within a city context
 * @param neighborhood - The neighborhood name to normalize
 * @param city - The city context for normalization
 * @returns The normalized neighborhood name
 */
export function normalizeNeighborhood(
  neighborhood: string | null | undefined,
  city: string | null | undefined
): string | null {
  if (!neighborhood || !city) return neighborhood || null;
  
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return neighborhood;
  
  const neighborhoodMap = NEIGHBORHOOD_NORMALIZATION_MAP[normalizedCity];
  if (!neighborhoodMap) return neighborhood;
  
  const normalized = neighborhood.toLowerCase().trim();
  return neighborhoodMap[normalized] || neighborhood;
}

/**
 * Normalize a state name to its canonical form
 * @param state - The state name to normalize
 * @returns The normalized state name
 */
export function normalizeState(state: string | null | undefined): string | null {
  if (!state) return null;
  
  // Capitalize first letter of each word
  return state
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize all location fields at once
 * @param location - Object containing state, city, and neighborhood
 * @returns Normalized location object
 */
export function normalizeLocation(location: {
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
}): {
  state: string | null;
  city: string | null;
  neighborhood: string | null;
} {
  const normalizedState = normalizeState(location.state);
  const normalizedCity = normalizeCity(location.city);
  const normalizedNeighborhood = normalizeNeighborhood(location.neighborhood, normalizedCity);
  
  return {
    state: normalizedState,
    city: normalizedCity,
    neighborhood: normalizedNeighborhood,
  };
}

/**
 * Debugging utility - logs normalization results
 */
export function debugNormalization(location: {
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
}): void {
  const normalized = normalizeLocation(location);
  console.log('🗺️ Location Normalization:', {
    original: location,
    normalized,
    changes: {
      state: location.state !== normalized.state,
      city: location.city !== normalized.city,
      neighborhood: location.neighborhood !== normalized.neighborhood,
    },
  });
}
