import { useEffect, useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRecommendations, calculatePostScore } from '@/hooks/useRecommendations';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';

interface FeedFilters {
  locationScope: 'neighborhood' | 'city' | 'state' | 'all';
  tags?: string[];
  postType?: string;
  sortBy?: 'recent' | 'popular' | 'recommended';
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  title: string | null;
  image_urls: string[];
  file_urls: any[];
  tags: string[];
  location: string | null;
  location_scope: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  author_city: string | null;
  author_state: string | null;
  like_count: number;
  comment_count: number;
  save_count: number;
  is_liked: boolean;
  is_saved: boolean;
  optimistic?: boolean; // Flag for optimistic updates
  rsvp_enabled: boolean;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
}

interface FeedPage {
  items: FeedPost[];
  nextCursor: number | null;
}

const POSTS_PER_PAGE = 20;

export function useFeedQuery(filters: FeedFilters) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const { data: recommendations } = useRecommendations();

  const queryKey = ['feed', {
    userId: user?.id,
    locationScope: filters.locationScope,
    tags: filters.tags || [],
    postType: filters.postType,
    sortBy: filters.sortBy || 'recent',
    searchQuery: filters.searchQuery || '',
  }];

  // Check cache age to determine refetch strategy
  const queryState = queryClient.getQueryState(queryKey);
  const cacheAge = queryState?.dataUpdatedAt
    ? Date.now() - queryState.dataUpdatedAt
    : Infinity;

  const query = useInfiniteQuery<FeedPage>({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      if (!user || !profile) {
        throw new Error('User not authenticated');
      }

      const cursor = pageParam as string | null;

      // Use the RPC get_feed which handles hierarchical location filtering,
      // scope privacy, and the critical "author exception" (users seeing their own posts).
      const { data: postsData, error } = await supabase.rpc('get_feed', {
        target_user_id: user.id,
        filter_level: filters.locationScope,
        limit_count: POSTS_PER_PAGE,
        cursor: cursor
      });

      if (error) {
        console.error('Feed fetch error:', error);
        throw error;
      }

      // Transform RPC results to FeedPost format
      // Note: likes_count and comments_count are bigint in SQL, converted to numbers here
      const posts: FeedPost[] = (postsData || []).map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        title: post.title,
        image_urls: post.image_urls || [],
        file_urls: post.file_urls || [],
        tags: post.tags || [],
        location: post.location,
        location_scope: post.location_scope,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_name: post.author_name || 'Anonymous User',
        author_avatar: post.author_avatar || null,
        author_city: post.author_city || post.target_city || null,
        author_state: post.author_state || post.target_state || null,
        like_count: Number(post.likes_count) || 0,
        comment_count: Number(post.comments_count) || 0,
        save_count: Number(post.saves_count) || 0,
        is_liked: false,
        is_saved: false,
        rsvp_enabled: post.rsvp_enabled || false,
        video_url: post.video_url || null,
        video_thumbnail_url: post.video_thumbnail_url || null,
      }));

      // Batch fetch user's likes and saves for all posts
      const postIds = posts.map(p => p.id);
      const [userLikesData, userSavesData] = await Promise.all([
        user && postIds.length > 0
          ? supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds)
          : Promise.resolve({ data: [] }),
        user && postIds.length > 0
          ? supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const userLikedPosts = new Set((userLikesData?.data || []).map((l: any) => l.post_id));
      const userSavedPosts = new Set((userSavesData?.data || []).map((s: any) => s.post_id));

      // Final post update for interaction status
      posts.forEach(post => {
        post.is_liked = userLikedPosts.has(post.id);
        post.is_saved = userSavedPosts.has(post.id);
      });

      // Apply client-side filters (for search and tags which are not currently in the RPC)
      let filteredPosts = posts;

      if (filters.tags && filters.tags.length > 0) {
        filteredPosts = filteredPosts.filter(post =>
          filters.tags!.some(tag => post.tags?.includes(tag))
        );
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post =>
          post.content?.toLowerCase().includes(q) ||
          post.title?.toLowerCase().includes(q) ||
          post.author_name?.toLowerCase().includes(q)
        );
      }

      // Sort by popular/recommended if requested
      if (filters.sortBy === 'popular') {
        filteredPosts.sort((a, b) => {
          const scoreA = (a.like_count * 2) + a.comment_count;
          const scoreB = (b.like_count * 2) + b.comment_count;
          return scoreB - scoreA;
        });
      } else if (filters.sortBy === 'recommended' && recommendations) {
        filteredPosts.sort((a, b) => {
          const scoreA = calculatePostScore(a, recommendations);
          const scoreB = calculatePostScore(b, recommendations);
          return scoreB - scoreA;
        });
      }

      return {
        items: filteredPosts,
        nextCursor: posts.length === POSTS_PER_PAGE ? posts[posts.length - 1].created_at : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled: !!user && !!profile,

    // IMPROVED CACHING CONFIGURATION
    staleTime: 30 * 1000, // 30s - data considered fresh for this duration
    gcTime: 10 * 60 * 1000, // Keep in cache for 10min

    // Show cached data immediately while fetching fresh data
    placeholderData: (previousData) => previousData,

    // Always check for updates to ensure fresh content
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    // Add automatic background refetch
    refetchInterval: 60000, // Poll every 60 seconds for new posts

    // Use online mode to ensure fetch happens
    networkMode: 'online',
  });

  // Real-time Feed Updates
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Function to manually refresh the feed (Facebook style)
  const refreshFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to NEW posts (INSERT only)
    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        }, (payload) => {
          // Check if the new post is relevant to the current filter
          // This is a basic client-side check to avoid showing "New Posts" for irrelevant content
          // Ideally we'd check payload.new.location_scope vs profile, but for now we just increment
          // to let the user know *something* happened.
          setNewPostsCount(prev => prev + 1);
        }),
      {
        channelName: `feed_updates_${filters.locationScope}`,
        // If connection error, we might as well invalidate to be safe
        onError: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
        debugName: 'FeedRealtime'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, queryClient, filters.locationScope]);

  // Return extended query with realtime state
  return {
    ...query,
    newPostsCount,
    refreshFeed,
    cacheAge,
  };
}

// Mutation hooks for optimistic updates
export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      // Optimistically update
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPage) => ({
            ...page,
            items: page.items.map(post =>
              post.id === postId
                ? {
                  ...post,
                  is_liked: !isLiked,
                  like_count: post.like_count + (isLiked ? -1 : 1),
                }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      handleApiError(err, { route: '/feed' });
    },
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPage) => ({
            ...page,
            items: page.items.map(post =>
              post.id === postId
                ? {
                  ...post,
                  is_saved: !isSaved,
                  save_count: post.save_count + (isSaved ? -1 : 1),
                }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      handleApiError(err, { route: '/feed' });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();

  return useMutation({
    mutationFn: async (postData: {
      content: string;
      title?: string;
      image_urls?: string[];
      tags?: string[];
      location_scope: string;
    }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          ...postData,
          user_id: user!.id,
          target_neighborhood: postData.location_scope === 'neighborhood' ? profile?.neighborhood : null,
          target_city: postData.location_scope === 'city' || postData.location_scope === 'neighborhood' ? profile?.city : null,
          target_state: postData.location_scope === 'state' || postData.location_scope === 'city' || postData.location_scope === 'neighborhood' ? profile?.state : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (postData) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const optimisticPost: FeedPost = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        content: postData.content,
        title: postData.title || null,
        image_urls: postData.image_urls || [],
        file_urls: [],
        tags: postData.tags || [],
        location: null,
        location_scope: postData.location_scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_name: profile?.full_name || 'You',
        author_avatar: profile?.avatar_url || null,
        author_city: profile?.city || null,
        author_state: profile?.state || null,
        like_count: 0,
        comment_count: 0,
        save_count: 0,
        is_liked: false,
        is_saved: false,
        rsvp_enabled: false,
      };

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPage, idx: number) =>
            idx === 0
              ? { ...page, items: [optimisticPost, ...page.items] }
              : page
          ),
        };
      });

      return { optimisticPost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Post created successfully');
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      handleApiError(err, { route: '/feed' });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      content: string;
      title?: string | null;
      image_urls?: string[];
      video_url?: string | null;
      video_thumbnail_url?: string | null;
      tags?: string[];
      location_scope?: string;
      rsvp_enabled?: boolean;
    }) => {
      const { id, ...updateData } = data;
      const { data: updatedPost, error } = await supabase
        .from('community_posts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedPost;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPage) => ({
            ...page,
            items: page.items.map((post) =>
              post.id === data.id
                ? { ...post, ...data, updated_at: new Date().toISOString() }
                : post
            ),
          })),
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Post updated successfully');
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      handleApiError(err, { route: '/feed' });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: FeedPage) => ({
            ...page,
            items: page.items.filter((post) => post.id !== postId),
          })),
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Post deleted successfully');
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      handleApiError(err, { route: '/feed' });
    },
  });
}
