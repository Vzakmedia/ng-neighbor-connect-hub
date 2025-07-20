import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Location {
  name: string;
  formatted_address: string;
  place_id: string;
  types: string[];
}

interface LocationSelectorProps {
  onLocationChange: (state: string, city: string, neighborhood: string) => void;
  defaultState?: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
}

export const LocationSelector = ({ 
  onLocationChange, 
  defaultState, 
  defaultCity, 
  defaultNeighborhood 
}: LocationSelectorProps) => {
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  
  const [selectedState, setSelectedState] = useState(defaultState || "");
  const [selectedCity, setSelectedCity] = useState(defaultCity || "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(defaultNeighborhood || "");
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  
  const { toast } = useToast();

  // Fetch states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
      setSelectedCity("");
      setSelectedNeighborhood("");
      setCities([]);
      setNeighborhoods([]);
    }
  }, [selectedState]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    if (selectedCity && selectedState) {
      fetchNeighborhoods(selectedState, selectedCity);
      setSelectedNeighborhood("");
      setNeighborhoods([]);
    }
  }, [selectedCity]);

  // Search neighborhoods with debounce
  useEffect(() => {
    if (neighborhoodSearch && selectedCity && selectedState) {
      const timer = setTimeout(() => {
        fetchNeighborhoods(selectedState, selectedCity, neighborhoodSearch);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [neighborhoodSearch, selectedState, selectedCity]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange(selectedState, selectedCity, selectedNeighborhood);
  }, [selectedState, selectedCity, selectedNeighborhood, onLocationChange]);

  const fetchLocations = async (type: 'states' | 'cities' | 'neighborhoods', payload: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('nigeria-locations', {
        body: { type, ...payload }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Error fetching locations",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        toast({
          title: "Error fetching locations",
          description: data.error,
          variant: "destructive",
        });
        return [];
      }

      return data?.locations || [];
    } catch (error) {
      console.error('Error calling function:', error);
      toast({
        title: "Error fetching locations",
        description: "Failed to fetch location data. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    const locations = await fetchLocations('states', {});
    setStates(locations);
    setLoadingStates(false);
  };

  const fetchCities = async (state: string) => {
    setLoadingCities(true);
    const locations = await fetchLocations('cities', { state });
    setCities(locations);
    setLoadingCities(false);
  };

  const fetchNeighborhoods = async (state: string, city: string, query?: string) => {
    setLoadingNeighborhoods(true);
    const locations = await fetchLocations('neighborhoods', { state, city, query });
    setNeighborhoods(locations);
    setLoadingNeighborhoods(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Location Information</h3>
      </div>

      {/* State Selector */}
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger>
            <SelectValue placeholder={loadingStates ? "Loading states..." : "Select your state"} />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
            {loadingStates ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading states...</span>
              </div>
            ) : (
              states.map((state) => (
                <SelectItem key={state.place_id} value={state.name}>
                  {state.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select 
          value={selectedCity} 
          onValueChange={setSelectedCity}
          disabled={!selectedState}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                !selectedState 
                  ? "Select a state first" 
                  : loadingCities 
                    ? "Loading cities..." 
                    : "Select your city"
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
            {loadingCities ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading cities...</span>
              </div>
            ) : (
              cities.map((city) => (
                <SelectItem key={city.place_id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Neighborhood Search and Selector */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Neighborhood</Label>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={!selectedCity ? "Select a city first" : "Search for your neighborhood..."}
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              disabled={!selectedCity}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={selectedNeighborhood} 
            onValueChange={setSelectedNeighborhood}
            disabled={!selectedCity}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  !selectedCity 
                    ? "Select a city first" 
                    : loadingNeighborhoods 
                      ? "Loading neighborhoods..." 
                      : "Select your neighborhood"
                } 
              />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
              {loadingNeighborhoods ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading neighborhoods...</span>
                </div>
              ) : neighborhoods.length > 0 ? (
                neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood.place_id} value={neighborhood.name}>
                    {neighborhood.name}
                  </SelectItem>
                ))
              ) : selectedCity && (
                <div className="p-4 text-center text-muted-foreground">
                  No neighborhoods found. Try a different search term.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedState && selectedCity && selectedNeighborhood && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {selectedNeighborhood}, {selectedCity}, {selectedState}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};