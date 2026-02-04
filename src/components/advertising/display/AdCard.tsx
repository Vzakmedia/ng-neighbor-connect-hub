import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ad } from '@/types/advertising';
import {
  ExternalLink,
  MapPin,
  Calendar,
  ShoppingBag,
  Briefcase,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Star,
  Play
} from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface AdCardProps {
  ad: Ad;
  placement: 'feed' | 'sidebar' | 'banner' | 'inline';
  onAdClick: () => void;
  showEngagement?: boolean;
}

export const AdCard = ({ ad, placement, onAdClick, showEngagement = false }: AdCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const getPlaceholderImage = () => {
    // Campaign-type specific placeholder colors and emojis
    switch (ad.campaign_type) {
      case 'business_promotion':
        return { emoji: '🏢', bg: 'from-blue-500 to-blue-600' };
      case 'service_ad':
        return { emoji: '⚙️', bg: 'from-purple-500 to-purple-600' };
      case 'marketplace_ad':
        return { emoji: '🛍️', bg: 'from-green-500 to-green-600' };
      case 'event_promotion':
        return { emoji: '📅', bg: 'from-orange-500 to-orange-600' };
      case 'community_boost':
        return { emoji: '👥', bg: 'from-pink-500 to-pink-600' };
      default:
        return { emoji: '📢', bg: 'from-gray-500 to-gray-600' };
    }
  };

  const hasImages = ad.ad_images && ad.ad_images.length > 0;
  const hasVideo = ad.video_url && ad.video_thumbnail_url;
  const placeholder = getPlaceholderImage();

  const renderMediaContent = (height: string) => {
    if (hasVideo) {
      return (
        <div className={`relative ${height} bg-black rounded overflow-hidden group`}>
          <img
            src={ad.video_thumbnail_url}
            alt={ad.ad_title}
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <div className="bg-white/90 rounded-full p-4">
              <Play className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Badge className="absolute top-2 left-2 bg-black/70 text-white">
            Video
          </Badge>
        </div>
      );
    }

    if (hasImages && !imageError) {
      return (
        <div className={`relative ${height} bg-muted rounded overflow-hidden`}>
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}
          <img
            src={ad.ad_images[0]}
            alt={ad.ad_title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className={`${height} bg-gradient-to-br ${placeholder.bg} rounded flex items-center justify-center`}>
        <span className={placement === 'sidebar' ? 'text-4xl' : 'text-6xl'}>{placeholder.emoji}</span>
      </div>
    );
  };

  const renderEngagementMetrics = () => {
    if (!showEngagement || !ad.engagement) return null;

    return (
      <div className="flex items-center gap-4 pt-3 border-t mt-3">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${ad.engagement.likes} likes`}
        >
          <Heart className="h-4 w-4" />
          <span>{ad.engagement.likes}</span>
        </button>
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${ad.engagement.comments} comments`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{ad.engagement.comments}</span>
        </button>
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${ad.engagement.shares} shares`}
        >
          <Share2 className="h-4 w-4" />
          <span>{ad.engagement.shares}</span>
        </button>
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
          onClick={(e) => e.stopPropagation()}
          aria-label="Save ad"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Compact layout for sidebar
  if (placement === 'sidebar') {
    return (
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
        role="article"
        aria-label={`Sponsored: ${ad.ad_title}`}
      >
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs shrink-0">
            Sponsored
          </Badge>
        </div>

        <div className="mt-2">
          {renderMediaContent('h-24')}
        </div>

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
      <Card
        className="flex-shrink-0 w-80 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
        role="article"
        aria-label={`Sponsored: ${ad.ad_title}`}
      >
        <div className="relative">
          {renderMediaContent('h-40')}
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
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-community-yellow bg-gradient-to-r from-community-yellow/5 to-transparent"
      onClick={handleClick}
      role="article"
      aria-label={`Sponsored: ${ad.ad_title}`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs bg-gradient-primary text-white">
              <span className="mr-1">📢</span>
              Sponsored
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getCampaignTypeIcon()}
              <span className="ml-1">{getCampaignTypeLabel()}</span>
            </Badge>
          </div>
        </div>

        {ad.business_name && (
          <div className="flex items-center gap-3 mb-3">
            {ad.business_logo ? (
              <img
                src={ad.business_logo}
                alt={ad.business_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-community-yellow/20"
              />
            ) : (
              <Avatar className="h-10 w-10 ring-2 ring-community-yellow/20">
                <AvatarFallback className="bg-community-yellow/10 text-community-yellow font-medium">
                  {ad.business_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{ad.business_name}</p>
                {ad.business_verified && (
                  <Badge variant="secondary" className="text-xs bg-community-yellow/20 text-community-yellow">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Verified
                  </Badge>
                )}
              </div>
              {ad.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ad.location}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-3">
          {renderMediaContent('h-48 sm:h-56')}
        </div>

        <h3 className="text-base sm:text-lg font-semibold mb-2 hover:text-primary transition-colors">{ad.ad_title}</h3>
        <p className="text-muted-foreground text-xs sm:text-sm mb-4 line-clamp-3 leading-relaxed">
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

        <Button
          className="w-full bg-gradient-primary hover:opacity-90 h-10 sm:h-11 text-sm sm:text-base"
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        >
          {ad.ad_call_to_action || 'Learn More'}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>

        {renderEngagementMetrics()}
      </div>
    </Card>
  );
};
