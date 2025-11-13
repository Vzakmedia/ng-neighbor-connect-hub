import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from "@/data/nigeriaLocationData";

interface SimpleLocationSelectorProps {
  onLocationChange: (state: string, city: string, neighborhood: string) => void;
  defaultState?: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
}

export const SimpleLocationSelector = ({ 
  onLocationChange, 
  defaultState, 
  defaultCity, 
  defaultNeighborhood 
}: SimpleLocationSelectorProps) => {
  const [selectedState, setSelectedState] = useState(defaultState || '');
  const [selectedCity, setSelectedCity] = useState(defaultCity || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(defaultNeighborhood || '');
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');

  useEffect(() => {
    onLocationChange(selectedState, selectedCity, selectedNeighborhood);
  }, [selectedState, selectedCity, selectedNeighborhood]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setSelectedNeighborhood('');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedNeighborhood('');
  };

  const handleNeighborhoodChange = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
  };

  const availableCities = selectedState ? STATE_CITIES[selectedState] || [] : [];
  const availableNeighborhoods = selectedCity ? CITY_NEIGHBORHOODS[selectedCity] || [] : [];
  const filteredNeighborhoods = availableNeighborhoods.filter(neighborhood =>
    neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPinIcon className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Location <span className="text-destructive">*</span></h3>
      </div>

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger id="state">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {NIGERIAN_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LGA Selection */}
      {selectedState && (
        <div className="space-y-2">
          <Label htmlFor="city">Local Government Area (LGA)</Label>
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Select your LGA" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {availableCities.length} LGAs available in {selectedState}
          </p>
        </div>
      )}

      {/* Ward/Neighborhood Selection */}
      {selectedCity && (
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Ward/Neighborhood</Label>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Search wards..."
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              className="w-full"
            />
            <Select value={selectedNeighborhood} onValueChange={handleNeighborhoodChange}>
              <SelectTrigger id="neighborhood">
                <SelectValue placeholder="Select your ward" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredNeighborhoods.length > 0 ? (
                  filteredNeighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No wards found
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {filteredNeighborhoods.length} of {availableNeighborhoods.length} wards {neighborhoodSearch && 'matching search'}
            </p>
          </div>
        </div>
      )}

      {/* Selected Location Summary */}
      {selectedState && selectedCity && selectedNeighborhood && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-1">Selected Location:</p>
          <p className="text-sm text-muted-foreground">
            {selectedNeighborhood}, {selectedCity}, {selectedState}
          </p>
        </div>
      )}
    </div>
  );
};
