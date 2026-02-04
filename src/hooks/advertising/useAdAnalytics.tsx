import { useState, useEffect, useCallback } from 'react';
import { AdvertisingService } from '@/services/advertisingService';
import { CampaignAnalytics } from '@/types/advertising';

export const useAdAnalytics = (campaignId: string, autoRefresh: boolean = false) => {
    const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await AdvertisingService.getCampaignAnalytics(campaignId);
            setAnalytics(data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load campaign analytics');
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchAnalytics();

        // Auto-refresh every 30 seconds if enabled
        if (autoRefresh) {
            const interval = setInterval(fetchAnalytics, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchAnalytics, autoRefresh]);

    return {
        analytics,
        loading,
        error,
        refetch: fetchAnalytics,
    };
};
