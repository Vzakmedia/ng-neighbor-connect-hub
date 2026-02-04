import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdvertisingService } from '@/services/advertisingService';
import { Ad } from '@/types/advertising';

const FREQUENCY_CAP_STORAGE_KEY = 'ad_frequency_caps';
const MAX_IMPRESSIONS_PER_DAY = 3;
const COOLDOWN_HOURS = 2;

interface FrequencyCapData {
  [campaignId: string]: {
    count: number;
    lastShown: string;
    date: string;
  };
}

export const useAdDisplay = (maxAds: number = 3, enableFrequencyCapping: boolean = true) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get frequency cap data from localStorage
  const getFrequencyCaps = useCallback((): FrequencyCapData => {
    try {
      const stored = localStorage.getItem(FREQUENCY_CAP_STORAGE_KEY);
      if (!stored) return {};

      const data: FrequencyCapData = JSON.parse(stored);
      const today = new Date().toDateString();

      // Clean up old data and reset daily counts
      const cleaned: FrequencyCapData = {};
      Object.entries(data).forEach(([campaignId, capData]) => {
        if (capData.date === today) {
          cleaned[campaignId] = capData;
        }
      });

      return cleaned;
    } catch {
      return {};
    }
  }, []);

  // Update frequency cap data
  const updateFrequencyCap = useCallback((campaignId: string) => {
    const caps = getFrequencyCaps();
    const today = new Date().toDateString();
    const now = new Date().toISOString();

    caps[campaignId] = {
      count: (caps[campaignId]?.count || 0) + 1,
      lastShown: now,
      date: today,
    };

    localStorage.setItem(FREQUENCY_CAP_STORAGE_KEY, JSON.stringify(caps));
  }, [getFrequencyCaps]);

  // Check if ad should be shown based on frequency cap
  const shouldShowAd = useCallback((campaignId: string): boolean => {
    if (!enableFrequencyCapping) return true;

    const caps = getFrequencyCaps();
    const capData = caps[campaignId];

    if (!capData) return true;

    // Check daily impression limit
    if (capData.count >= MAX_IMPRESSIONS_PER_DAY) {
      return false;
    }

    // Check cooldown period
    const lastShown = new Date(capData.lastShown);
    const hoursSinceLastShown = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastShown < COOLDOWN_HOURS) {
      return false;
    }

    return true;
  }, [enableFrequencyCapping, getFrequencyCaps]);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userLocation = profile?.city && profile?.state
        ? { city: profile.city, state: profile.state }
        : undefined;

      // Fetch more ads than needed to account for frequency capping
      const fetchLimit = enableFrequencyCapping ? maxAds * 3 : maxAds;
      const data = await AdvertisingService.getActiveAds(userLocation, fetchLimit);

      // Filter ads based on frequency capping
      let filteredAds = data;
      if (enableFrequencyCapping) {
        filteredAds = data.filter(ad => shouldShowAd(ad.campaign_id));
      }

      // Limit to requested number
      const finalAds = filteredAds.slice(0, maxAds);

      setAds(finalAds);
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError('Failed to load advertisements');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.city, profile?.state, maxAds, enableFrequencyCapping, shouldShowAd]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const logImpression = useCallback(async (campaignId: string) => {
    try {
      // Update frequency cap
      if (enableFrequencyCapping) {
        updateFrequencyCap(campaignId);
      }

      // Log to backend
      await AdvertisingService.logInteraction(
        campaignId,
        'impression',
        user?.id
      );
    } catch (err) {
      console.error('Error logging impression:', err);
    }
  }, [user?.id, enableFrequencyCapping, updateFrequencyCap]);

  const logClick = useCallback(async (campaignId: string) => {
    try {
      await AdvertisingService.logInteraction(
        campaignId,
        'click',
        user?.id
      );
    } catch (err) {
      console.error('Error logging click:', err);
    }
  }, [user?.id]);

  const logConversion = useCallback(async (campaignId: string) => {
    try {
      await AdvertisingService.logInteraction(
        campaignId,
        'conversion',
        user?.id
      );
    } catch (err) {
      console.error('Error logging conversion:', err);
    }
  }, [user?.id]);

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
