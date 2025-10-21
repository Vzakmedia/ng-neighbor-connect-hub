import { CommunityPost, PostCardData } from '@/types/community';

/**
 * Transform CommunityPost from feed query to PostCardData for components
 */
export function transformToCardData(post: CommunityPost & { 
  like_count: number; 
  comment_count: number; 
  save_count: number;
  is_liked: boolean;
  is_saved: boolean;
  views_count?: number;
}): PostCardData {
  return {
    ...post,
    author: {
      user_id: post.user_id,
      full_name: post.author_name,
      avatar_url: post.author_avatar ?? undefined,
      city: post.author_city ?? undefined,
      state: post.author_state ?? undefined,
    },
    likes_count: post.like_count,
    comments_count: post.comment_count,
    saves_count: post.save_count,
    isLiked: post.is_liked,
    isSaved: post.is_saved,
    views_count: post.views_count || 0,
  };
}

/**
 * Transform array of posts from feed pages
 */
export function transformFeedData(posts: any[]): PostCardData[] {
  return posts.map(transformToCardData);
}
