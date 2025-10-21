import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdvertisingService } from '@/services/advertisingService';
import { Ad } from '@/types/advertising';

export const useAdDisplay = (maxAds: number = 3) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = async () => {
    try {
      setLoading(true);
      setError(null);

      const userLocation = profile?.city && profile?.state 
        ? { city: profile.city, state: profile.state }
        : undefined;

      const data = await AdvertisingService.getActiveAds(userLocation, maxAds);
      setAds(data);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [profile?.city, profile?.state, maxAds]);

  const logImpression = async (campaignId: string) => {
    await AdvertisingService.logInteraction(
      campaignId,
      'impression',
      user?.id
    );
  };

  const logClick = async (campaignId: string) => {
    await AdvertisingService.logInteraction(
      campaignId,
      'click',
      user?.id
    );
  };

  const logConversion = async (campaignId: string) => {
    await AdvertisingService.logInteraction(
      campaignId,
      'conversion',
      user?.id
    );
  };

  return {
    ads,
    loading,
    error,
    refetch: fetchAds,
    logImpression,
    logClick,
    logConversion,
  };
};
