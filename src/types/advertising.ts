// Unified Advertisement System Types

export type CampaignType = 
  | 'business_promotion' 
  | 'service_ad' 
  | 'marketplace_ad' 
  | 'event_promotion' 
  | 'community_boost';

export type CampaignStatus = 'draft' | 'pending_payment' | 'pending_approval' | 'active' | 'paused' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type GeographicScope = 'nationwide' | 'state' | 'city';

export interface Campaign {
  id: string;
  user_id: string;
  campaign_name: string;
  campaign_type: CampaignType;
  
  // Ad Content
  ad_title: string;
  ad_description: string;
  ad_images: string[];
  ad_url?: string;
  ad_call_to_action: string;
  
  // Content References (only one should be set)
  service_id?: string;
  marketplace_item_id?: string;
  business_id?: string;
  event_id?: string;
  community_post_id?: string;
  
  // Targeting
  target_geographic_scope: GeographicScope;
  target_states?: string[];
  target_cities?: string[];
  target_coordinates?: any;
  
  // Budget & Dates
  pricing_tier_id: string;
  daily_budget: number;
  total_budget: number;
  start_date: string;
  end_date: string;
  
  // Tracking
  total_impressions: number;
  total_clicks: number;
  total_spent: number;
  priority_level: number;
  
  // Status
  status: CampaignStatus;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  payment_status: PaymentStatus;
  stripe_session_id?: string;
  payment_amount?: number;
  payment_completed_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Ad {
  // Display-ready ad data
  campaign_id: string;
  ad_title: string;
  ad_description: string;
  ad_images: string[];
  ad_url?: string;
  ad_call_to_action: string;
  campaign_type: CampaignType;
  priority_level: number;
  
  // Content details (from joins)
  service_name?: string;
  service_price?: string;
  marketplace_title?: string;
  marketplace_price?: number;
  business_name?: string;
  business_logo?: string;
  event_title?: string;
  event_date?: string;
  
  location?: string;
  created_at: string;
}

export interface CreateCampaignData {
  campaign_name: string;
  campaign_type: CampaignType;
  
  // Ad Content
  ad_title: string;
  ad_description: string;
  ad_images?: string[];
  ad_url?: string;
  ad_call_to_action: string;
  
  // Content Reference
  service_id?: string;
  marketplace_item_id?: string;
  business_id?: string;
  event_id?: string;
  community_post_id?: string;
  
  // Targeting
  target_geographic_scope: GeographicScope;
  target_states?: string[];
  target_cities?: string[];
  
  // Budget & Dates
  pricing_tier_id: string;
  daily_budget: number;
  total_budget: number;
  duration_days: number;
}

export interface PricingTier {
  id: string;
  name: string;
  ad_type: string;
  geographic_scope: GeographicScope;
  base_price_per_day: number;
  max_duration_days: number;
  impressions_included: number;
  click_rate_multiplier: number;
  priority_level: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InteractionType {
  type: 'impression' | 'click' | 'conversion';
}

export interface CampaignAnalytics {
  campaign_id: string;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  cost_per_click: number;
  cost_per_conversion: number;
  total_spent: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface CampaignFilters {
  status?: CampaignStatus;
  approval_status?: ApprovalStatus;
  campaign_type?: CampaignType;
  search?: string;
}

export interface PaymentResponse {
  url: string;
  session_id: string;
}

export interface AdDisplayProps {
  placement: 'feed' | 'sidebar' | 'banner' | 'inline';
  maxAds?: number;
  filterType?: CampaignType | 'all';
  userLocation?: {
    city?: string;
    state?: string;
  };
  className?: string;
}
