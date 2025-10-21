// Comprehensive Nigerian location data
// Source: https://github.com/temikeezy/nigeria-geojson-data
// This file is auto-generated from the comprehensive dataset

import fullData from '../../../src/data/nigeria-full.json' assert { type: 'json' };

interface Ward {
  name: string;
  latitude: number;
  longitude: number;
}

interface LGA {
  name: string;
  wards: Ward[];
}

interface StateData {
  state: string;
  lgas: LGA[];
}

// Transform the data for quick lookup
const COMPREHENSIVE_DATA = fullData as StateData[];

// Generate STATE_CITIES mapping (State -> LGAs)
export const STATE_CITIES: { [key: string]: string[] } = {};
COMPREHENSIVE_DATA.forEach(stateData => {
  STATE_CITIES[stateData.state] = stateData.lgas.map(lga => lga.name);
});

// Generate CITY_NEIGHBORHOODS mapping (LGA -> Wards)
export const CITY_NEIGHBORHOODS: { [key: string]: string[] } = {};
COMPREHENSIVE_DATA.forEach(stateData => {
  stateData.lgas.forEach(lga => {
    CITY_NEIGHBORHOODS[lga.name] = lga.wards.map(ward => ward.name);
  });
});

// All Nigerian States
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

console.log(`📊 Loaded ${Object.keys(STATE_CITIES).length} states with ${Object.keys(CITY_NEIGHBORHOODS).length} LGAs`);
