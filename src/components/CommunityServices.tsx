import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinIcon, StarIcon, ChatBubbleLeftIcon, MagnifyingGlassIcon, FunnelIcon, WrenchScrewdriverIcon, CubeIcon } from '@heroicons/react/24/outline';
import { formatTimeAgo } from '@/lib/utils';
import BookServiceDialog from './BookServiceDialog';
import RatingDialog from './RatingDialog';
import MarketplaceInquiryDialog from './MarketplaceInquiryDialog';
import CommentSection from './CommentSection';

interface CommunityService {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number | null;
  price_max: number | null;
  price_type: string | null;
  location: string | null;
  is_active: boolean;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  user_id: string;
  images: string[];
  profiles: {
    full_name: string;
    avatar_url: string;
    city: string;
    state: string;
    neighborhood: string;
  };
}

interface CommunityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  is_negotiable: boolean;
  condition: string;
  location: string | null;
  images: string[];
  status: string;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    city: string;
    state: string;
    neighborhood: string;
  };
}

const CommunityServices = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [services, setServices] = useState<CommunityService[]>([]);
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('services');

  const serviceCategories = [
    'cleaning', 'tutoring', 'handyman', 'beauty', 'fitness', 'tech_support',
    'pet_care', 'gardening', 'catering', 'photography', 'transportation', 'other'
  ];

  const itemCategories = [
    'electronics', 'clothing', 'home_garden', 'books', 'sports', 'vehicles',
    'furniture', 'toys', 'health_beauty', 'collectibles', 'other'
  ];

  const fetchCommunityServices = async () => {
    if (!user || !profile) return;

    try {
      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('services')
        .select(`
          *,
          profiles(full_name, avatar_url, city, state, neighborhood)
        `)
        .eq('is_active', true as any)
        .neq('user_id', user.id as any);

      // Only show services created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt as any);
      }

      // Apply location filter based on user's profile
      if (locationFilter === 'neighborhood' && profile.neighborhood) {
        query = query.eq('profiles.neighborhood', profile.neighborhood as any);
      } else if (locationFilter === 'city' && profile.city) {
        query = query.eq('profiles.city', profile.city as any);
      } else if (locationFilter === 'state' && profile.state) {
        query = query.eq('profiles.state', profile.state as any);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setServices((data as any) || []);
    } catch (error) {
      console.error('Error fetching community services:', error);
      toast({
        title: "Error",
        description: "Failed to load community services",
        variant: "destructive",
      });
    }
  };

  const fetchCommunityItems = async () => {
    if (!user || !profile) return;

    try {
      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles(full_name, avatar_url, city, state, neighborhood)
        `)
        .eq('status', 'active' as any)
        .neq('user_id', user.id as any);

      // Only show items created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt as any);
      }

      // Apply location filter based on user's profile
      if (locationFilter === 'neighborhood' && profile.neighborhood) {
        query = query.eq('profiles.neighborhood', profile.neighborhood as any);
      } else if (locationFilter === 'city' && profile.city) {
        query = query.eq('profiles.city', profile.city as any);
      } else if (locationFilter === 'state' && profile.state) {
        query = query.eq('profiles.state', profile.state as any);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setItems((data as any) || []);
    } catch (error) {
      console.error('Error fetching community items:', error);
      toast({
        title: "Error",
        description: "Failed to load community items",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCommunityServices(), fetchCommunityItems()]);
      setLoading(false);
    };

    if (profile) {
      loadData();
    }
  }, [user, profile, selectedCategory, locationFilter]);

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services and goods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 md:h-10"
          />
        </div>
        
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:flex-1 h-12 md:h-10">
              <FunnelIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              <SelectItem value="all">All Categories</SelectItem>
              {(activeTab === 'services' ? serviceCategories : itemCategories).map((category) => (
                <SelectItem key={category} value={category} className="py-3">
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:flex-1 h-12 md:h-10">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              <SelectItem value="all" className="py-3">All Locations</SelectItem>
              <SelectItem value="neighborhood" className="py-3">My Neighborhood</SelectItem>
              <SelectItem value="city" className="py-3">My City</SelectItem>
              <SelectItem value="state" className="py-3">My State</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop tabs */}
        <TabsList className="hidden md:flex mb-4">
          <TabsTrigger value="services">Services ({filteredServices.length})</TabsTrigger>
          <TabsTrigger value="goods">Goods ({filteredItems.length})</TabsTrigger>
        </TabsList>
        
        {/* Mobile tabs */}
        <TabsList className="md:hidden flex mb-4">
          <TabsTrigger value="services">
            <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
            Services ({filteredServices.length})
          </TabsTrigger>
          <TabsTrigger value="goods">
            <CubeIcon className="h-4 w-4 mr-2" />
            Goods ({filteredItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No services found{locationFilter !== 'all' ? ` in your ${locationFilter}` : ''}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 md:pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12">
                          <AvatarImage src={service.profiles.avatar_url} />
                          <AvatarFallback>
                            {service.profiles.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg break-words">{service.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {service.profiles.full_name}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {service.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            {service.rating && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Star className="h-3 w-3 fill-current" />
                                {service.rating.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <Button variant="outline" size="sm" className="h-10 text-sm" onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Direct messaging will be available soon",
                          });
                        }}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <BookServiceDialog 
                          service={{
                            id: service.id,
                            title: service.title,
                            description: service.description,
                            price_min: service.price_min,
                            price_max: service.price_max,
                            user_id: service.user_id,
                            location: service.location
                          }}
                          onBookingCreated={fetchCommunityServices}
                        >
                          <Button size="sm" className="h-10 text-sm">Book Service</Button>
                        </BookServiceDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 break-words">{service.description}</p>
                    
                    {/* Service Gallery */}
                    {service.images && service.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {service.images.slice(0, 3).map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${service.title} gallery ${index + 1}`}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded flex-shrink-0"
                          />
                        ))}
                        {service.images.length > 3 && (
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                            +{service.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        {service.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words">{service.location}</span>
                          </div>
                        )}
                        
                        {(service.price_min || service.price_max) && (
                          <div className="text-base md:text-lg font-semibold">
                            ₦{service.price_min || 0} - ₦{service.price_max || 0}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{service.price_type || 'hourly'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground self-start sm:self-center">
                        {formatTimeAgo(service.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goods" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No items found{locationFilter !== 'all' ? ` in your ${locationFilter}` : ''}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 md:pb-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12">
                          <AvatarImage src={item.profiles.avatar_url} />
                          <AvatarFallback>
                            {item.profiles.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg break-words">{item.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            by {item.profiles.full_name}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            {item.is_negotiable && (
                              <Badge variant="outline" className="text-xs">
                                Negotiable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <Button variant="outline" size="sm" onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Direct messaging will be available soon",
                          });
                        }}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <MarketplaceInquiryDialog
                          item={{
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            price: item.price,
                            is_negotiable: item.is_negotiable,
                            user_id: item.user_id
                          }}
                          onInquiryCreated={fetchCommunityItems}
                        >
                          <Button size="sm">Contact Seller</Button>
                        </MarketplaceInquiryDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    
                    {/* Item Gallery */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {item.images.slice(0, 3).map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${item.title} gallery ${index + 1}`}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                          />
                        ))}
                        {item.images.length > 3 && (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                            +{item.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {item.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4" />
                            {item.location}
                          </div>
                        )}
                        
                        <div className="text-xl font-bold text-primary">
                          ₦{item.price?.toLocaleString()}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityServices;