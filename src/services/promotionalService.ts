import { supabase } from '@/integrations/supabase/client';
import { 
  PromotionalCampaign, 
  SponsoredContent, 
  PromotionalAd, 
  PromotionalInteraction,
  PromotionalAnalytics 
} from '@/types/promotional';

export class PromotionalService {
  
  /**
   * Fetch active sponsored content for display
   */
  static async getActiveSponsoredContent(
    userLocation?: string, 
    limit: number = 3
  ): Promise<SponsoredContent[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_promoted_content', {
        user_location: userLocation || null,
        content_limit: limit
      });

      if (error) throw error;
      
      // Transform the RPC result to SponsoredContent format
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: Array.isArray(item.images) ? item.images : [],
        category: item.category,
        location: item.location,
        price: item.price,
        url: item.url,
        sponsored: item.sponsored,
        time_posted: item.time_posted,
        business: typeof item.business === 'object' ? item.business : {
          name: 'Business',
          location: 'Local Area',
          verified: false
        },
        cta: item.cta,
        likes: item.likes || 0,
        comments: item.comments || 0,
        type: item.type
      }));
    } catch (error) {
      console.error('Error fetching sponsored content:', error);
      return [];
    }
  }

  /**
   * Fetch promotional campaigns for a user
   */
  static async getUserCampaigns(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      return [];
    }
  }

  /**
   * Create a new promotional campaign
   */
  static async createCampaign(campaignData: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(
    campaignId: string, 
    status: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      return !error;
    } catch (error) {
      console.error('Error updating campaign status:', error);
      return false;
    }
  }

  /**
   * Log promotional interaction (impression, click, conversion)
   */
  static async logInteraction(interaction: Omit<PromotionalInteraction, 'id' | 'created_at'>): Promise<void> {
    try {
      // First verify that the campaign exists to avoid foreign key violations
      const { data: campaignExists } = await supabase
        .from('advertisement_campaigns')
        .select('id')
        .eq('id', interaction.campaign_id)
        .maybeSingle();
      
      if (!campaignExists) {
        console.warn('Campaign not found, skipping interaction log:', interaction.campaign_id);
        return;
      }

      await supabase.rpc('log_ad_interaction', {
        _campaign_id: interaction.campaign_id,
        _interaction_type: interaction.interaction_type,
        _user_id: interaction.user_id || null,
        _user_location: interaction.user_location || null,
        _device_type: interaction.device_type || null,
        _referrer: interaction.referrer || null,
        _ip_address: interaction.ip_address || null,
        _user_agent: interaction.user_agent || null
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(
    campaignId: string, 
    dateRange?: { start: string; end: string }
  ): Promise<PromotionalAnalytics | null> {
    try {
      // Fetch campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Fetch interactions for analytics
      let query = supabase
        .from('ad_interactions')
        .select('*')
        .eq('campaign_id', campaignId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: interactions, error: interactionsError } = await query;

      if (interactionsError) throw interactionsError;

      // Calculate analytics
      const impressions = interactions?.filter(i => i.interaction_type === 'impression').length || 0;
      const clicks = interactions?.filter(i => i.interaction_type === 'click').length || 0;
      const conversions = interactions?.filter(i => i.interaction_type === 'conversion').length || 0;

      const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const costPerClick = clicks > 0 ? campaign.total_spent / clicks : 0;
      const costPerConversion = conversions > 0 ? campaign.total_spent / conversions : 0;

      return {
        campaign_id: campaignId,
        total_impressions: impressions,
        total_clicks: clicks,
        total_conversions: conversions,
        click_through_rate: clickThroughRate,
        conversion_rate: conversionRate,
        cost_per_click: costPerClick,
        cost_per_conversion: costPerConversion,
        return_on_ad_spend: 0, // Would need revenue data to calculate
        date_range: dateRange || {
          start: campaign.start_date,
          end: campaign.end_date
        }
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  }

  /**
   * Fetch promotional ads for feed display
   */
  static async getPromotionalAds(
    maxAds: number = 3,
    userLocation?: string
  ): Promise<PromotionalAd[]> {
    try {
      const nowIso = new Date().toISOString();

      // Fetch active campaigns
      const { data: campaigns, error } = await supabase
        .from('advertisement_campaigns')
        .select(`
          *,
          ad_pricing_tiers(*)
        `)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .lte('start_date', nowIso)
        .gte('end_date', nowIso)
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) throw error;

      // Transform campaigns to promotional ads
      const ads: PromotionalAd[] = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          // Fetch user profile for business info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, city, state, neighborhood')
            .eq('user_id', campaign.user_id)
            .single();

          const createdDate = new Date(campaign.created_at);
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
          const timePosted = diffInHours < 1
            ? 'Just now'
            : diffInHours < 24
              ? `${diffInHours}h ago`
              : `${Math.floor(diffInHours / 24)}d ago`;

          return {
            id: campaign.id,
            title: campaign.ad_title || 'Advertisement',
            description: campaign.ad_description || '',
            images: Array.isArray(campaign.ad_images) ? (campaign.ad_images as string[]) : [],
            location: profile?.neighborhood || profile?.city || 'Location not specified',
            category: campaign.campaign_type,
            price: `₦${campaign.daily_budget.toLocaleString()}/day`,
            url: campaign.ad_url,
            sponsored: true,
            timePosted,
            promotion_type: campaign.campaign_type,
            contact_info: '',
            business: {
              name: profile?.full_name || 'Business',
              logo: profile?.avatar_url,
              location: `${profile?.city || ''}, ${profile?.state || ''}`.trim().replace(/^,|,$/, ''),
              verified: false // Would need to check business verification
            },
            cta: campaign.ad_call_to_action || 'Learn More',
            likes: 0,
            comments: 0,
            type: campaign.campaign_type as any || 'general'
          };
        })
      );

      return ads;
    } catch (error) {
      console.error('Error fetching promotional ads:', error);
      return [];
    }
  }

  /**
   * Get promotional pricing tiers
   */
  static async getPricingTiers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ad_pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('base_price_per_day', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      return [];
    }
  }

  /**
   * Create promotional payment session
   */
  static async createPromotionalPayment(
    campaignData: any,
    promotionType: string
  ): Promise<{ url: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-ad-campaign-payment', {
        body: {
          campaignData,
          promotionType
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating promotional payment:', error);
      return null;
    }
  }
}