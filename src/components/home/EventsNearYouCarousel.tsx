import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUpcomingEvents, useSafetyAlerts, useMarketplaceHighlights, useTrendingTopics } from "@/hooks/useDashboardSections";
import { useAdDisplay } from "@/hooks/advertising/useAdDisplay";
import { useFeedQuery } from "@/hooks/useFeedQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, ClockIcon, ShieldExclamationIcon, ShoppingBagIcon, FireIcon } from "@heroicons/react/24/solid";

export const EventsNearYouCarousel = () => {
  const navigate = useNavigate();
  const { profile, getInitials } = useProfile();
  const { events, loading: eventsLoading } = useUpcomingEvents();
  const { alerts, loading: alertsLoading } = useSafetyAlerts();
  const { items: marketplaceItems, loading: marketplaceLoading } = useMarketplaceHighlights();
  const { ads, loading: adsLoading } = useAdDisplay(2);
  const { data: postsData, isLoading: postsLoading } = useFeedQuery({
    sortBy: 'recent',
    locationScope: 'all',
  });

  const loading = eventsLoading || alertsLoading || marketplaceLoading || adsLoading || postsLoading;

  // Mix all content types
  const trendingPosts = postsData?.pages[0]?.items.slice(0, 3) || [];
  
  const mixedContent: Array<{
    id: string;
    type: 'event' | 'alert' | 'marketplace' | 'ad' | 'post';
    title: string;
    subtitle?: string;
    location?: string;
    image?: string;
    data: any;
  }> = [];

  // Add trending posts
  trendingPosts.forEach(post => {
    mixedContent.push({
      id: post.id,
      type: 'post',
      title: post.content.slice(0, 50) + (post.content.length > 50 ? '...' : ''),
      subtitle: post.author_name,
      location: post.author_city && post.author_state ? `${post.author_city}, ${post.author_state}` : undefined,
      image: post.image_urls?.[0],
      data: post
    });
  });

  // Add events
  events.slice(0, 2).forEach(event => {
    mixedContent.push({
      id: event.id,
      type: 'event',
      title: event.title,
      subtitle: event.date && event.time ? `${event.date}, ${event.time}` : 'Date TBA',
      location: event.location,
      data: event
    });
  });

  // Add safety alerts
  alerts.slice(0, 2).forEach(alert => {
    mixedContent.push({
      id: alert.id,
      type: 'alert',
      title: alert.title,
      subtitle: alert.severity,
      data: alert
    });
  });

  // Add marketplace items
  marketplaceItems.slice(0, 2).forEach(item => {
    mixedContent.push({
      id: item.id,
      type: 'marketplace',
      title: item.title,
      subtitle: item.price ? `$${item.price}` : 'Contact for price',
      location: item.location,
      image: item.image,
      data: item
    });
  });

  // Add sponsored ads
  ads.forEach(ad => {
    mixedContent.push({
      id: ad.campaign_id,
      type: 'ad',
      title: ad.ad_title || 'Sponsored',
      subtitle: ad.ad_description || '',
      image: ad.ad_images?.[0],
      data: ad
    });
  });

  // Shuffle for variety
  const shuffled = mixedContent.sort(() => Math.random() - 0.5);
  const displayContent = shuffled.slice(0, 8);

  const handleCardClick = (item: typeof displayContent[0]) => {
    switch (item.type) {
      case 'event':
        navigate(`/events/${item.id}`);
        break;
      case 'alert':
        navigate('/safety');
        break;
      case 'marketplace':
        navigate(`/marketplace/${item.id}`);
        break;
      case 'post':
        navigate(`/community/post/${item.id}`);
        break;
      case 'ad':
        if (item.data.ad_url) window.open(item.data.ad_url, '_blank');
        break;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'alert':
        return <ShieldExclamationIcon className="h-3 w-3" />;
      case 'marketplace':
        return <ShoppingBagIcon className="h-3 w-3" />;
      case 'event':
        return <ClockIcon className="h-3 w-3" />;
      case 'post':
        return <FireIcon className="h-3 w-3" />;
      default:
        return <SparklesIcon className="h-3 w-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'alert':
        return 'Safety Alert';
      case 'marketplace':
        return 'Marketplace';
      case 'event':
        return 'Event';
      case 'post':
        return 'Trending';
      case 'ad':
        return 'Sponsored';
      default:
        return type;
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 px-4 flex items-center gap-2">
        <FireIcon className="h-5 w-5 text-primary" />
        Trending Now
      </h2>
      
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-3 pb-2">
          {/* Trending Content Cards */}
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[160px] h-[200px] bg-muted rounded-xl animate-pulse"
                />
              ))}
            </>
          ) : displayContent.length > 0 ? (
            displayContent.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="relative flex-shrink-0 w-[160px] h-[200px] rounded-xl overflow-hidden cursor-pointer group"
              >
                {/* Background Image, Map, or Logo */}
                {item.type === 'alert' && item.data?.latitude && item.data?.longitude ? (
                  // Show Mapbox static map for safety alerts
                  <div className="absolute inset-0">
                    <img
                      src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${item.data.longitude},${item.data.latitude})/${item.data.longitude},${item.data.latitude},14,0/400x400@2x?access_token=pk.eyJ1IjoibmVpZ2hib3JsaW5rIiwiYSI6ImNtNGpxbXc3bjAxOGIyanB6cW1iMW11MHoifQ.5PqK5zTesjLBY-gDqHFKNw`}
                      alt="Alert location"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient if map fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : item.image ? (
                  // Show image if available
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                ) : (
                  // Show NeighborLink logo for posts without images
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <img 
                      src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                      alt="NeighborLink" 
                      className="h-16 w-16 object-contain opacity-40"
                    />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    {getIconForType(item.type)}
                    <span className="text-xs font-medium text-foreground">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                </div>

                {/* Content Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <div className="flex items-center gap-1 text-xs text-white/90 mb-0.5">
                      <span className="line-clamp-1">{item.subtitle}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-1 text-xs text-white/90">
                      <MapPinIcon className="h-3 w-3" />
                      <span className="line-clamp-1">{item.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-[160px] h-[200px] bg-card border border-border rounded-xl flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center px-4">
                No trending content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
