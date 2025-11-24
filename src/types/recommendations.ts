export interface Recommendation {
  id: string;
  user_id: string;
  recommendation_type: 'restaurant' | 'service' | 'hidden_gem' | 'experience';
  title: string;
  description: string;
  category: string;
  sub_category?: string | null;
  image_urls: string[];
  location_type: 'physical' | 'online' | 'both';
  address?: string | null;
  city: string;
  state: string;
  neighborhood?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  price_range?: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | null;
  contact_info?: ContactInfo | null;
  operating_hours?: OperatingHours | null;
  tags: string[];
  average_rating: number;
  total_reviews: number;
  total_saves: number;
  total_likes: number;
  is_verified: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  created_at: string;
  updated_at: string;
  
  // Joined data
  author?: {
    user_id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
  is_saved?: boolean;
  is_liked?: boolean;
  distance?: number; // in km
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface OperatingHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface RecommendationReview {
  id: string;
  recommendation_id: string;
  reviewer_id: string;
  rating: number;
  review_title?: string | null;
  review_text: string;
  visit_date?: string | null;
  image_urls: string[];
  pros: string[];
  cons: string[];
  helpful_count: number;
  is_verified_visit: boolean;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  reviewer?: {
    user_id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
  user_reaction?: 'helpful' | 'not_helpful' | null;
}

export interface RecommendationCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  parent_category_id?: string | null;
  recommendation_type?: 'restaurant' | 'service' | 'hidden_gem' | 'experience' | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SavedRecommendation {
  id: string;
  user_id: string;
  recommendation_id: string;
  collection_name: string;
  notes?: string | null;
  created_at: string;
}

export interface RecommendationTip {
  id: string;
  recommendation_id: string;
  user_id: string;
  tip_text: string;
  helpful_count: number;
  created_at: string;
  
  // Joined data
  author?: {
    user_id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export interface RecommendationCheckIn {
  id: string;
  recommendation_id: string;
  user_id: string;
  check_in_date: string;
  image_urls: string[];
  note?: string | null;
  created_at: string;
}

export interface RecommendationFilters {
  type?: 'restaurant' | 'service' | 'hidden_gem' | 'experience';
  category?: string[];
  priceRange?: ('₦' | '₦₦' | '₦₦₦' | '₦₦₦₦')[];
  minRating?: number;
  distance?: number; // in km
  tags?: string[];
  openNow?: boolean;
  verifiedOnly?: boolean;
  city?: string;
  state?: string;
  neighborhood?: string;
  search?: string;
}

export interface CreateRecommendationInput {
  recommendation_type: 'restaurant' | 'service' | 'hidden_gem' | 'experience';
  title: string;
  description: string;
  category: string;
  sub_category?: string;
  image_urls: string[];
  location_type: 'physical' | 'online' | 'both';
  address?: string;
  city: string;
  state: string;
  neighborhood?: string;
  coordinates?: { lat: number; lng: number };
  price_range?: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦';
  contact_info?: ContactInfo;
  operating_hours?: OperatingHours;
  tags: string[];
}

export interface CreateReviewInput {
  recommendation_id: string;
  rating: number;
  review_title?: string;
  review_text: string;
  visit_date?: string;
  image_urls: string[];
  pros: string[];
  cons: string[];
}
