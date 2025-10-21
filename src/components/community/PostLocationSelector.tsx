import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X, Navigation } from "lucide-react";
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from "@/data/nigeriaLocationData";
import { Badge } from "@/components/ui/badge";

interface PostLocationSelectorProps {
  onLocationChange: (state: string, city: string, neighborhood: string) => void;
  defaultState?: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
  profileState?: string;
  profileCity?: string;
  profileNeighborhood?: string;
  onUseProfileLocation?: () => void;
  onClear?: () => void;
}

export const PostLocationSelector = ({ 
  onLocationChange, 
  defaultState, 
  defaultCity, 
  defaultNeighborhood,
  profileState,
  profileCity,
  profileNeighborhood,
  onUseProfileLocation,
  onClear
}: PostLocationSelectorProps) => {
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

  const handleUseProfileLocation = () => {
    if (profileState && profileCity && profileNeighborhood) {
      setSelectedState(profileState);
      setSelectedCity(profileCity);
      setSelectedNeighborhood(profileNeighborhood);
      onUseProfileLocation?.();
    }
  };

  const handleClear = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setNeighborhoodSearch('');
    onClear?.();
  };

  const availableCities = selectedState ? STATE_CITIES[selectedState] || [] : [];
  const availableNeighborhoods = selectedCity ? CITY_NEIGHBORHOODS[selectedCity] || [] : [];
  const filteredNeighborhoods = availableNeighborhoods.filter(neighborhood =>
    neighborhood.toLowerCase().includes(neighborhoodSearch.toLowerCase())
  );

  const isDifferentFromProfile = 
    (selectedState && selectedState !== profileState) ||
    (selectedCity && selectedCity !== profileCity) ||
    (selectedNeighborhood && selectedNeighborhood !== profileNeighborhood);

  const hasProfileLocation = profileState && profileCity && profileNeighborhood;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Override Location (Optional)</Label>
        </div>
        <div className="flex gap-2">
          {hasProfileLocation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseProfileLocation}
              className="text-xs"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Use My Location
            </Button>
          )}
          {selectedState && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Post to a different location than your profile. Uses Nigerian administrative divisions only.
      </p>

      {isDifferentFromProfile && selectedState && selectedCity && selectedNeighborhood && (
        <Badge variant="secondary" className="text-xs">
          <MapPin className="h-3 w-3 mr-1" />
          Posting to different location
        </Badge>
      )}

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="override-state" className="text-sm">State</Label>
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger id="override-state" className="h-9">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">
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
          <Label htmlFor="override-city" className="text-sm">Local Government Area (LGA)</Label>
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger id="override-city" className="h-9">
              <SelectValue placeholder="Select LGA" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {availableCities.length} LGAs in {selectedState}
          </p>
        </div>
      )}

      {/* Ward/Neighborhood Selection */}
      {selectedCity && (
        <div className="space-y-2">
          <Label htmlFor="override-neighborhood" className="text-sm">Ward/Neighborhood</Label>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Search wards..."
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              className="h-9 text-sm"
            />
            <Select value={selectedNeighborhood} onValueChange={handleNeighborhoodChange}>
              <SelectTrigger id="override-neighborhood" className="h-9">
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
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
              {filteredNeighborhoods.length} of {availableNeighborhoods.length} wards
            </p>
          </div>
        </div>
      )}

      {/* Selected Location Summary */}
      {selectedState && selectedCity && selectedNeighborhood && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs font-medium mb-1">Override Location:</p>
          <p className="text-xs text-muted-foreground">
            {selectedNeighborhood}, {selectedCity}, {selectedState}
          </p>
        </div>
      )}
    </div>
  );
};
