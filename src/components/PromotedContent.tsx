import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin,
  Star,
  Zap,
  Crown,
  Megaphone,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PromotionData {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'service' | 'item';
  title: string;
  description: string;
  promotion_type: 'featured' | 'boost' | 'highlight' | 'banner';
  status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  services?: {
    title: string;
    description: string;
    price_min?: number;
    price_max?: number;
    price_type?: string;
    category: string;
    images: string[];
  } | null;
  marketplace_items?: {
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  } | null;
}

interface PromotedContentProps {
  promotionType: 'featured' | 'boost' | 'highlight' | 'banner';
  maxItems?: number;
}

const PromotedContent = ({ promotionType, maxItems = 3 }: PromotedContentProps) => {
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPromotions();
  }, [promotionType]);

  const fetchPromotions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('promotions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            neighborhood,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .eq('promotion_type', promotionType)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      const { data: promotionsData, error } = await query;

      if (error) throw error;

      // Fetch related service or marketplace item data
      const enrichedPromotions = await Promise.all(
        (promotionsData || []).map(async (promotion) => {
          if (promotion.item_type === 'service') {
            const { data: serviceData } = await supabase
              .from('services')
              .select('title, description, price_min, price_max, price_type, category, images')
              .eq('id', promotion.item_id)
              .single();
            
            return { ...promotion as any, services: serviceData };
          } else {
            const { data: itemData } = await supabase
              .from('marketplace_items')
              .select('title, description, price, category, images')
              .eq('id', promotion.item_id)
              .single();
            
            return { ...promotion as any, marketplace_items: itemData };
          }
        })
      );

      setPromotions(enrichedPromotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'featured':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'boost':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'highlight':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'banner':
        return <Megaphone className="h-4 w-4 text-orange-500" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getCardSize = (type: string) => {
    switch (type) {
      case 'banner':
        return 'col-span-full'; // Full width banner
      case 'featured':
        return 'col-span-2'; // Large featured card
      case 'boost':
        return 'col-span-1'; // Medium card
      case 'highlight':
        return 'col-span-1'; // Small highlighted card
      default:
        return 'col-span-1';
    }
  };

  const getItemData = (promotion: PromotionData) => {
    return promotion.item_type === 'service' 
      ? promotion.services 
      : promotion.marketplace_items;
  };

  const getItemPrice = (promotion: PromotionData, itemData: any) => {
    if (promotion.item_type === 'service') {
      const service = itemData as typeof promotion.services;
      if (service?.price_min && service?.price_max) {
        return `₦${service.price_min.toLocaleString()} - ₦${service.price_max.toLocaleString()}`;
      }
      return service?.price_min ? `₦${service.price_min.toLocaleString()}` : 'Contact for price';
    } else {
      const item = itemData as typeof promotion.marketplace_items;
      return item?.price ? `₦${item.price.toLocaleString()}` : 'Price on request';
    }
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {promotionType === 'banner' && (
        <div className="w-full">
          {promotions.slice(0, 1).map((promotion) => {
            const itemData = getItemData(promotion);
            if (!itemData) return null;

            return (
              <Card key={promotion.id} className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-primary">
                    {getPromotionIcon(promotion.promotion_type)}
                    <span className="ml-1">Promoted</span>
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarImage src={promotion.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {promotion.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{promotion.profiles?.full_name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {promotion.profiles?.neighborhood || promotion.profiles?.city}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{itemData.title}</h3>
                      <p className="text-muted-foreground mb-4">{itemData.description}</p>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {getItemPrice(promotion, itemData)}
                        </Badge>
                        <Badge variant="outline">{itemData.category}</Badge>
                        <Button size="sm" className="ml-auto">
                          View Details
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    
                    {itemData.images && itemData.images.length > 0 && (
                      <div className="w-full md:w-48 h-32 md:h-40">
                        <img
                          src={itemData.images[0]}
                          alt={itemData.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {promotionType !== 'banner' && (
        <div className={`grid gap-4 ${
          promotionType === 'featured' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {promotions.map((promotion) => {
            const itemData = getItemData(promotion);
            if (!itemData) return null;

            return (
              <Card 
                key={promotion.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  promotionType === 'featured' 
                    ? 'border-2 border-primary/30 bg-primary/5' 
                    : promotionType === 'highlight'
                    ? 'border-l-4 border-l-primary bg-primary/5'
                    : 'border-primary/20'
                }`}
              >
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="default" className="bg-primary text-xs">
                    {getPromotionIcon(promotion.promotion_type)}
                    <span className="ml-1">Promoted</span>
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className={promotionType === 'featured' ? 'h-10 w-10' : 'h-8 w-8'}>
                      <AvatarImage src={promotion.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {promotion.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className={`font-medium ${promotionType === 'featured' ? 'text-base' : 'text-sm'}`}>
                        {promotion.profiles?.full_name}
                      </h4>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {promotion.profiles?.neighborhood || promotion.profiles?.city}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {itemData.images && itemData.images.length > 0 && (
                    <div className={`mb-3 ${promotionType === 'featured' ? 'h-48' : 'h-32'}`}>
                      <img
                        src={itemData.images[0]}
                        alt={itemData.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <h3 className={`font-semibold mb-2 ${promotionType === 'featured' ? 'text-lg' : 'text-sm'}`}>
                    {itemData.title}
                  </h3>
                  <p className={`text-muted-foreground mb-3 ${promotionType === 'featured' ? 'text-sm' : 'text-xs'} line-clamp-2`}>
                    {itemData.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getItemPrice(promotion, itemData)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {itemData.category}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromotedContent;