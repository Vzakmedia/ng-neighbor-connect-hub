import { supabase } from '@/integrations/supabase/client';
import {
  Campaign,
  Ad,
  CreateCampaignData,
  PricingTier,
  CampaignAnalytics,
  CampaignFilters,
} from '@/types/advertising';

/**
 * Unified Advertising Service
 * Handles all campaign management, analytics, and ad display
 */
export class AdvertisingService {
  // ============================================
  // Campaign Management
  // ============================================

  static async createCampaign(data: CreateCampaignData): Promise<Campaign | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.duration_days);

      const campaignData = {
        user_id: user.id,
        campaign_name: data.campaign_name,
        campaign_type: data.campaign_type,
        ad_title: data.ad_title,
        ad_description: data.ad_description,
        ad_images: data.ad_images || [],
        ad_url: data.ad_url,
        ad_call_to_action: data.ad_call_to_action,
        service_id: data.service_id,
        marketplace_item_id: data.marketplace_item_id,
        business_id: data.business_id,
        event_id: data.event_id,
        community_post_id: data.community_post_id,
        target_geographic_scope: data.target_geographic_scope,
        target_states: data.target_states,
        target_cities: data.target_cities,
        pricing_tier_id: data.pricing_tier_id,
        daily_budget: data.daily_budget,
        total_budget: data.total_budget,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'draft',
        approval_status: 'pending',
        payment_status: 'pending',
      };

      const { data: campaign, error } = await supabase
        .from('advertisement_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      return campaign as Campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  static async getCampaigns(
    userId: string,
    filters?: CampaignFilters
  ): Promise<Campaign[]> {
    try {
      let query = supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }

      if (filters?.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }

      if (filters?.search) {
        query = query.or(
          `campaign_name.ilike.%${filters.search}%,ad_title.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Campaign[];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  static async getCampaignById(campaignId: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data as Campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  static async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return false;
    }
  }

  static async updateCampaignStatus(
    campaignId: string,
    status: Campaign['status']
  ): Promise<boolean> {
    return this.updateCampaign(campaignId, { status });
  }

  // ============================================
  // Ad Display
  // ============================================

  static async getActiveAds(
    userLocation?: { city?: string; state?: string },
    limit: number = 5
  ): Promise<Ad[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_ads', {
        user_location: null,
        user_city: userLocation?.city || null,
        user_state: userLocation?.state || null,
        content_limit: limit,
      });

      if (error) throw error;

      // Transform JSONB ad_images to string array
      return (data || []).map((ad: any) => ({
        ...ad,
        ad_images: Array.isArray(ad.ad_images) 
          ? ad.ad_images 
          : JSON.parse(ad.ad_images || '[]'),
      })) as Ad[];
    } catch (error) {
      console.error('Error fetching active ads:', error);
      return [];
    }
  }

  // ============================================
  // Interaction Logging
  // ============================================

  static async logInteraction(
    campaignId: string,
    interactionType: 'impression' | 'click' | 'conversion',
    userId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('ad_interactions').insert({
        campaign_id: campaignId,
        user_id: userId,
        interaction_type: interactionType,
      });

      if (error) throw error;

      // Update campaign totals
      if (interactionType === 'impression') {
        await supabase.rpc('increment', {
          table_name: 'advertisement_campaigns',
          row_id: campaignId,
          column_name: 'total_impressions',
        });
      } else if (interactionType === 'click') {
        await supabase.rpc('increment', {
          table_name: 'advertisement_campaigns',
          row_id: campaignId,
          column_name: 'total_clicks',
        });
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  // ============================================
  // Analytics
  // ============================================

  static async getCampaignAnalytics(
    campaignId: string,
    dateRange?: { start: string; end: string }
  ): Promise<CampaignAnalytics | null> {
    try {
      // Get campaign data
      const campaign = await this.getCampaignById(campaignId);
      if (!campaign) return null;

      // Get interactions
      let query = supabase
        .from('ad_interactions')
        .select('interaction_type')
        .eq('campaign_id', campaignId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: interactions, error } = await query;
      if (error) throw error;

      const impressions = interactions?.filter(i => i.interaction_type === 'impression').length || 0;
      const clicks = interactions?.filter(i => i.interaction_type === 'click').length || 0;
      const conversions = interactions?.filter(i => i.interaction_type === 'conversion').length || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const cpc = clicks > 0 ? campaign.total_spent / clicks : 0;
      const cpConversion = conversions > 0 ? campaign.total_spent / conversions : 0;

      return {
        campaign_id: campaignId,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        click_through_rate: ctr,
        conversion_rate: conversionRate,
        cost_per_click: cpc,
        cost_per_conversion: cpConversion,
        total_spent: campaign.total_spent,
        date_range: dateRange || {
          start: campaign.start_date,
          end: campaign.end_date,
        },
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  }

  // ============================================
  // Pricing
  // ============================================

  static async getPricingTiers(
    adType?: string,
    scope?: string
  ): Promise<PricingTier[]> {
    try {
      let query = supabase
        .from('ad_pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: false });

      if (adType) {
        query = query.eq('ad_type', adType);
      }

      if (scope) {
        query = query.eq('geographic_scope', scope);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as PricingTier[];
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      return [];
    }
  }

  static async calculateCampaignCost(
    pricingTierId: string,
    durationDays: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_campaign_cost', {
        pricing_tier_id: pricingTierId,
        duration_days: durationDays,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating campaign cost:', error);
      return 0;
    }
  }

  // ============================================
  // Admin Functions
  // ============================================

  static async approveCampaign(
    campaignId: string,
    adminUserId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'approved',
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving campaign:', error);
      return false;
    }
  }

  static async rejectCampaign(
    campaignId: string,
    reason: string,
    adminUserId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting campaign:', error);
      return false;
    }
  }

  static async getAllCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
    try {
      let query = supabase
        .from('advertisement_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }

      if (filters?.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Campaign[];
    } catch (error) {
      console.error('Error fetching all campaigns:', error);
      return [];
    }
  }
}
