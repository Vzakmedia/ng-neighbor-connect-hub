import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Star, Phone, Mail, Clock, Building, Search, ShieldCheck, Plus, Check, ChevronsUpDown } from 'lucide-react';
import BusinessRegistrationDialog from './BusinessRegistrationDialog';
import { formatTimeAgo } from '@/lib/utils';

interface Business {
  id: string;
  business_name: string;
  description: string;
  category: string;
  phone: string | null;
  email: string | null;
  physical_address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  operating_hours: any;
  is_verified: boolean;
  verification_status: string;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const businessCategories = [
  'all',
  'restaurant_food',
  'retail_shopping',
  'health_wellness',
  'automotive',
  'home_services',
  'professional_services',
  'technology',
  'beauty_personal_care',
  'education_training',
  'entertainment',
  'sports_fitness',
  'real_estate',
  'financial_services',
  'other'
];

const nigerianLocations = {
  'Lagos State': {
    'Lagos Island': ['Victoria Island', 'Ikoyi', 'Lagos Island Central', 'Tafawa Balewa Square'],
    'Lagos Mainland': ['Yaba', 'Surulere', 'Mushin', 'Ikeja', 'Maryland', 'Ogba', 'Palmgrove'],
    'Lekki': ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Sangotedo', 'Chevron'],
    'Alimosho': ['Egbeda', 'Idimu', 'Ikotun', 'Akowonjo', 'Igando'],
    'Kosofe': ['Ketu', 'Mile 12', 'Ojota', 'Anthony Village'],
    'Other Areas': ['Gbagada', 'Festac', 'Satellite Town', 'Badagry', 'Epe']
  },
  'Federal Capital Territory': {
    'Abuja Municipal': ['Central Business District', 'Garki', 'Wuse', 'Maitama', 'Asokoro'],
    'Gwagwalada': ['Gwagwalada Central', 'Dobi', 'Paiko'],
    'Kuje': ['Kuje Central', 'Chibiri', 'Gudun Karya'],
    'Bwari': ['Bwari Central', 'Kubwa', 'Dutse', 'Sabon Gida'],
    'Kwali': ['Kwali Central', 'Kilankwa', 'Yangoji'],
    'Abaji': ['Abaji Central', 'Pandogari', 'Yaba']
  },
  'Rivers State': {
    'Port Harcourt': ['GRA Phase 1', 'GRA Phase 2', 'Old GRA', 'New GRA', 'Town', 'Diobu'],
    'Obio-Akpor': ['Rumuola', 'Rumuokwurushi', 'Choba', 'Alakahia', 'Eliozu'],
    'Okrika': ['Okrika Town', 'Bolo', 'Ogan'],
    'Oyigbo': ['Oyigbo Central', 'Komkom', 'Afam'],
    'Other Areas': ['Bonny', 'Degema', 'Ahoada', 'Omoku']
  },
  'Kano State': {
    'Kano Municipal': ['Sabon Gari', 'Fagge', 'Dala', 'Gwale', 'Nassarawa'],
    'Nasarawa': ['Nasarawa Central', 'Bompai', 'Hotoro'],
    'Ungogo': ['Ungogo Central', 'Bachirawa', 'Zango'],
    'Other Areas': ['Wudil', 'Gwarzo', 'Dawakin Kudu', 'Kiru']
  },
  'Oyo State': {
    'Ibadan North': ['Bodija', 'Agodi', 'Jericho', 'Mokola', 'Sango'],
    'Ibadan South-West': ['Ring Road', 'Dugbe', 'Adamasingba', 'Oke Ado'],
    'Ibadan North-East': ['Iwo Road', 'Challenge', 'Felele', 'Bashorun'],
    'Ibadan South-East': ['Mapo', 'Oja Oba', 'Isale Eko'],
    'Other Areas': ['Ogbomoso', 'Oyo', 'Iseyin', 'Saki']
  }
};

const BusinessListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  const fetchBusinesses = async () => {
    try {
      const { data: businessData, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('verification_status', 'verified')
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately for each business
      const businessesWithProfiles = await Promise.all(
        (businessData || []).map(async (business: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', business.user_id)
            .single();

          return {
            ...business,
            profiles: profile || { full_name: 'Business Owner', avatar_url: '' }
          };
        })
      );

      // Apply client-side filtering
      let filteredBusinesses = businessesWithProfiles;

      if (selectedCategory !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => b.category === selectedCategory);
      }

      // Enhanced location filtering
      if (selectedState !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.state?.toLowerCase().includes(selectedState.toLowerCase())
        );
      }

      if (selectedCity !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
          b.physical_address?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      if (selectedNeighborhood !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.physical_address?.toLowerCase().includes(selectedNeighborhood.toLowerCase())
        );
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.business_name?.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower)
        );
      }

      setBusinesses(filteredBusinesses as Business[]);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBusinessInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get available cities for selected state
  const getAvailableCities = () => {
    try {
      if (selectedState === 'all' || !nigerianLocations) return [];
      const stateData = nigerianLocations[selectedState as keyof typeof nigerianLocations];
      if (!stateData || typeof stateData !== 'object') return [];
      const cities = Object.keys(stateData) || [];
      console.log('Available cities for', selectedState, ':', cities);
      return cities;
    } catch (error) {
      console.error('Error getting cities:', error);
      return [];
    }
  };

  // Get available neighborhoods for selected city
  const getAvailableNeighborhoods = () => {
    try {
      if (selectedState === 'all' || selectedCity === 'all' || !nigerianLocations) return [];
      const stateData = nigerianLocations[selectedState as keyof typeof nigerianLocations];
      if (!stateData || typeof stateData !== 'object') return [];
      const cityData = stateData[selectedCity as keyof typeof stateData];
      if (!cityData || !Array.isArray(cityData)) return [];
      console.log('Available neighborhoods for', selectedCity, ':', cityData);
      return cityData;
    } catch (error) {
      console.error('Error getting neighborhoods:', error);
      return [];
    }
  };

  // Get all locations for search
  const getAllLocations = () => {
    const locations: string[] = [];
    try {
      if (!nigerianLocations || typeof nigerianLocations !== 'object') {
        console.log('nigerianLocations is not valid:', nigerianLocations);
        return [];
      }
      
      Object.entries(nigerianLocations).forEach(([state, cities]) => {
        if (state) locations.push(state);
        if (cities && typeof cities === 'object') {
          Object.entries(cities).forEach(([city, neighborhoods]) => {
            if (city) locations.push(city);
            if (Array.isArray(neighborhoods)) {
              neighborhoods.forEach(neighborhood => {
                if (neighborhood) locations.push(neighborhood);
              });
            }
          });
        }
      });
      console.log('Generated locations:', locations.length);
    } catch (error) {
      console.error('Error building locations list:', error);
      return [];
    }
    return locations;
  };

  // Handle state selection
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('all');
    setSelectedNeighborhood('all');
  };

  // Handle city selection
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedNeighborhood('all');
  };
  
  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No ratings</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  useEffect(() => {
    fetchBusinesses();
  }, [searchTerm, selectedCategory, selectedState, selectedCity, selectedNeighborhood]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {businessCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Enhanced Location Search */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={locationOpen}
                className="w-[250px] justify-between"
              >
                {selectedNeighborhood !== 'all' 
                  ? selectedNeighborhood
                  : selectedCity !== 'all' 
                  ? selectedCity
                  : selectedState !== 'all' 
                  ? selectedState
                  : "Select location..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search locations..." 
                  value={searchLocation}
                  onValueChange={setSearchLocation}
                />
                <CommandEmpty>No location found.</CommandEmpty>
                
                <CommandGroup heading="Quick Reset">
                  <CommandItem
                    onSelect={() => {
                      setSelectedState('all');
                      setSelectedCity('all');
                      setSelectedNeighborhood('all');
                      setLocationOpen(false);
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${selectedState === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                    All Locations
                  </CommandItem>
                </CommandGroup>

                {/* States */}
                {(() => {
                  const states = nigerianLocations && typeof nigerianLocations === 'object' 
                    ? Object.keys(nigerianLocations).filter(state => 
                        state && typeof state === 'string' && 
                        state.toLowerCase().includes((searchLocation || '').toLowerCase())
                      )
                    : [];
                  
                  return states.length > 0 && (
                    <CommandGroup heading="States">
                      {states.map((state) => (
                        <CommandItem
                          key={state}
                          onSelect={() => {
                            handleStateChange(state);
                            setLocationOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedState === state ? 'opacity-100' : 'opacity-0'}`} />
                          {state}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })()}

                {/* Cities for selected state */}
                {(() => {
                  const cities = selectedState !== 'all' ? (getAvailableCities() || []).filter(city => 
                    city && typeof city === 'string' && 
                    city.toLowerCase().includes((searchLocation || '').toLowerCase())
                  ) : [];
                  
                  return cities.length > 0 && (
                    <CommandGroup heading={`Cities in ${selectedState}`}>
                      {cities.map((city) => (
                        <CommandItem
                          key={city}
                          onSelect={() => {
                            handleCityChange(city);
                            setLocationOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedCity === city ? 'opacity-100' : 'opacity-0'}`} />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })()}

                {/* Neighborhoods for selected city */}
                {(() => {
                  const neighborhoods = selectedCity !== 'all' ? (getAvailableNeighborhoods() || []).filter(neighborhood => 
                    neighborhood && typeof neighborhood === 'string' && 
                    neighborhood.toLowerCase().includes((searchLocation || '').toLowerCase())
                  ) : [];
                  
                  return neighborhoods.length > 0 && (
                    <CommandGroup heading={`Areas in ${selectedCity}`}>
                      {neighborhoods.map((neighborhood) => (
                        <CommandItem
                          key={neighborhood}
                          onSelect={() => {
                            setSelectedNeighborhood(neighborhood);
                            setLocationOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedNeighborhood === neighborhood ? 'opacity-100' : 'opacity-0'}`} />
                          {neighborhood}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })()}

                {/* Search all locations */}
                {(() => {
                  const searchResults = searchLocation ? (getAllLocations() || [])
                    .filter(location => 
                      location && 
                      typeof location === 'string' && 
                      location.toLowerCase().includes((searchLocation || '').toLowerCase()) &&
                      !Object.keys(nigerianLocations || {}).includes(location)
                    )
                    .slice(0, 10) : [];
                  
                  return searchResults.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {searchResults.map((location) => (
                        <CommandItem
                          key={location}
                          onSelect={() => {
                            try {
                              // Find which state/city this belongs to
                              const foundState = Object.entries(nigerianLocations || {}).find(([state, cities]) => {
                                if (state === location) return true;
                                if (!cities || typeof cities !== 'object') return false;
                                return Object.entries(cities).some(([city, neighborhoods]) => {
                                  if (city === location) return true;
                                  return Array.isArray(neighborhoods) && neighborhoods.includes(location);
                                });
                              });
                              
                              if (foundState) {
                                const [stateName, cities] = foundState;
                                if (cities && typeof cities === 'object') {
                                  const foundCity = Object.entries(cities).find(([city, neighborhoods]) => {
                                    if (city === location) return true;
                                    return Array.isArray(neighborhoods) && neighborhoods.includes(location);
                                  });
                                  
                                  if (foundCity) {
                                    const [cityName, neighborhoods] = foundCity;
                                    if (Array.isArray(neighborhoods) && neighborhoods.includes(location)) {
                                      setSelectedState(stateName);
                                      setSelectedCity(cityName);
                                      setSelectedNeighborhood(location);
                                    } else {
                                      setSelectedState(stateName);
                                      setSelectedCity(location);
                                      setSelectedNeighborhood('all');
                                    }
                                  }
                                }
                              }
                            } catch (error) {
                              console.error('Error selecting location:', error);
                            }
                            setLocationOpen(false);
                          }}
                        >
                          {location}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })()}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Register Business CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Own a business?</h3>
                <p className="text-muted-foreground">Register your business and reach more customers in your community</p>
              </div>
              <BusinessRegistrationDialog onBusinessRegistered={fetchBusinesses}>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Register Business
                </Button>
              </BusinessRegistrationDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Listings */}
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' || selectedState !== 'all' || selectedCity !== 'all' || selectedNeighborhood !== 'all'
                ? 'No businesses found matching your criteria' 
                : 'No verified businesses yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={business.logo_url || business.profiles?.avatar_url} />
                    <AvatarFallback>
                      {getBusinessInitials(business.business_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{business.business_name}</CardTitle>
                      {business.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {formatCategory(business.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {business.description}
                </p>

                {renderStars(business.rating)}

                {business.physical_address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{business.physical_address}</span>
                  </div>
                )}

                {(business.city || business.state) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{business.city}{business.city && business.state && ', '}{business.state}</span>
                  </div>
                )}

                {business.operating_hours && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>View Hours</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {business.phone && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  )}
                  {business.email && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Listed {formatTimeAgo(business.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessListings;