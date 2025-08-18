import { useState, useEffect } from 'react';
import { PromotionalService } from '@/services/promotionalService';
import { PromotionalCampaign, PromotionalAnalytics } from '@/types/promotional';
import { useAuth } from '@/hooks/useAuth';

export const usePromotionalCampaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userCampaigns = await PromotionalService.getUserCampaigns(user.id);
      setCampaigns(userCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: any) => {
    if (!user) return null;

    try {
      const newCampaign = await PromotionalService.createCampaign({
        ...campaignData,
        user_id: user.id
      });

      if (newCampaign) {
        setCampaigns(prev => [newCampaign, ...prev]);
      }

      return newCampaign;
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Failed to create campaign');
      return null;
    }
  };

  const updateCampaignStatus = async (
    campaignId: string, 
    status: string
  ) => {
    try {
      const success = await PromotionalService.updateCampaignStatus(campaignId, status);

      if (success) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status, updated_at: new Date().toISOString() }
              : campaign
          )
        );
      }

      return success;
    } catch (err) {
      console.error('Error updating campaign status:', err);
      setError('Failed to update campaign');
      return false;
    }
  };

  const getCampaignAnalytics = async (
    campaignId: string,
    dateRange?: { start: string; end: string }
  ): Promise<PromotionalAnalytics | null> => {
    try {
      return await PromotionalService.getCampaignAnalytics(campaignId, dateRange);
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    getCampaignAnalytics
  };
};