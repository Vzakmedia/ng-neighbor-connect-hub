import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ad } from '@/types/advertising';
import { ExternalLink, MapPin, Calendar, ShoppingBag, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdCardProps {
  ad: Ad;
  placement: 'feed' | 'sidebar' | 'banner' | 'inline';
  onAdClick: () => void;
}

export const AdCard = ({ ad, placement, onAdClick }: AdCardProps) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    onAdClick();
    
    // Navigate to URL if provided, otherwise navigate internally
    if (ad.ad_url) {
      if (ad.ad_url.startsWith('http')) {
        const { openUrl } = await import('@/utils/nativeBrowser');
        await openUrl(ad.ad_url, '_blank');
      } else {
        navigate(ad.ad_url);
      }
    } else {
      // Navigate based on campaign type
      switch (ad.campaign_type) {
        case 'service_ad':
          navigate('/services');
          break;
        case 'marketplace_ad':
          navigate('/marketplace');
          break;
        case 'business_promotion':
          navigate('/business');
          break;
        case 'event_promotion':
          navigate('/events');
          break;
        default:
          navigate('/community');
      }
    }
  };

  const getCampaignTypeIcon = () => {
    switch (ad.campaign_type) {
      case 'service_ad':
        return <Briefcase className="h-4 w-4" />;
      case 'marketplace_ad':
        return <ShoppingBag className="h-4 w-4" />;
      case 'event_promotion':
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCampaignTypeLabel = () => {
    switch (ad.campaign_type) {
      case 'business_promotion':
        return 'Business';
      case 'service_ad':
        return 'Service';
      case 'marketplace_ad':
        return 'Marketplace';
      case 'event_promotion':
        return 'Event';
      case 'community_boost':
        return 'Community';
      default:
        return 'Ad';
    }
  };

  // Compact layout for sidebar
  if (placement === 'sidebar') {
    return (
      <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs shrink-0">
            Sponsored
          </Badge>
        </div>
        
        {ad.ad_images && ad.ad_images[0] && (
          <img
            src={ad.ad_images[0]}
            alt={ad.ad_title}
            className="w-full h-24 object-cover rounded mt-2"
          />
        )}
        
        <h4 className="font-medium text-sm mt-2 line-clamp-2">{ad.ad_title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {ad.ad_description}
        </p>
        
        {ad.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{ad.location}</span>
          </div>
        )}
      </Card>
    );
  }

  // Banner layout
  if (placement === 'banner') {
    return (
      <Card className="flex-shrink-0 w-80 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
        <div className="relative">
          {ad.ad_images && ad.ad_images[0] && (
            <img
              src={ad.ad_images[0]}
              alt={ad.ad_title}
              className="w-full h-40 object-cover rounded-t"
            />
          )}
          <Badge className="absolute top-2 right-2" variant="secondary">
            Sponsored
          </Badge>
        </div>
        
        <div className="p-3">
          <h4 className="font-medium line-clamp-1">{ad.ad_title}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {ad.ad_description}
          </p>
        </div>
      </Card>
    );
  }

  // Full layout for feed and inline
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={handleClick}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <span className="mr-1">📢</span>
              Sponsored
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getCampaignTypeIcon()}
              <span className="ml-1">{getCampaignTypeLabel()}</span>
            </Badge>
          </div>
        </div>

        {ad.business_name && ad.business_logo && (
          <div className="flex items-center gap-2 mb-3">
            <img
              src={ad.business_logo}
              alt={ad.business_name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm">{ad.business_name}</p>
              {ad.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ad.location}
                </p>
              )}
            </div>
          </div>
        )}

        {ad.ad_images && ad.ad_images.length > 0 && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={ad.ad_images[0]}
              alt={ad.ad_title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <h3 className="text-lg font-semibold mb-2">{ad.ad_title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {ad.ad_description}
        </p>

        {(ad.service_price || ad.marketplace_price) && (
          <p className="text-lg font-bold text-primary mb-3">
            {ad.service_price || `₦${ad.marketplace_price?.toLocaleString()}`}
          </p>
        )}

        {ad.event_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span>{new Date(ad.event_date).toLocaleDateString()}</span>
          </div>
        )}

        {ad.location && !ad.business_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{ad.location}</span>
          </div>
        )}

        <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          {ad.ad_call_to_action || 'Learn More'}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
