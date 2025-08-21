import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  MapPin, 
  DollarSign, 
  Star, 
  Calendar,
  ShoppingCart,
  Briefcase,
  MessageSquare,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface Advertisement {
  campaign_id: string;
  campaign_type: string;
  ad_title: string;
  ad_description: string;
  ad_images: any;
  ad_url: string;
  ad_call_to_action: string;
  service_data?: any;
  marketplace_data?: any;
  business_data?: any;
  community_post_data?: any;
  event_data?: any;
  priority_level: number;
  daily_budget: number;
}

interface AdvertisementDisplayProps {
  maxAds?: number;
  className?: string;
  placement?: 'feed' | 'sidebar' | 'banner';
}

export const AdvertisementDisplay = ({ maxAds = 3, className = '', placement = 'feed' }: AdvertisementDisplayProps) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    // Only fetch advertisements when user is available
    // Profile can be null initially, which is fine
    if (user) {
      fetchAdvertisements();
    }
  }, [user, profile]);

  const fetchAdvertisements = async () => {
    try {
      console.log('AdvertisementDisplay: Fetching ads with profile:', profile);
      
      const { data, error } = await supabase.rpc('get_active_advertisements', {
        user_location: profile?.city || null,
        user_city: profile?.city || null,
        user_state: profile?.state || null,
        content_limit: maxAds
      });

      console.log('AdvertisementDisplay: API response:', { data, error });

      if (error) {
        console.error('AdvertisementDisplay: RPC error:', error);
        throw error;
      }
      setAdvertisements(data || []);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const logInteraction = async (campaignId: string, interactionType: 'impression' | 'click') => {
    try {
      await supabase.rpc('log_ad_interaction', {
        _campaign_id: campaignId,
        _interaction_type: interactionType,
        _user_id: user?.id || null,
        _user_location: profile?.city || null,
        _device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  const handleAdClick = async (ad: Advertisement) => {
    await logInteraction(ad.campaign_id, 'click');
    
    if (ad.ad_url) {
      window.open(ad.ad_url, '_blank');
    } else {
      // Handle internal content navigation
      switch (ad.campaign_type) {
        case 'service':
          // Navigate to service page
          break;
        case 'marketplace_item':
          // Navigate to marketplace item
          break;
        case 'business':
          // Navigate to business page
          break;
        case 'community_post':
          // Navigate to community post
          break;
        case 'event':
          // Navigate to event page
          break;
      }
    }
  };

  // Log impressions when ads are displayed
  useEffect(() => {
    advertisements.forEach(ad => {
      logInteraction(ad.campaign_id, 'impression');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advertisements]);

  const renderAdContent = (ad: Advertisement) => {
    const getTypeIcon = () => {
      // Determine icon by available linked content, not campaign_type string
      if (ad.service_data) return <Briefcase className="h-4 w-4" />;
      if (ad.marketplace_data) return <ShoppingCart className="h-4 w-4" />;
      if (ad.business_data) return <Building2 className="h-4 w-4" />;
      if (ad.community_post_data) return <MessageSquare className="h-4 w-4" />;
      if (ad.event_data) return <Calendar className="h-4 w-4" />;
      return null;
    };

    const getContentData = () => {
      // Prefer whichever linked content payload is present
      return (
        ad.service_data ??
        ad.marketplace_data ??
        ad.business_data ??
        ad.community_post_data ??
        ad.event_data ??
        null
      );
    };

    const contentData = getContentData();
    const title = ad.ad_title || contentData?.title || contentData?.name;
    const description = ad.ad_description || contentData?.description;
    const price = contentData?.price;
    const images = Array.isArray(ad.ad_images) && ad.ad_images.length > 0 ? ad.ad_images : (contentData?.images || []);
    const rating = contentData?.rating;

    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${placement === 'banner' ? 'bg-gradient-to-r from-primary/5 to-primary-glow/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                Sponsored
              </span>
            </Badge>
            {ad.priority_level > 1 && (
              <Badge variant="default" className="text-xs">
                Featured
              </Badge>
            )}
          </div>

          <div className={`flex gap-3 ${placement === 'banner' ? 'items-center' : 'flex-col sm:flex-row'}`}>
            {images.length > 0 && (
              <div className={`flex-shrink-0 ${placement === 'banner' ? 'w-16 h-16' : 'w-full sm:w-20 h-20'}`}>
                <img
                  src={images[0]}
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-foreground line-clamp-1 ${placement === 'banner' ? 'text-sm' : 'text-base'}`}>
                {title}
              </h3>
              
              {description && (
                <p className={`text-muted-foreground mt-1 ${placement === 'banner' ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`}>
                  {description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                {price && (
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    <DollarSign className="h-3 w-3" />
                    {typeof price === 'number' ? price.toFixed(2) : price}
                  </span>
                )}
                
                {rating && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {rating}
                  </span>
                )}
              </div>

              <Button
                size={placement === 'banner' ? 'sm' : 'default'}
                onClick={() => handleAdClick(ad)}
                className="mt-3 w-full sm:w-auto"
              >
                {ad.ad_call_to_action || 'Learn More'}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2 w-20"></div>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (advertisements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {advertisements.map((ad) => (
        <div key={ad.campaign_id}>
          {renderAdContent(ad)}
        </div>
      ))}
    </div>
  );
};