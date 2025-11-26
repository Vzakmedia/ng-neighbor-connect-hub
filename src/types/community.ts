// Unified Community Post Type Definitions

export interface PostAuthor {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  city?: string;
  state?: string;
}

export interface PostEngagement {
  like_count: number;
  comment_count: number;
  save_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  title?: string | null;
  image_urls: string[];
  file_urls: any[];
  tags: string[];
  location?: string | null;
  location_scope: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  author_city: string | null;
  author_state: string | null;
  rsvp_enabled: boolean;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
}

export interface PostCardData extends CommunityPost, PostEngagement {
  author: PostAuthor;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  isLiked: boolean;
  isSaved: boolean;
  views_count?: number;
  post_type: string;
}

export type PostType = 'general' | 'safety' | 'marketplace' | 'help' | 'event';
export type LocationScope = 'neighborhood' | 'city' | 'state' | 'all';
