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

// Hardcoded Nigerian states as fallback
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// Major cities by state as fallback
const STATE_CITIES: { [key: string]: string[] } = {
  'Lagos': ['Lagos Island', 'Lagos Mainland', 'Surulere', 'Ikeja', 'Oshodi-Isolo', 'Mushin', 'Alimosho', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Ikorodu', 'Epe', 'Badagry', 'Lekki', 'Victoria Island', 'Ikoyi', 'Yaba', 'Gbagada', 'Ajah', 'Maryland'],
  'Federal Capital Territory': ['Abuja Municipal', 'Gwagwalada', 'Kuje', 'Abaji', 'Kwali', 'Bwari', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Nyanya', 'Karu', 'Lugbe', 'Life Camp', 'Utako', 'Jabi'],
  'Kano': ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa', 'Ungogo', 'Kumbotso'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Ogu-Bolo', 'Eleme', 'Bonny', 'Degema'],
  'Kaduna': ['Kaduna North', 'Kaduna South', 'Chikun', 'Igabi', 'Zaria', 'Sabon Gari'],
  'Oyo': ['Ibadan North', 'Ibadan South', 'Ogbomoso', 'Oyo', 'Iseyin'],
  'Abia': ['Aba North', 'Aba South', 'Umuahia North', 'Umuahia South'],
  'Adamawa': ['Yola North', 'Yola South', 'Mubi North', 'Mubi South'],
  'Akwa Ibom': ['Uyo', 'Ikot Ekpene', 'Eket', 'Oron'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Katagum'],
  'Bayelsa': ['Yenagoa', 'Brass', 'Sagbama'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'],
  'Borno': ['Maiduguri', 'Bama', 'Biu'],
  'Cross River': ['Calabar', 'Ikom', 'Ugep'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi'],
  'Ekiti': ['Ado-Ekiti', 'Ikere', 'Ijero', 'Ikole'],
  'Enugu': ['Enugu', 'Nsukka', 'Oji River', 'Agbani'],
  'Gombe': ['Gombe', 'Kumo', 'Deba', 'Bajoga'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Mbaise'],
  'Jigawa': ['Dutse', 'Hadejia', 'Kazaure', 'Gumel'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Zuru', 'Yauri'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah'],
  'Kwara': ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa'],
  'Niger': ['Minna', 'Bida', 'Kontagora', 'Suleja'],
  'Ogun': ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Okitipupa'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam'],
  'Sokoto': ['Sokoto', 'Gwadabawa', 'Tambuwal', 'Wurno'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Gembu'],
  'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Zurmi']
};

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
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const MAX_RETRIES = 3;

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

  const fetchLocations = async (type: 'states' | 'cities' | 'neighborhoods', payload: any, attempt = 0): Promise<any[]> => {
    try {
      console.log(`Fetching ${type}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      
      // For states, use hardcoded fallback immediately
      if (type === 'states') {
        console.log('Using hardcoded states list');
        return NIGERIAN_STATES.map((stateName) => ({
          name: stateName,
          formatted_address: `${stateName}, Nigeria`,
          place_id: `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['administrative_area_level_1']
        }));
      }
      
      // For cities, use hardcoded fallback immediately
      if (type === 'cities' && payload.state) {
        console.log('Using hardcoded cities list for', payload.state);
        const cities = STATE_CITIES[payload.state] || [];
        return cities.map((cityName) => ({
          name: cityName,
          formatted_address: `${cityName}, ${payload.state}, Nigeria`,
          place_id: `city_${cityName.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['locality']
        }));
      }
      
      const { data, error } = await supabase.functions.invoke('nigeria-locations', {
        body: { type, ...payload }
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Retry logic with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchLocations(type, payload, attempt + 1);
        }
        
        setError(error.message || 'Failed to load location data');
        toast({
          title: "Error fetching locations",
          description: `${error.message}. Please try again or contact support.`,
          variant: "destructive",
        });
        return [];
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchLocations(type, payload, attempt + 1);
        }
        
        setError(data.error);
        toast({
          title: "Error fetching locations",
          description: data.error,
          variant: "destructive",
        });
        return [];
      }

      setError(null);
      setRetryCount(0);
      return data?.locations || [];
    } catch (error: any) {
      console.error('Error calling function:', error);
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        setRetryCount(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchLocations(type, payload, attempt + 1);
      }
      
      setError('Failed to fetch location data after multiple attempts');
      toast({
        title: "Connection Error",
        description: "Failed to load location data. Please check your internet connection and try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    setError(null);
    const locations = await fetchLocations('states', {});
    setStates(locations);
    setLoadingStates(false);
  };
  
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchStates();
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
        <h3 className="text-lg font-semibold">Location Information <span className="text-destructive">*</span></h3>
        <p className="text-sm text-muted-foreground">(All fields required)</p>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive font-medium mb-2">
            {retryCount > 0 ? `Retrying... (Attempt ${retryCount}/${MAX_RETRIES})` : 'Failed to load location data'}
          </p>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* State Selector */}
      <div className="space-y-2">
        <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
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
        <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
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
        <Label htmlFor="neighborhood">Neighborhood <span className="text-destructive">*</span></Label>
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