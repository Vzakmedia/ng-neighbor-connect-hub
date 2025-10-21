import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdvertisingService } from '@/services/advertisingService';
import { Campaign, CreateCampaignData, CampaignFilters, CampaignAnalytics } from '@/types/advertising';
import { toast } from 'sonner';

export const useAdvertisingCampaigns = (filters?: CampaignFilters) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await AdvertisingService.getCampaigns(user.id, filters);
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user?.id, filters?.status, filters?.approval_status, filters?.campaign_type]);

  const createCampaign = async (data: CreateCampaignData): Promise<Campaign | null> => {
    try {
      const campaign = await AdvertisingService.createCampaign(data);
      if (campaign) {
        toast.success('Campaign created successfully!');
        await fetchCampaigns();
        return campaign;
      } else {
        toast.error('Failed to create campaign');
        return null;
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast.error('Failed to create campaign');
      return null;
    }
  };

  const updateCampaignStatus = async (
    campaignId: string,
    status: Campaign['status']
  ): Promise<boolean> => {
    try {
      const success = await AdvertisingService.updateCampaignStatus(campaignId, status);
      if (success) {
        toast.success('Campaign status updated');
        await fetchCampaigns();
        return true;
      } else {
        toast.error('Failed to update campaign status');
        return false;
      }
    } catch (err) {
      console.error('Error updating campaign status:', err);
      toast.error('Failed to update campaign status');
      return false;
    }
  };

  const getCampaignAnalytics = async (
    campaignId: string,
    dateRange?: { start: string; end: string }
  ): Promise<CampaignAnalytics | null> => {
    try {
      return await AdvertisingService.getCampaignAnalytics(campaignId, dateRange);
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      toast.error('Failed to load analytics');
      return null;
    }
  };

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    getCampaignAnalytics,
  };
};
