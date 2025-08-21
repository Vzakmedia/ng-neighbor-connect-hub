import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { postCache } from "@/services/postCache";

interface Event {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  image_urls?: string[];
  tags?: string[];
  location?: string;
  rsvp_enabled?: boolean;
  created_at: string;
  author?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  saves_count?: number;
  views_count?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export const useCommunityFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({
    community: 0,
    messages: 0,
    notifications: 0
  });

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event.content?.toLowerCase().includes(query) ||
      event.title?.toLowerCase().includes(query) ||
      event.author?.full_name?.toLowerCase().includes(query) ||
      event.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  const fetchPosts = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      console.log('Fetching community posts...');

      const userLocation = {
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      };

      // Try to get from cache first
      const cachedPosts = postCache.get(userLocation.city, userLocation.state);
      if (cachedPosts && cachedPosts.length > 0) {
        console.log('Using cached posts:', cachedPosts.length);
        setEvents(cachedPosts);
        setLoading(false);
        
        // Refresh cache in background
        setTimeout(() => fetchAndCachePosts(userLocation), 1000);
        return;
      }

      // Fetch fresh data
      await fetchAndCachePosts(userLocation);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load community posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAndCachePosts = async (userLocation: any) => {
    const { data: posts, error } = await supabase
      .rpc('get_location_filtered_posts', {
        user_neighborhood: userLocation.neighborhood,
        user_city: userLocation.city,
        user_state: userLocation.state,
        show_all_posts: false,
        post_limit: 50,
        post_offset: 0
      });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    if (posts) {
      console.log('Fetched posts from database:', posts.length);
      
      // Enrich posts with author info and engagement data
      const enrichedPosts = await Promise.all(
        posts.map(async (post: any) => {
          const [authorData, engagementData] = await Promise.all([
            fetchAuthorInfo(post.user_id),
            fetchEngagementData(post.id)
          ]);

          return {
            ...post,
            author: authorData,
            ...engagementData
          };
        })
      );

      setEvents(enrichedPosts);
      
      // Cache the enriched posts
      postCache.set(userLocation.city, userLocation.state, enrichedPosts);
    }
  };

  const fetchAuthorInfo = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', userId)
        .single();
      
      return data;
    } catch (error) {
      console.error('Error fetching author info:', error);
      return null;
    }
  };

  const fetchEngagementData = async (postId: string) => {
    try {
      const [likesResult, commentsResult, savesResult, userLikeResult, userSaveResult] = await Promise.all([
        supabase.from('post_likes').select('id').eq('post_id', postId),
        supabase.from('post_comments').select('id').eq('post_id', postId),
        supabase.from('saved_posts').select('id').eq('post_id', postId),
        user ? supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).single() : Promise.resolve({ data: null }),
        user ? supabase.from('saved_posts').select('id').eq('post_id', postId).eq('user_id', user.id).single() : Promise.resolve({ data: null })
      ]);

      return {
        likes_count: likesResult.data?.length || 0,
        comments_count: commentsResult.data?.length || 0,
        saves_count: savesResult.data?.length || 0,
        isLiked: !!userLikeResult.data,
        isSaved: !!userSaveResult.data,
      };
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      return {
        likes_count: 0,
        comments_count: 0,
        saves_count: 0,
        isLiked: false,
        isSaved: false,
      };
    }
  };

  const handleLike = async (eventId: string) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: eventId, user_id: user.id });
      }

      // Update local state immediately for better UX
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { 
              ...e, 
              isLiked: !e.isLiked,
              likes_count: e.isLiked ? (e.likes_count || 1) - 1 : (e.likes_count || 0) + 1
            }
          : e
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (eventId: string) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: eventId, user_id: user.id });
      }

      // Update local state immediately for better UX
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { 
              ...e, 
              isSaved: !e.isSaved,
              saves_count: e.isSaved ? (e.saves_count || 1) - 1 : (e.saves_count || 0) + 1
            }
          : e
      ));

      toast({
        title: event.isSaved ? "Post unsaved" : "Post saved",
        description: event.isSaved ? "Removed from your saved posts" : "Added to your saved posts",
      });
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePostLikes = async (postId: string) => {
    const engagementData = await fetchEngagementData(postId);
    setEvents(prev => prev.map(event => 
      event.id === postId 
        ? { ...event, ...engagementData }
        : event
    ));
  };

  const updatePostComments = async (postId: string) => {
    const engagementData = await fetchEngagementData(postId);
    setEvents(prev => prev.map(event => 
      event.id === postId 
        ? { ...event, comments_count: engagementData.comments_count }
        : event
    ));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setHasNewContent(false);
    setUnreadCounts(prev => ({ ...prev, community: 0 }));
    
    try {
      // Clear cache and fetch fresh data
      if (profile) {
        const userLocation = {
          neighborhood: profile.neighborhood,
          city: profile.city,
          state: profile.state
        };
        postCache.invalidateLocation(userLocation.city, userLocation.state);
      }
      
      await fetchPosts();
      toast({
        title: "Refreshed",
        description: "Community feed updated successfully",
      });
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: "Error",
        description: "Failed to refresh feed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [user, profile]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && profile && !refreshing) {
        handleRefresh();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, profile, refreshing]);

  return {
    events: filteredEvents,
    loading,
    refreshing,
    hasNewContent,
    searchQuery,
    unreadCounts,
    setSearchQuery,
    setHasNewContent,
    setUnreadCounts,
    handleLike,
    handleSave,
    handleRefresh,
    updatePostLikes,
    updatePostComments,
    fetchPosts
  };
};