import { useEffect } from 'react';
import { useAdDisplay } from '@/hooks/advertising/useAdDisplay';
import { AdDisplayProps } from '@/types/advertising';
import { AdCard } from './AdCard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Unified Advertisement Display Component
 * Displays ads with smart targeting, frequency capping, and engagement tracking
 */
export const AdDisplay = ({
  placement = 'feed',
  maxAds = 3,
  filterType = 'all',
  userLocation,
  className = '',
  enableFrequencyCapping = true,
  showEngagement = false,
}: AdDisplayProps) => {
  const { ads, loading, logImpression, logClick } = useAdDisplay(maxAds, enableFrequencyCapping);

  // Log impressions when ads are displayed
  useEffect(() => {
    if (ads.length > 0 && !loading) {
      ads.forEach(ad => {
        logImpression(ad.campaign_id);
      });
    }
  }, [ads, loading]);

  // Filter ads by type if specified
  const filteredAds = filterType === 'all'
    ? ads
    : ads.filter(ad => ad.campaign_type === filterType);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, i) => (
          <Skeleton key={i} className=\"h-48 w-full\" />
        ))}
      </div>
    );
  }

  if (filteredAds.length === 0) {
    return null;
  }

  // Different layouts based on placement
  const containerClass = {
    feed: 'space-y-4',
    sidebar: 'space-y-3',
    banner: 'flex overflow-x-auto gap-4 pb-2 scrollbar-hide',
    inline: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  }[placement];

  return (
    <div className={`${containerClass} ${className}`}>
      {placement === 'feed' && (
        <div className=\"flex items-center gap-2 mb-2\">
          <div className=\"h-px flex-1 bg-border\" />
          <span className=\"text-xs font-medium text-muted-foreground px-2\">
            Sponsored Content
          </span>
          <div className=\"h-px flex-1 bg-border\" />
        </div >
      )}

{
  filteredAds.map((ad) => (
    <AdCard
      key={ad.campaign_id}
      ad={ad}
      placement={placement}
      onAdClick={() => logClick(ad.campaign_id)}
      showEngagement={showEngagement}
    />
  ))
}
    </div >
  );
};
