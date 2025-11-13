import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Plus,
  Users,
  ShoppingBag,
  Wrench,
  GraduationCap,
  Heart,
  Zap,
  Car,
  Home,
  Camera,
  Gamepad2,
  Calendar,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BookServiceDialog from './BookServiceDialog';
import { ImageGalleryDialog } from './ImageGalleryDialog';
import MarketplaceMessageDialog from './MarketplaceMessageDialog';
import { ProductDialog } from './ProductDialog';
import CreateMarketplaceItemDialog from './CreateMarketplaceItemDialog';
import CreateServiceDialog from './CreateServiceDialog';
import { MarketplaceFilterDialog } from './marketplace/MarketplaceFilterDialog';
import { AdDisplay } from '@/components/advertising/display/AdDisplay';


interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number;
  price_max: number;
  price_type: string;
  location: string;
  images: string[];
  rating: number;
  total_reviews: number;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    city?: string | null;
    state?: string | null;
  } | null;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  is_negotiable: boolean;
  condition: string;
  location: string;
  images: string[];
  status: string;
  user_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
    city?: string | null;
    state?: string | null;
  } | null;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

const Marketplace = ({ activeSubTab = 'services', locationScope = 'neighborhood' }: { activeSubTab?: 'services' | 'goods'; locationScope?: 'neighborhood' | 'state' }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: ['all'],
    priceRange: [] as string[],
    rating: [] as string[],
    condition: [] as string[],
    availability: [] as string[],
    negotiable: [] as string[],
  });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceItem | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const handleServiceBooked = () => {
    // Refresh services after booking
    fetchServices();
  };

  const serviceCategories = [
    { value: 'all', label: 'All Services', icon: Users },
    { value: 'home_repair', label: 'Home Repair', icon: Wrench },
    { value: 'tutoring', label: 'Tutoring', icon: GraduationCap },
    { value: 'nanny', label: 'Nanny', icon: Heart },
    { value: 'cleaning', label: 'Cleaning', icon: Home },
    { value: 'tech_support', label: 'Tech Support', icon: Zap },
    { value: 'transport', label: 'Transport', icon: Car },
  ];

  const itemCategories = [
    { value: 'all', label: 'All Items', icon: ShoppingBag },
    { value: 'electronics', label: 'Electronics', icon: Zap },
    { value: 'furniture', label: 'Furniture', icon: Home },
    { value: 'vehicles', label: 'Vehicles', icon: Car },
    { value: 'toys', label: 'Toys & Games', icon: Gamepad2 },
    { value: 'sports', label: 'Sports', icon: Camera },
  ];

  useEffect(() => {
    const category = filters.category[0] || 'all';
    setSelectedCategory(category);
    
    if (activeSubTab === 'services') {
      fetchServices();
    } else {
      fetchItems();
    }
  }, [filters, searchTerm, activeSubTab, locationScope]);


  // Handle URL parameter for specific item
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      setHighlightedItemId(itemId);
      
      // Clear the URL parameter after a short delay to clean up URL
      setTimeout(() => {
        setHighlightedItemId(null);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('item');
        setSearchParams(newSearchParams, { replace: true });
      }, 3000);
      
      // Scroll to the item after data loads
      setTimeout(() => {
        const element = document.getElementById(`item-${itemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [searchParams, setSearchParams]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      // Only show services created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user's profile for location filtering
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('city, state')
        .eq('user_id', user?.id || '')
        .single();

      // Fetch profiles and likes data for each service
      const servicesWithProfilesAndLikes = await Promise.all(
        (data || []).map(async (service) => {
          const [profileResult, likesResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, avatar_url, city, state')
              .eq('user_id', service.user_id)
              .single(),
            supabase
              .from('service_likes')
              .select('user_id')
              .eq('service_id', service.id)
          ]);

          const likes = likesResult.data || [];
          const isLikedByUser = user ? likes.some(like => like.user_id === user.id) : false;

          return {
            ...service,
            profiles: profileResult.data || { full_name: 'Anonymous', avatar_url: '', city: null, state: null },
            likes_count: likes.length,
            is_liked_by_user: isLikedByUser
          };
        })
      );

      // Filter services by user's location based on view scope
      const filteredServices = servicesWithProfilesAndLikes.filter(service => {
        if (!currentUserProfile?.state || !service.profiles) return true; // Show all if no filter data
        
        if (locationScope === 'state') {
      // For entire state view, show services from the same state only
          const serviceState = service.profiles.state?.trim().toLowerCase();
          const userState = currentUserProfile.state?.trim().toLowerCase();
          console.log('State filtering service:', { serviceState, userState, match: serviceState === userState });
          return serviceState === userState;
        } else {
          // For neighborhood view, show services from same city and state
          const serviceCity = service.profiles.city?.trim().toLowerCase();
          const userCity = currentUserProfile.city?.trim().toLowerCase();
          const serviceState = service.profiles.state?.trim().toLowerCase();
          const userState = currentUserProfile.state?.trim().toLowerCase();
          const sameCity = serviceCity === userCity;
          const sameState = serviceState === userState;
          console.log('Neighborhood filtering service:', { serviceCity, userCity, serviceState, userState, sameCity, sameState });
          return sameCity && sameState;
        }
      });

      setServices(filteredServices as any || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Get user's creation date for clean slate filtering
      const { data: userData } = await supabase.auth.getUser();
      const userCreatedAt = userData.user?.created_at;

      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'active');

      // Only show items created after user joined (clean slate)
      if (userCreatedAt) {
        query = query.gte('created_at', userCreatedAt);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user's profile for location filtering
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('city, state')
        .eq('user_id', user?.id || '')
        .single();

      // Fetch profiles and likes data for each item
      const itemsWithProfilesAndLikes = await Promise.all(
        (data || []).map(async (item) => {
          const [profileResult, likesResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url, phone, email, city, state')
              .eq('user_id', item.user_id)
              .single(),
            supabase
              .from('marketplace_item_likes')
              .select('user_id')
              .eq('item_id', item.id)
          ]);

          const likes = likesResult.data || [];
          const isLikedByUser = user ? likes.some(like => like.user_id === user.id) : false;

          return {
            ...item,
            profiles: profileResult.data || { user_id: item.user_id, full_name: 'Anonymous', avatar_url: '', city: null, state: null },
            likes_count: likes.length,
            is_liked_by_user: isLikedByUser
          };
        })
      );

      // Filter items by user's location based on view scope
      const filteredItems = itemsWithProfilesAndLikes.filter(item => {
      if (!currentUserProfile?.state || !item.profiles) return true; // Show all if no filter data
        
        if (locationScope === 'state') {
      // For entire state view, show items from the same state only
          const itemState = item.profiles.state?.trim().toLowerCase();
          const userState = currentUserProfile.state?.trim().toLowerCase();
          console.log('State filtering item:', { itemState, userState, match: itemState === userState });
          return itemState === userState;
        } else {
          // For neighborhood view, show items from same city and state
          const itemCity = item.profiles.city?.trim().toLowerCase();
          const userCity = currentUserProfile.city?.trim().toLowerCase();
          const itemState = item.profiles.state?.trim().toLowerCase();
          const userState = currentUserProfile.state?.trim().toLowerCase();
          const sameCity = itemCity === userCity;
          const sameState = itemState === userState;
          console.log('Neighborhood filtering item:', { itemCity, userCity, itemState, userState, sameCity, sameState });
          return sameCity && sameState;
        }
      });

      setItems(filteredItems as any || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates for marketplace items likes
  useEffect(() => {
    const channel = supabase
      .channel('marketplace_likes_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_item_likes'
        },
        async (payload) => {
          // Refetch items to update like counts in real-time
          if (activeSubTab === 'goods') {
            fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSubTab]);

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const getCategoryIcon = (category: string, type: 'services' | 'goods') => {
    const categories = type === 'services' ? serviceCategories : itemCategories;
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData?.icon || Users;
  };

  const currentCategories = activeSubTab === 'services' ? serviceCategories : itemCategories;
  const currentItems = activeSubTab === 'services' ? services : items;


  const handleImageClick = (images: string[], title: string) => {
    setSelectedImages(images);
    setGalleryTitle(title);
    setGalleryOpen(true);
  };

  const toggleLike = async (itemId: string, isService: boolean) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like items.",
        variant: "destructive",
      });
      return;
    }

    try {
      const table = isService ? 'service_likes' : 'marketplace_item_likes';
      const column = isService ? 'service_id' : 'item_id';
      const currentItem = isService 
        ? services.find(s => s.id === itemId)
        : items.find(i => i.id === itemId);

      if (!currentItem) return;

      if (currentItem.is_liked_by_user) {
        // Unlike the item
        if (isService) {
          const { error } = await supabase
            .from('service_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('service_id', itemId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('marketplace_item_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId);
          if (error) throw error;
        }

        // Update local state
        if (isService) {
          setServices(prev => prev.map(service => 
            service.id === itemId 
              ? { 
                  ...service, 
                  is_liked_by_user: false, 
                  likes_count: Math.max(0, (service.likes_count || 0) - 1) 
                }
              : service
          ));
        } else {
          setItems(prev => prev.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  is_liked_by_user: false, 
                  likes_count: Math.max(0, (item.likes_count || 0) - 1) 
                }
              : item
          ));
        }
      } else {
        // Like the item
        if (isService) {
          const { error } = await supabase
            .from('service_likes')
            .insert({
              user_id: user.id,
              service_id: itemId
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('marketplace_item_likes')
            .insert({
              user_id: user.id,
              item_id: itemId
            });
          if (error) throw error;
        }

        // Update local state
        if (isService) {
          setServices(prev => prev.map(service => 
            service.id === itemId 
              ? { 
                  ...service, 
                  is_liked_by_user: true, 
                  likes_count: (service.likes_count || 0) + 1 
                }
              : service
          ));
        } else {
          setItems(prev => prev.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  is_liked_by_user: true, 
                  likes_count: (item.likes_count || 0) + 1 
                }
              : item
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="hidden md:flex flex-col gap-4 lg:gap-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm md:text-base text-muted-foreground">Discover local services and goods in your neighborhood</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder={`Search ${activeSubTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <MarketplaceFilterDialog
          activeSubTab={activeSubTab}
          onFilterChange={setFilters}
          initialFilters={filters}
        />
        {activeSubTab === 'services' ? (
          <CreateServiceDialog
            onServiceCreated={() => fetchServices()}
            trigger={
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Listing</span>
                <span className="sm:hidden">Create</span>
              </Button>
            }
          />
        ) : (
          <CreateMarketplaceItemDialog
            onItemCreated={() => fetchItems()}
            trigger={
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Listing</span>
                <span className="sm:hidden">Create</span>
              </Button>
            }
          />
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-40 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Marketplace Sponsored Ads */}
          {currentItems.length > 0 && (
            <div className="mb-8">
              <AdDisplay 
                placement="inline"
                maxAds={2}
                filterType={activeSubTab === 'services' ? 'service_ad' : 'marketplace_ad'}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <Card 
              key={item.id} 
              id={`item-${item.id}`}
              className={`group hover:shadow-lg transition-all cursor-pointer ${
                highlightedItemId === item.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={() => {
                if (activeSubTab === 'goods') {
                  setSelectedProduct(item as MarketplaceItem);
                  setProductDialogOpen(true);
                }
              }}
            >
               <CardContent className="p-0">
                  {/* Image Carousel */}
                  <div 
                    className="relative h-48 bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                    onClick={() => item.images && item.images.length > 0 && handleImageClick(item.images, item.title)}
                  >
                   {item.images && item.images.length > 0 ? (
                     <Carousel className="w-full h-full">
                       <CarouselContent className="h-full">
                         {item.images.map((imageUrl, index) => (
                           <CarouselItem key={index} className="h-full">
                             <img
                               src={imageUrl}
                               alt={`${item.title} ${index + 1}`}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                             />
                           </CarouselItem>
                         ))}
                       </CarouselContent>
                       {item.images.length > 1 && (
                         <>
                           <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 hover:bg-white border-0 shadow-md" />
                           <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 hover:bg-white border-0 shadow-md" />
                         </>
                       )}
                       {/* Image indicator dots */}
                       {item.images.length > 1 && (
                         <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                           {item.images.map((_, index) => (
                             <div
                               key={index}
                               className="w-2 h-2 rounded-full bg-white/60"
                             />
                           ))}
                         </div>
                       )}
                     </Carousel>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        {activeSubTab === 'services' ? (
                          <Users className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    )}
                   
                   {/* Category badge */}
                   <div className="absolute top-2 right-2">
                     <Badge variant="secondary" className="bg-white/90 text-green-600 hover:text-white">
                       {getCategoryIcon(item.category, activeSubTab) && (
                         React.createElement(getCategoryIcon(item.category, activeSubTab), {
                           className: "h-3 w-3 mr-1"
                         })
                       )}
                       {item.category.replace('_', ' ')}
                     </Badge>
                   </div>
                   
                   {/* Image count badge */}
                   {item.images && item.images.length > 1 && (
                     <div className="absolute top-2 left-2">
                       <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                         <Camera className="h-3 w-3 mr-1" />
                         {item.images.length}
                       </Badge>
                     </div>
                   )}
                 </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.description}</p>

                   {/* Price and Rating/Condition */}
                   <div className="flex items-center justify-between mb-3">
                     <div className="text-lg font-bold text-primary">
                       {activeSubTab === 'services' ? (
                        <>
                          {formatPrice((item as Service).price_min)} - {formatPrice((item as Service).price_max)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{(item as Service).price_type}
                          </span>
                        </>
                      ) : (
                        <>
                          {formatPrice((item as MarketplaceItem).price)}
                          {(item as MarketplaceItem).is_negotiable && (
                            <span className="text-sm font-normal text-muted-foreground"> (negotiable)</span>
                          )}
                        </>
                       )}
                     </div>
                     {activeSubTab === 'services' ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{(item as Service).rating || 'New'}</span>
                        <span className="text-sm text-muted-foreground">
                          ({(item as Service).total_reviews})
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {(item as MarketplaceItem).condition}
                      </Badge>
                    )}
                  </div>

                  {/* Provider Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OnlineAvatar
                        userId={item.user_id}
                        src={item.profiles?.avatar_url}
                        fallback={item.profiles?.full_name?.charAt(0) || 'U'}
                        size="sm"
                      />
                      <span className="text-sm text-muted-foreground">{item.profiles?.full_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  </div>

                   {/* Action Buttons */}
                   <div className="flex gap-2 mt-4">
                     {activeSubTab === 'services' ? (
                      user?.id !== item.user_id ? (
                        <BookServiceDialog 
                          service={{
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            price_min: item.price_min,
                            price_max: item.price_max,
                            user_id: item.user_id,
                            location: item.location
                          }} 
                          onBookingCreated={handleServiceBooked}
                        >
                          <Button className="flex-1 h-8 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Book Now
                          </Button>
                        </BookServiceDialog>
                      ) : (
                        <Button variant="outline" className="flex-1 h-8 text-xs" disabled>
                          Your Service
                        </Button>
                      )
                      ) : (
                       user?.id !== item.user_id ? (
                         <MarketplaceMessageDialog 
                           item={{
                             id: item.id,
                             title: item.title,
                             description: item.description,
                             price: (item as MarketplaceItem).price,
                             is_negotiable: (item as MarketplaceItem).is_negotiable,
                             condition: (item as MarketplaceItem).condition,
                             user_id: item.user_id,
                             images: item.images
                           }}
                         >
                           <Button className="flex-1 h-8 text-xs">
                             <MessageSquare className="h-3 w-3 mr-1" />
                             Message
                           </Button>
                         </MarketplaceMessageDialog>
                       ) : (
                         <Button variant="outline" className="flex-1 h-8 text-xs" disabled>
                           Your Item
                         </Button>
                       )
                     )}
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className={`h-8 px-2 ${item.is_liked_by_user ? 'text-red-500' : ''}`}
                       onClick={() => toggleLike(item.id, activeSubTab === 'services')}
                     >
                       <Heart className={`h-3 w-3 ${item.is_liked_by_user ? 'fill-current' : ''}`} />
                       {(item.likes_count || 0) > 0 && (
                         <span className="ml-1 text-xs">{item.likes_count}</span>
                       )}
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Empty State */}
       {!loading && currentItems.length === 0 && (
        <div className="text-center py-12">
          <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            {activeSubTab === 'services' ? (
              <Users className="h-12 w-12 text-muted-foreground" />
            ) : (
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">No {activeSubTab} found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? `Try adjusting your search or filters`
              : `Be the first to list a ${activeSubTab.slice(0, -1)} in your area`}
          </p>
          {activeSubTab === 'services' ? (
            <CreateServiceDialog
              onServiceCreated={() => fetchServices()}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              }
            />
          ) : (
            <CreateMarketplaceItemDialog
              onItemCreated={() => fetchItems()}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              }
            />
          )}
         </div>
       )}

        {/* Image Gallery Dialog */}
        <ImageGalleryDialog
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={selectedImages}
          title={galleryTitle}
        />

        {/* Product Dialog */}
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          product={selectedProduct}
        />
     </div>
   );
};

export default Marketplace;