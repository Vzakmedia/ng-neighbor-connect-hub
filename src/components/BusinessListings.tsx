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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Star, Phone, Mail, Clock, Building, Search, ShieldCheck, Plus, Check, ChevronsUpDown } from 'lucide-react';
import BusinessRegistrationDialog from './BusinessRegistrationDialog';
import { formatTimeAgo } from '@/lib/utils';
import { BUSINESS_CATEGORIES, formatCategory as formatCategoryUtil } from '@/data/businessCategories';
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from '@/data/nigeriaLocationData';

interface Business {
  id: string;
  business_name: string;
  description: string;
  category: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  operating_hours: any;
  is_verified: boolean;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  // Contact info will be loaded separately for authenticated users
  contactInfo?: {
    phone: string | null;
    email: string | null;
    physical_address: string | null;
    website_url: string | null;
  };
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

// Get all business categories with 'all' option
const businessCategories = ['all', ...BUSINESS_CATEGORIES.map(cat => cat.value)];

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
        .rpc('get_business_directory');

      if (error) throw error;

      // For authenticated users, we can load contact info separately if needed
      const businessesWithProfiles = await Promise.all(
        Array.isArray(businessData) ? businessData.map(async (business: any) => {
          // Note: We no longer have user_id in the directory view for privacy
          // Contact info will be loaded on-demand when user clicks contact buttons
          return {
            ...business,
            profiles: { full_name: 'Business Owner', avatar_url: '' }
          };
        }) : []
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
          b.city?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      // Note: physical_address is no longer available in the public directory
      // for privacy reasons - only general city/state location is shown

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
    if (category === 'all') return 'All Categories';
    return formatCategoryUtil(category);
  };

  // Get available cities for selected state
  const getAvailableCities = () => {
    try {
      if (selectedState === 'all' || !STATE_CITIES) return [];
      const cities = STATE_CITIES[selectedState] || [];
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
      if (selectedCity === 'all' || !CITY_NEIGHBORHOODS) return [];
      const neighborhoods = CITY_NEIGHBORHOODS[selectedCity] || [];
      console.log('Available neighborhoods for', selectedCity, ':', neighborhoods);
      return neighborhoods;
    } catch (error) {
      console.error('Error getting neighborhoods:', error);
      return [];
    }
  };

  // Get all locations for search
  const getAllLocations = () => {
    const locations: string[] = [];
    try {
      // Add all states
      locations.push(...NIGERIAN_STATES);
      
      // Add all cities
      Object.values(STATE_CITIES).forEach(cities => {
        locations.push(...cities);
      });
      
      // Add all neighborhoods
      Object.values(CITY_NEIGHBORHOODS).forEach(neighborhoods => {
        locations.push(...neighborhoods);
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
    <div className="space-y-4 md:space-y-6">
      {/* Search and Filters */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 md:h-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:flex-1 lg:w-[180px] h-12 md:h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md">
                {businessCategories.map((category) => (
                  <SelectItem key={category} value={category} className="py-3 md:py-2">
                    {category === 'all' ? 'All Categories' : formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          
          {/* Enhanced Location Search - Simplified Version */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={locationOpen}
                className="w-full sm:flex-1 lg:w-[250px] justify-between h-12 md:h-10"
              >
                <span className="truncate">
                  {selectedNeighborhood !== 'all' 
                    ? selectedNeighborhood
                    : selectedCity !== 'all' 
                    ? selectedCity
                    : selectedState !== 'all' 
                    ? selectedState
                    : "Select location..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] sm:w-[320px] p-0 bg-background border shadow-md">
              <div className="p-3">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchLocation || ''}
                  onChange={(e) => setSearchLocation(e.target.value || '')}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              
              <ScrollArea className="h-[280px] md:h-[300px]">
                <div className="p-2 space-y-2">
                  {/* Quick Reset */}
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Quick Reset</div>
                    <button
                      onClick={() => {
                        setSelectedState('all');
                        setSelectedCity('all');
                        setSelectedNeighborhood('all');
                        setLocationOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Check className={`mr-2 h-4 w-4 ${selectedState === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                      All Locations
                    </button>
                  </div>

                  {/* States */}
                  {(() => {
                    try {
                      const states = NIGERIAN_STATES.filter(state => 
                        state.toLowerCase().includes((searchLocation || '').toLowerCase())
                      );
                      
                      return states.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">States</div>
                          {states.map((state) => (
                            <button
                              key={state}
                              onClick={() => {
                                handleStateChange(state);
                                setLocationOpen(false);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedState === state ? 'opacity-100' : 'opacity-0'}`} />
                              <span className="truncate">{state}</span>
                            </button>
                          ))}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering states:', error);
                      return null;
                    }
                  })()}

                  {/* Cities for selected state */}
                  {(() => {
                    try {
                      const cities = selectedState !== 'all' ? (getAvailableCities() || []).filter(city => 
                        city && typeof city === 'string' && 
                        city.toLowerCase().includes((searchLocation || '').toLowerCase())
                      ) : [];
                      
                      return cities.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Cities in {selectedState}</div>
                          {cities.map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                handleCityChange(city);
                                setLocationOpen(false);
                              }}
                              className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedCity === city ? 'opacity-100' : 'opacity-0'}`} />
                              {city}
                            </button>
                          ))}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering cities:', error);
                      return null;
                    }
                  })()}

                  {/* Neighborhoods for selected city */}
                  {(() => {
                    try {
                      const neighborhoods = selectedCity !== 'all' ? (getAvailableNeighborhoods() || []).filter(neighborhood => 
                        neighborhood && typeof neighborhood === 'string' && 
                        neighborhood.toLowerCase().includes((searchLocation || '').toLowerCase())
                      ) : [];
                      
                      return neighborhoods.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Areas in {selectedCity}</div>
                          {neighborhoods.map((neighborhood) => (
                            <button
                              key={neighborhood}
                              onClick={() => {
                                setSelectedNeighborhood(neighborhood);
                                setLocationOpen(false);
                              }}
                              className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedNeighborhood === neighborhood ? 'opacity-100' : 'opacity-0'}`} />
                              {neighborhood}
                            </button>
                          ))}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering neighborhoods:', error);
                      return null;
                    }
                  })()}

                  {/* Search all locations */}
                  {(() => {
                    try {
                      const searchResults = searchLocation ? (getAllLocations() || [])
                        .filter(location => 
                          location && 
                          typeof location === 'string' && 
                          location.toLowerCase().includes((searchLocation || '').toLowerCase()) &&
                          !NIGERIAN_STATES.includes(location)
                        )
                        .slice(0, 10) : [];
                      
                      return searchResults.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Search Results</div>
                          {searchResults.map((location) => (
                            <button
                              key={location}
                              onClick={() => {
                                try {
                                  // Find which state/city this belongs to
                                  const foundState = NIGERIAN_STATES.find(state => {
                                    if (state === location) return true;
                                    const cities = STATE_CITIES[state] || [];
                                    if (cities.includes(location)) return true;
                                    return cities.some(city => {
                                      const neighborhoods = CITY_NEIGHBORHOODS[city] || [];
                                      return neighborhoods.includes(location);
                                    });
                                  });
                                  
                                  if (foundState) {
                                    const cities = STATE_CITIES[foundState] || [];
                                    const foundCity = cities.find(city => {
                                      if (city === location) return true;
                                      const neighborhoods = CITY_NEIGHBORHOODS[city] || [];
                                      return neighborhoods.includes(location);
                                    });
                                    
                                    if (foundCity) {
                                      const neighborhoods = CITY_NEIGHBORHOODS[foundCity] || [];
                                      if (neighborhoods.includes(location)) {
                                        setSelectedState(foundState);
                                        setSelectedCity(foundCity);
                                        setSelectedNeighborhood(location);
                                      } else {
                                        setSelectedState(foundState);
                                        setSelectedCity(location);
                                        setSelectedNeighborhood('all');
                                      }
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error selecting location:', error);
                                }
                                setLocationOpen(false);
                              }}
                              className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering search results:', error);
                      return null;
                    }
                  })()}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        </div>

        {/* Register Business CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-base md:text-lg">Own a business?</h3>
                <p className="text-sm md:text-base text-muted-foreground">Register your business and reach more customers in your community</p>
              </div>
              <BusinessRegistrationDialog onBusinessRegistered={fetchBusinesses}>
                <Button className="flex items-center gap-2 h-12 lg:h-10 w-full lg:w-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                    <AvatarImage src={business.logo_url || business.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs md:text-sm">
                      {getBusinessInitials(business.business_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm md:text-base truncate">{business.business_name}</CardTitle>
                      {business.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {formatCategory(business.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {business.description}
                </p>

                <div className="text-xs md:text-sm">
                  {renderStars(business.rating)}
                </div>

                {(business.city || business.state) && (
                  <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">{business.city}{business.city && business.state && ', '}{business.state}</span>
                  </div>
                )}

                {business.operating_hours && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>View Hours</span>
                  </div>
                )}

                {/* Action buttons - Contact info available to authenticated users only */}
                <div className="flex gap-2 pt-2">
                  {user ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-10 text-xs md:text-sm"
                        onClick={async () => {
                          // Load contact info on-demand for authenticated users
                          try {
                            const { data } = await supabase.rpc('get_business_contact_info', { business_id: business.id });
                            if (data && data[0]?.phone) {
                              window.location.href = `tel:${data[0].phone}`;
                            } else {
                              toast({
                                title: "Contact unavailable",
                                description: "Phone number not available for this business",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Could not load contact information",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-10 text-xs md:text-sm"
                        onClick={async () => {
                          try {
                            const { data } = await supabase.rpc('get_business_contact_info', { business_id: business.id });
                            if (data && data[0]?.email) {
                              window.location.href = `mailto:${data[0].email}`;
                            } else {
                              toast({
                                title: "Contact unavailable",
                                description: "Email address not available for this business",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Could not load contact information",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Email
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Log in to view contact information
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground pt-1">
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