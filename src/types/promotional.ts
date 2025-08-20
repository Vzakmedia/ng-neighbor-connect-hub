// Core promotional system types

export interface BasePromotionalContent {
  id: string;
  title: string;
  description: string;
  images?: string[];
  created_at: string;
  updated_at?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
}

export interface PromotionalCampaign extends BasePromotionalContent {
  campaign_id: string;
  user_id: string;
  campaign_type: 'service' | 'marketplace_item' | 'business' | 'event' | 'community_post';
  daily_budget: number;
  total_budget: number;
  start_date: string;
  end_date: string;
  target_geographic_scope: 'nationwide' | 'state' | 'city';
  target_states?: string[];
  target_cities?: string[];
  target_coordinates?: any;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  total_impressions: number;
  total_clicks: number;
  total_spent: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_amount?: number;
  stripe_session_id?: string;
  payment_completed_at?: string;
  ad_title?: string;
  ad_description?: string;
  ad_images?: any;
  ad_url?: string;
  ad_call_to_action?: string;
}

export interface SponsoredContent {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  location: string;
  price: string;
  url: string;
  sponsored: boolean;
  time_posted: string;
  business: {
    name: string;
    logo?: string;
    location: string;
    verified: boolean;
  };
  cta: string;
  likes: number;
  comments: number;
  type: string;
}

export interface PromotionalAd {
  id: string;
  title: string;
  description: string;
  image?: string;
  images?: string[];
  location: string;
  category: string;
  price?: string;
  url?: string;
  sponsored: boolean;
  timePosted: string;
  promotion_type: string;
  contact_info?: string;
  business?: {
    name: string;
    logo?: string;
    location: string;
    verified: boolean;
  };
  cta: string;
  likes: number;
  comments: number;
  rating?: number;
  type: 'general' | 'safety' | 'marketplace' | 'event';
}

export interface PromotionalInteraction {
  id: string;
  campaign_id: string;
  user_id?: string;
  interaction_type: 'impression' | 'click' | 'conversion';
  user_location?: string;
  device_type?: string;
  referrer?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PromotionalPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  color: string;
  priority_level: number;
  impressions_included: number;
  click_rate_multiplier: number;
  geographic_scope: 'nationwide' | 'state' | 'city';
  is_active: boolean;
}

export interface PromotionalAnalytics {
  campaign_id: string;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  cost_per_click: number;
  cost_per_conversion: number;
  return_on_ad_spend: number;
  date_range: {
    start: string;
    end: string;
  };
}

export type PromotionType = 'featured' | 'boost' | 'highlight' | 'banner';

export interface PromotionDisplaySettings {
  type: PromotionType;
  maxItems: number;
  showInFeed: boolean;
  showInSidebar: boolean;
  showInMarketplace: boolean;
  targetAudience?: {
    location?: string;
    interests?: string[];
    demographics?: any;
  };
}