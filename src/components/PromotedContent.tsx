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

interface PostContent {
  title: string;
  description: string;
  business_name?: string;
  business_category?: string;
  website_url?: string;
  contact_info?: string;
  call_to_action?: string;
  images?: string[];
}

interface PromotionData {
  id: string;
  campaign_id: string;
  post_type: string;
  post_content: any; // JSON type from database
  daily_budget: number;
  is_active: boolean;
  created_at: string;
  promotion_campaigns: {
    user_id: string;
    status: string;
  };
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
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
      const { data: promotionsData, error } = await supabase
        .from('promoted_posts')
        .select(`
          *,
          promotion_campaigns!inner (
            user_id,
            status
          )
        `)
        .eq('is_active', true)
        .eq('promotion_campaigns.status', 'active')
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      // Fetch profile data for each promotion
      const enrichedPromotions = await Promise.all(
        (promotionsData || []).map(async (promotion) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, neighborhood, city, state')
            .eq('user_id', promotion.promotion_campaigns.user_id)
            .single();
          
          return { ...promotion, profiles: profileData };
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

  const getPromotionPrice = (promotion: PromotionData) => {
    return `₦${promotion.daily_budget.toLocaleString()}/day`;
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {promotionType === 'banner' && (
        <div className="w-full">
          {promotions.slice(0, 1).map((promotion) => (
            <Card key={promotion.id} className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-primary">
                  {getPromotionIcon(promotionType)}
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
                    
                    <h3 className="text-xl font-bold mb-2">{promotion.post_content.title}</h3>
                    <p className="text-muted-foreground mb-4">{promotion.post_content.description}</p>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {getPromotionPrice(promotion)}
                      </Badge>
                      {promotion.post_content.business_category && (
                        <Badge variant="outline">{promotion.post_content.business_category}</Badge>
                      )}
                      <Button size="sm" className="ml-auto">
                        {promotion.post_content.call_to_action || 'Learn More'}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  {promotion.post_content.images && promotion.post_content.images.length > 0 && (
                    <div className="w-full md:w-48 h-32 md:h-40">
                      <img
                        src={promotion.post_content.images[0]}
                        alt={promotion.post_content.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {promotionType !== 'banner' && (
        <div className={`grid gap-4 ${
          promotionType === 'featured' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {promotions.map((promotion) => (
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
                  {getPromotionIcon(promotionType)}
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
                {promotion.post_content.images && promotion.post_content.images.length > 0 && (
                  <div className={`mb-3 ${promotionType === 'featured' ? 'h-48' : 'h-32'}`}>
                    <img
                      src={promotion.post_content.images[0]}
                      alt={promotion.post_content.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
                
                <h3 className={`font-semibold mb-2 ${promotionType === 'featured' ? 'text-lg' : 'text-sm'}`}>
                  {promotion.post_content.title}
                </h3>
                <p className={`text-muted-foreground mb-3 ${promotionType === 'featured' ? 'text-sm' : 'text-xs'} line-clamp-2`}>
                  {promotion.post_content.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getPromotionPrice(promotion)}
                    </Badge>
                    {promotion.post_content.business_category && (
                      <Badge variant="outline" className="text-xs">
                        {promotion.post_content.business_category}
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotedContent;