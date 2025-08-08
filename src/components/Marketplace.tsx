import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BookServiceDialog from './BookServiceDialog';
import { ImageGalleryDialog } from './ImageGalleryDialog';
import MarketplaceMessageDialog from './MarketplaceMessageDialog';
import { ProductDialog } from './ProductDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  } | null;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

const Marketplace = ({ activeSubTab }: { activeSubTab?: 'services' | 'goods' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'services' | 'goods'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewScope, setViewScope] = useState<'neighborhood' | 'state'>('neighborhood');
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceItem | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  // Sync sub-selection from parent
  useEffect(() => {
    if (activeSubTab && activeSubTab !== activeTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

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
    if (activeTab === 'services') {
      fetchServices();
    } else {
      fetchItems();
    }
  }, [activeTab, selectedCategory, searchTerm, viewScope]);


  // Handle URL parameter for specific item
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      setHighlightedItemId(itemId);
      setActiveTab('goods'); // Switch to goods tab when item is specified
      
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
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

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
        
        if (viewScope === 'state') {
          // For entire state view, show services from the same state only
          return service.profiles.state?.trim().toLowerCase() === currentUserProfile.state?.trim().toLowerCase();
        } else {
          // For neighborhood view, show services from same city and state
          const sameCity = service.profiles.city?.trim().toLowerCase() === currentUserProfile.city?.trim().toLowerCase();
          const sameState = service.profiles.state?.trim().toLowerCase() === currentUserProfile.state?.trim().toLowerCase();
          return sameCity && sameState && currentUserProfile.city;
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
      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'active');

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
        
        if (viewScope === 'state') {
          // For entire state view, show items from the same state only
          return item.profiles.state?.trim().toLowerCase() === currentUserProfile.state?.trim().toLowerCase();
        } else {
          // For neighborhood view, show items from same city and state
          const sameCity = item.profiles.city?.trim().toLowerCase() === currentUserProfile.city?.trim().toLowerCase();
          const sameState = item.profiles.state?.trim().toLowerCase() === currentUserProfile.state?.trim().toLowerCase();
          return sameCity && sameState && currentUserProfile.city;
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
          if (activeTab === 'goods') {
            fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  const getCategoryIcon = (category: string, type: 'services' | 'goods') => {
    const categories = type === 'services' ? serviceCategories : itemCategories;
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData?.icon || Users;
  };

  const currentCategories = activeTab === 'services' ? serviceCategories : itemCategories;
  const currentItems = activeTab === 'services' ? services : items;


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
      <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marketplace</h1>
          <p className="text-sm md:text-base text-muted-foreground">Discover local services and goods in your neighborhood</p>
        </div>
        <Button className="flex items-center gap-2 h-12 lg:h-10 w-full lg:w-auto">
          <Plus className="h-4 w-4" />
          Create Listing
        </Button>
      </div>

      {/* Services/Goods selection controlled from parent dropdown on page header */}
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 md:h-10 w-full"
            />
          </div>
          <ToggleGroup type="single" value={viewScope} onValueChange={(v) => v && setViewScope(v as 'neighborhood' | 'state')} className="w-full sm:w-auto">
            <ToggleGroupItem value="neighborhood" className="h-10 text-sm">My City</ToggleGroupItem>
            <ToggleGroupItem value="state" className="h-10 text-sm">Entire State</ToggleGroupItem>
          </ToggleGroup>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full h-12 md:h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              {currentCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value} className="py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2 h-12 md:h-10 w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">More Filters</span>
            <span className="sm:hidden">Filters</span>
          </Button>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {currentCategories.slice(1, 7).map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.value;
          return (
            <Card
              key={category.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedCategory(category.value)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">{category.label}</p>
              </CardContent>
            </Card>
          );
        })}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <Card 
              key={item.id} 
              id={`item-${item.id}`}
              className={`group hover:shadow-lg transition-all cursor-pointer ${
                highlightedItemId === item.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              }`}
              onClick={() => {
                if (activeTab === 'goods') {
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
                       {activeTab === 'services' ? (
                         <Users className="h-12 w-12 text-muted-foreground" />
                       ) : (
                         <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                       )}
                     </div>
                   )}
                   
                   {/* Category badge */}
                   <div className="absolute top-2 right-2">
                     <Badge variant="secondary" className="bg-white/90 text-green-600 hover:text-white">
                       {getCategoryIcon(item.category, activeTab) && (
                         React.createElement(getCategoryIcon(item.category, activeTab), {
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
                      {activeTab === 'services' ? (
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
                    {activeTab === 'services' ? (
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
                    {activeTab === 'services' ? (
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
                       onClick={() => toggleLike(item.id, activeTab === 'services')}
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
      )}

      {/* Empty State */}
      {!loading && currentItems.length === 0 && (
        <div className="text-center py-12">
          <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            {activeTab === 'services' ? (
              <Users className="h-12 w-12 text-muted-foreground" />
            ) : (
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">No {activeTab} found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? `Try adjusting your search or filters`
              : `Be the first to list a ${activeTab.slice(0, -1)} in your area`}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
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