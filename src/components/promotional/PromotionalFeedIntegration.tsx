import { usePromotionalContent } from '@/hooks/promotional/usePromotionalContent';
import { PromotionalAdCard } from './PromotionalAdCard';
import { PromotionalContentDisplay } from './PromotionalContentDisplay';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionalFeedIntegrationProps {
  maxAds?: number;
  displayType?: 'ads' | 'sponsored' | 'both';
  className?: string;
  showInFeed?: boolean;
  insertionInterval?: number; // Insert ad every N posts
}

export const PromotionalFeedIntegration = ({
  maxAds = 3,
  displayType = 'both',
  className = '',
  showInFeed = true,
  insertionInterval = 5
}: PromotionalFeedIntegrationProps) => {
  const { 
    sponsoredContent, 
    promotionalAds, 
    loading, 
    error,
    logInteraction 
  } = usePromotionalContent(maxAds);

  const handleAdInteraction = async (adId: string, type: 'click' | 'conversion') => {
    await logInteraction(adId, type);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Promotional content error:', error);
    return null;
  }

  const shouldShowAds = (displayType === 'ads' || displayType === 'both') && promotionalAds.length > 0;
  const shouldShowSponsored = (displayType === 'sponsored' || displayType === 'both') && sponsoredContent.length > 0;

  if (!shouldShowAds && !shouldShowSponsored) {
    return null;
  }

  // For sidebar/dedicated promotional sections
  if (!showInFeed) {
    return (
      <div className={className}>
        {shouldShowSponsored && (
          <PromotionalContentDisplay
            content={sponsoredContent}
            onInteraction={handleAdInteraction}
            className="mb-6"
          />
        )}
        
        {shouldShowAds && (
          <div className="space-y-4">
            {promotionalAds.map((ad) => (
              <PromotionalAdCard
                key={ad.id}
                ad={ad}
                onInteraction={handleAdInteraction}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // For feed integration - return components to be inserted
  return {
    promotionalAds: shouldShowAds ? promotionalAds : [],
    sponsoredContent: shouldShowSponsored ? sponsoredContent : [],
    handleInteraction: handleAdInteraction,
    insertionInterval,
    PromotionalAdCard,
    PromotionalContentDisplay
  };
};

// Hook for feed integration
export const usePromotionalFeedIntegration = (insertionInterval: number = 5) => {
  const { 
    sponsoredContent, 
    promotionalAds, 
    loading, 
    logInteraction 
  } = usePromotionalContent();

  const insertPromotionalContent = (feedItems: any[]) => {
    if (loading || (!promotionalAds.length && !sponsoredContent.length)) {
      return feedItems;
    }

    const enhancedFeed = [...feedItems];
    const allPromotional = [
      ...promotionalAds.map(ad => ({ type: 'promotional_ad', data: ad })),
      ...sponsoredContent.map(content => ({ type: 'sponsored_content', data: content }))
    ];

    // Insert promotional content at intervals
    let promotionalIndex = 0;
    for (let i = insertionInterval - 1; i < enhancedFeed.length; i += insertionInterval) {
      if (promotionalIndex < allPromotional.length) {
        enhancedFeed.splice(i + promotionalIndex, 0, allPromotional[promotionalIndex]);
        promotionalIndex++;
      }
    }

    return enhancedFeed;
  };

  return {
    insertPromotionalContent,
    logInteraction,
    hasPromotionalContent: promotionalAds.length > 0 || sponsoredContent.length > 0,
    loading
  };
};