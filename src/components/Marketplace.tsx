import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BookServiceDialog from './BookServiceDialog';
import { ImageGalleryDialog } from './ImageGalleryDialog';

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
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'services' | 'goods'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');

  const handleServiceBooked = () => {
    // Refresh services after booking
    fetchServices();
  };

  const serviceCategories = [
    { value: 'all', label: 'All Services', icon: Users },
    { value: 'home_repair', label: 'Home Repair', icon: Wrench },
    { value: 'tutoring', label: 'Tutoring', icon: GraduationCap },
    { value: 'pet_sitting', label: 'Pet Sitting', icon: Heart },
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
  }, [activeTab, selectedCategory, searchTerm]);

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

      // Fetch profiles separately for each service
      const servicesWithProfiles = await Promise.all(
        (data || []).map(async (service) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', service.user_id)
            .single();

          return {
            ...service,
            profiles: profile || { full_name: 'Anonymous', avatar_url: '' }
          };
        })
      );

      setServices(servicesWithProfiles as any || []);
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

      // Fetch profiles separately for each item
      const itemsWithProfiles = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', item.user_id)
            .single();

          return {
            ...item,
            profiles: profile || { full_name: 'Anonymous', avatar_url: '' }
          };
        })
      );

      setItems(itemsWithProfiles as any || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleMessageUser = async (sellerId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send a message to yourself.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${user.id})`)
        .single();

      if (existingConversation) {
        // Navigate to existing conversation
        navigate('/messages');
      } else {
        // Create new conversation
        const { error } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: user.id,
            user2_id: sellerId,
            last_message_at: new Date().toISOString(),
            user1_has_unread: false,
            user2_has_unread: false
          });

        if (error) {
          console.error('Error creating conversation:', error);
          toast({
            title: "Error",
            description: "Failed to start conversation. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Navigate to messages page
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error handling message user:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (images: string[], title: string) => {
    setSelectedImages(images);
    setGalleryTitle(title);
    setGalleryOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Discover local services and goods in your neighborhood</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Listing
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'services' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('services')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Services
        </Button>
        <Button
          variant={activeTab === 'goods' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('goods')}
          className="flex items-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          Goods
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {currentCategories.map((category) => {
              const Icon = category.icon;
              return (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
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
            <Card key={item.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
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
                     <Badge variant="secondary" className="bg-white/90">
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
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {item.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
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
                          service={item as Service} 
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
                         <Button 
                           className="flex-1 h-8 text-xs"
                           onClick={() => handleMessageUser(item.user_id)}
                         >
                           <MessageSquare className="h-3 w-3 mr-1" />
                           Message
                         </Button>
                       ) : (
                         <Button variant="outline" className="flex-1 h-8 text-xs" disabled>
                           Your Item
                         </Button>
                       )
                     )}
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Heart className="h-3 w-3" />
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
     </div>
   );
};

export default Marketplace;