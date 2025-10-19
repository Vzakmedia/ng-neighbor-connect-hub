// Nigeria Location Service - Central source of truth for all Nigerian location data

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StateData {
  name: string;
  coordinates: Coordinates;
  formatted_address: string;
}

export interface CityData {
  name: string;
  state: string;
  coordinates: Coordinates;
  formatted_address: string;
}

export interface NeighborhoodData {
  name: string;
  city: string;
  state: string;
  coordinates: Coordinates;
  formatted_address: string;
}

export interface LocationData {
  state?: string;
  city?: string;
  neighborhood?: string;
  coordinates: Coordinates;
  formatted_address: string;
}

// Nigeria geographic boundaries
export const NIGERIA_BOUNDS = {
  north: 13.9,
  south: 4.3,
  east: 14.7,
  west: 2.7,
  center: { lat: 9.0820, lng: 8.6753 }
};

// All 37 Nigerian states + FCT with coordinates
export const STATE_COORDINATES: { [key: string]: Coordinates } = {
  'Abia': { lat: 5.4527, lng: 7.5248 },
  'Adamawa': { lat: 9.3265, lng: 12.3984 },
  'Akwa Ibom': { lat: 5.0077, lng: 7.8536 },
  'Anambra': { lat: 6.2209, lng: 6.9370 },
  'Bauchi': { lat: 10.3158, lng: 9.8442 },
  'Bayelsa': { lat: 4.7719, lng: 6.0699 },
  'Benue': { lat: 7.3369, lng: 8.7405 },
  'Borno': { lat: 11.8846, lng: 13.1510 },
  'Cross River': { lat: 5.8738, lng: 8.5989 },
  'Delta': { lat: 5.8903, lng: 5.6801 },
  'Ebonyi': { lat: 6.2649, lng: 8.0137 },
  'Edo': { lat: 6.6346, lng: 5.9163 },
  'Ekiti': { lat: 7.7190, lng: 5.3110 },
  'Enugu': { lat: 6.5244, lng: 7.5106 },
  'Federal Capital Territory': { lat: 9.0765, lng: 7.3986 },
  'Gombe': { lat: 10.2896, lng: 11.1670 },
  'Imo': { lat: 5.5720, lng: 7.0588 },
  'Jigawa': { lat: 12.2287, lng: 9.5615 },
  'Kaduna': { lat: 10.5105, lng: 7.4165 },
  'Kano': { lat: 12.0022, lng: 8.5919 },
  'Katsina': { lat: 12.9908, lng: 7.6177 },
  'Kebbi': { lat: 11.4969, lng: 4.1975 },
  'Kogi': { lat: 7.7336, lng: 6.6939 },
  'Kwara': { lat: 8.9670, lng: 4.3786 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Nasarawa': { lat: 8.4970, lng: 8.3089 },
  'Niger': { lat: 9.9308, lng: 5.5981 },
  'Ogun': { lat: 6.9960, lng: 3.4760 },
  'Ondo': { lat: 7.2500, lng: 5.1950 },
  'Osun': { lat: 7.5629, lng: 4.5200 },
  'Oyo': { lat: 8.1574, lng: 3.6149 },
  'Plateau': { lat: 9.2182, lng: 9.5179 },
  'Rivers': { lat: 4.8156, lng: 7.0498 },
  'Sokoto': { lat: 13.0059, lng: 5.2476 },
  'Taraba': { lat: 7.9954, lng: 10.7739 },
  'Yobe': { lat: 12.2939, lng: 11.9659 },
  'Zamfara': { lat: 12.1704, lng: 6.2235 }
};

// Major city coordinates
export const CITY_COORDINATES: { [key: string]: Coordinates } = {
  // Lagos
  'Lagos Island': { lat: 6.4541, lng: 3.3947 },
  'Ikeja': { lat: 6.6018, lng: 3.3515 },
  'Lekki': { lat: 6.4474, lng: 3.5895 },
  'Victoria Island': { lat: 6.4281, lng: 3.4219 },
  'Ikoyi': { lat: 6.4541, lng: 3.4316 },
  'Yaba': { lat: 6.5095, lng: 3.3711 },
  'Surulere': { lat: 6.4969, lng: 3.3534 },
  'Gbagada': { lat: 6.5446, lng: 3.3788 },
  'Maryland': { lat: 6.5725, lng: 3.3659 },
  'Ajah': { lat: 6.4674, lng: 3.5716 },
  'Ikorodu': { lat: 6.6195, lng: 3.5110 },
  'Festac': { lat: 6.4644, lng: 3.2802 },
  'Alimosho': { lat: 6.6023, lng: 3.2632 },
  'Badagry': { lat: 6.4173, lng: 2.8873 },
  'Epe': { lat: 6.5833, lng: 3.9833 },
  
  // FCT Abuja
  'Abuja Municipal': { lat: 9.0579, lng: 7.4951 },
  'Garki': { lat: 9.0351, lng: 7.4872 },
  'Wuse': { lat: 9.0649, lng: 7.4861 },
  'Gwarinpa': { lat: 9.1113, lng: 7.4114 },
  'Kubwa': { lat: 9.1429, lng: 7.3365 },
  'Maitama': { lat: 9.0820, lng: 7.4983 },
  'Asokoro': { lat: 9.0497, lng: 7.5345 },
  'Jabi': { lat: 9.0799, lng: 7.4547 },
  'Utako': { lat: 9.0833, lng: 7.4500 },
  'Life Camp': { lat: 9.0433, lng: 7.4285 },
  'Lugbe': { lat: 8.9833, lng: 7.3667 },
  'Nyanya': { lat: 8.9957, lng: 7.5634 },
  'Gwagwalada': { lat: 8.9433, lng: 7.0833 },
  'Kuje': { lat: 8.8667, lng: 7.2167 },
  
  // Kano
  'Kano Municipal': { lat: 12.0022, lng: 8.5919 },
  'Nassarawa': { lat: 12.0000, lng: 8.5333 },
  'Fagge': { lat: 12.0167, lng: 8.5333 },
  
  // Port Harcourt
  'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
  'Obio-Akpor': { lat: 4.8975, lng: 6.9566 },
  
  // Ibadan
  'Ibadan North': { lat: 7.3775, lng: 3.9470 },
  'Ibadan South-East': { lat: 7.3775, lng: 3.9470 },
  
  // Other major cities
  'Benin City': { lat: 6.3350, lng: 5.6037 },
  'Enugu': { lat: 6.5244, lng: 7.5106 },
  'Kaduna North': { lat: 10.5268, lng: 7.4391 },
  'Kaduna South': { lat: 10.4806, lng: 7.4165 },
  'Zaria': { lat: 11.0449, lng: 7.7336 },
  'Owerri': { lat: 5.4840, lng: 7.0351 },
  'Calabar': { lat: 4.9517, lng: 8.3220 },
  'Abeokuta': { lat: 7.1475, lng: 3.3619 },
  'Akure': { lat: 7.2571, lng: 5.2058 },
  'Minna': { lat: 9.6139, lng: 6.5569 },
  'Uyo': { lat: 5.0077, lng: 7.8536 },
  'Warri': { lat: 5.5160, lng: 5.7500 }
};

class NigeriaLocationService {
  // Get all 37 states with coordinates
  getAllStates(): StateData[] {
    return Object.entries(STATE_COORDINATES).map(([name, coordinates]) => ({
      name,
      coordinates,
      formatted_address: `${name}, Nigeria`
    }));
  }

  // Get cities for a state (returns major cities, real implementation would query database)
  getCitiesForState(state: string): CityData[] {
    const cities: CityData[] = [];
    
    Object.entries(CITY_COORDINATES).forEach(([cityName, coordinates]) => {
      // Simple mapping - in production, you'd have a proper state-city mapping
      cities.push({
        name: cityName,
        state,
        coordinates,
        formatted_address: `${cityName}, ${state}, Nigeria`
      });
    });
    
    return cities;
  }

  // Get coordinates for any location level
  getCoordinates(state?: string, city?: string): Coordinates {
    if (city && CITY_COORDINATES[city]) {
      return CITY_COORDINATES[city];
    }
    
    if (state && STATE_COORDINATES[state]) {
      return STATE_COORDINATES[state];
    }
    
    // Default to Nigeria center
    return NIGERIA_BOUNDS.center;
  }

  // Validate if coordinates are within Nigeria
  isInNigeria(lat: number, lng: number): boolean {
    return (
      lat >= NIGERIA_BOUNDS.south &&
      lat <= NIGERIA_BOUNDS.north &&
      lng >= NIGERIA_BOUNDS.west &&
      lng <= NIGERIA_BOUNDS.east
    );
  }

  // Get closest location from coordinates (simplified version)
  getLocationFromCoords(lat: number, lng: number): LocationData | null {
    if (!this.isInNigeria(lat, lng)) {
      return null;
    }

    // Find closest state
    let closestState = '';
    let minDistance = Infinity;

    Object.entries(STATE_COORDINATES).forEach(([stateName, coords]) => {
      const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestState = stateName;
      }
    });

    const coordinates = { lat, lng };
    
    return {
      state: closestState,
      coordinates,
      formatted_address: `${closestState}, Nigeria`
    };
  }

  // Format Nigerian address
  formatAddress(components: {
    neighborhood?: string;
    city?: string;
    state?: string;
  }): string {
    const parts: string[] = [];
    
    if (components.neighborhood) parts.push(components.neighborhood);
    if (components.city) parts.push(components.city);
    if (components.state) parts.push(components.state);
    parts.push('Nigeria');
    
    return parts.join(', ');
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get Nigeria boundary restriction for Google Maps
  getNigeriaBounds(): google.maps.LatLngBoundsLiteral {
    return {
      north: NIGERIA_BOUNDS.north,
      south: NIGERIA_BOUNDS.south,
      east: NIGERIA_BOUNDS.east,
      west: NIGERIA_BOUNDS.west
    };
  }
}

export const nigeriaLocationService = new NigeriaLocationService();
