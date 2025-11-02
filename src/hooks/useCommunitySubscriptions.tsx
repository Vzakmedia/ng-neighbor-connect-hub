import { useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { User } from "@supabase/supabase-js";
import { useNewPostsStore } from '@/components/NewPostsBanner';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

interface Profile {
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface UseCommunitySubscriptionsProps {
  user: User | null;
  profile: Profile | null;
  currentLocationFilter: string;
  onNewContent: () => void;
  onUpdateUnreadCounts: (updater: (prev: any) => any) => void;
  onRefreshPosts: () => void;
  onUpdatePostLikes: (postId: string) => void;
  onUpdatePostComments: (postId: string) => void;
}

export const useCommunitySubscriptions = ({
  user,
  profile,
  currentLocationFilter,
  onNewContent,
  onUpdateUnreadCounts,
  onRefreshPosts,
  onUpdatePostLikes,
  onUpdatePostComments
}: UseCommunitySubscriptionsProps) => {
  const queryClient = useQueryClient();
  const { setHasNewPosts } = useNewPostsStore();
  const { onCommunityPost, onPostLike, onPostComment } = useRealtimeContext();

  useEffect(() => {
    if (!user || !profile) return;

    console.log('[CommunitySubscriptions] Using unified real-time subscriptions');

    // Subscribe to community post events
    const unsubscribePosts = onCommunityPost((payload) => {
      console.log('Community posts change:', payload);
      
      if (payload.eventType === 'INSERT') {
        setHasNewPosts(true);
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        onNewContent();
      }
      
      if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        onRefreshPosts();
      }
    });

    // Subscribe to post like events
    const unsubscribeLikes = onPostLike((payload) => {
      console.log('Post likes change:', payload);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
        onUpdatePostLikes(postId);
      }
    });

    // Subscribe to post comment events
    const unsubscribeComments = onPostComment((payload) => {
      console.log('Post comments change:', payload);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
        onUpdatePostComments(postId);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [user, profile, onCommunityPost, onPostLike, onPostComment, onNewContent, onRefreshPosts, onUpdatePostLikes, onUpdatePostComments, queryClient, setHasNewPosts]);
};