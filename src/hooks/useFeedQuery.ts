import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface FeedFilters {
  locationScope: 'neighborhood' | 'city' | 'state' | 'all';
  tags?: string[];
  postType?: string;
  sortBy?: 'recent' | 'popular';
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
}

interface FeedPage {
  items: FeedPost[];
  nextCursor: number | null;
}

const POSTS_PER_PAGE = 20;

export function useFeedQuery(filters: FeedFilters) {
  const { user } = useAuth();
  const { profile } = useProfile();

  const queryKey = ['feed', {
    userId: user?.id,
    locationScope: filters.locationScope,
    tags: filters.tags || [],
    postType: filters.postType,
    sortBy: filters.sortBy || 'recent',
    searchQuery: filters.searchQuery || '',
  }];

  return useInfiniteQuery<FeedPage>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!user || !profile) {
        throw new Error('User not authenticated');
      }

      const offset = pageParam as number;

      // Build query for community posts
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey (
            full_name,
            avatar_url,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      // Apply location filters - Show 'all' posts + location-specific posts
      // Don't filter if locationScope is 'all' - show everything
      if (filters.locationScope === 'neighborhood' && profile.neighborhood && profile.city && profile.state) {
        // Show posts with scope 'all' OR neighborhood-specific posts
        query = query.or(`location_scope.eq.all,and(location_scope.eq.neighborhood,target_neighborhood.eq.${profile.neighborhood},target_city.eq.${profile.city},target_state.eq.${profile.state})`);
      } else if (filters.locationScope === 'city' && profile.city && profile.state) {
        // Show posts with scope 'all' OR city-specific posts
        query = query.or(`location_scope.eq.all,and(location_scope.eq.city,target_city.eq.${profile.city},target_state.eq.${profile.state})`);
      } else if (filters.locationScope === 'state' && profile.state) {
        // Show posts with scope 'all' OR state-specific posts
        query = query.or(`location_scope.eq.all,and(location_scope.eq.state,target_state.eq.${profile.state})`);
      }
      // If locationScope is 'all', no filter is applied

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Feed fetch error:', error);
        throw error;
      }

      // Transform and enrich posts with engagement data
      const posts: FeedPost[] = await Promise.all(
        (postsData || []).map(async (post: any) => {
          // Fetch engagement counts in parallel
          const [likeData, saveData] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('saved_posts')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
          ]);

          const [userLike, userSave] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);

          return {
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
            author_name: post.profiles?.full_name || 'Unknown User',
            author_avatar: post.profiles?.avatar_url || null,
            author_city: post.profiles?.city || null,
            author_state: post.profiles?.state || null,
            like_count: likeData.count || 0,
            comment_count: 0, // Would need separate query
            save_count: saveData.count || 0,
            is_liked: !!userLike.data,
            is_saved: !!userSave.data,
            rsvp_enabled: post.rsvp_enabled || false,
          };
        })
      );

      // Apply client-side filters
      let filteredPosts = posts;

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        filteredPosts = filteredPosts.filter(post =>
          filters.tags!.some(tag => post.tags?.includes(tag))
        );
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredPosts = filteredPosts.filter(post =>
          post.content?.toLowerCase().includes(query) ||
          post.title?.toLowerCase().includes(query) ||
          post.author_name?.toLowerCase().includes(query)
        );
      }

      // Filter by date range
      if (filters.dateRange) {
        filteredPosts = filteredPosts.filter(post => {
          const postDate = new Date(post.created_at);
          return postDate >= filters.dateRange!.start && postDate <= filters.dateRange!.end;
        });
      }

      // Sort
      if (filters.sortBy === 'popular') {
        filteredPosts.sort((a, b) => {
          const scoreA = (a.like_count * 2) + a.comment_count + (a.save_count * 1.5);
          const scoreB = (b.like_count * 2) + b.comment_count + (b.save_count * 1.5);
          return scoreB - scoreA;
        });
      }

      return {
        items: filteredPosts,
        nextCursor: filteredPosts.length === POSTS_PER_PAGE ? offset + POSTS_PER_PAGE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!user && !!profile,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
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
      toast.error('Failed to update like');
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
      toast.error('Failed to update save');
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
      toast.error('Failed to create post');
    },
  });
}
