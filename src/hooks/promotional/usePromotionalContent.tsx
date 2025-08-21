import { useState, useEffect } from 'react';
import { PromotionalService } from '@/services/promotionalService';
import { SponsoredContent, PromotionalAd } from '@/types/promotional';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export const usePromotionalContent = (limit: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [sponsoredContent, setSponsoredContent] = useState<SponsoredContent[]>([]);
  const [promotionalAds, setPromotionalAds] = useState<PromotionalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userLocation = profile ? `${profile.city || ''}, ${profile.state || ''}`.trim() : undefined;

  const fetchContent = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [sponsored, ads] = await Promise.all([
        PromotionalService.getActiveSponsoredContent(userLocation, limit),
        PromotionalService.getPromotionalAds(limit, userLocation)
      ]);

      setSponsoredContent(sponsored);
      setPromotionalAds(ads);
    } catch (err) {
      console.error('Error fetching promotional content:', err);
      setError('Failed to load promotional content');
    } finally {
      setLoading(false);
    }
  };

  const logInteraction = async (campaignId: string, type: 'impression' | 'click' | 'conversion') => {
    await PromotionalService.logInteraction({
      campaign_id: campaignId,
      user_id: user?.id,
      interaction_type: type,
      user_location: userLocation,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      user_agent: navigator.userAgent
    });
  };

  useEffect(() => {
    // Only fetch when we have user and location data, and limit frequency
    if (user && userLocation && userLocation !== ', ') {
      fetchContent();
    }
  }, [user?.id, userLocation]);

  return {
    sponsoredContent,
    promotionalAds,
    loading,
    error,
    refetch: fetchContent,
    logInteraction
  };
};