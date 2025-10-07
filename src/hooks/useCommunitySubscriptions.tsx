import { useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNewPostsStore } from '@/components/NewPostsBanner';

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
  useEffect(() => {
    if (!user || !profile) return;

    const createSafeSubscription = (subscription: any) => {
      return () => {
        try {
          subscription?.unsubscribe?.();
        } catch (error) {
          console.debug('Error unsubscribing:', error);
        }
      };
    };

    console.log('Setting up real-time subscriptions for community feed');

    // Detect iOS - realtime might be disabled
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    let subscriptions: Array<() => void> = [];
    
    try {
      subscriptions = [
      createSafeSubscription(
        supabase
          .channel('community_posts_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'community_posts',
              filter: `post_type=neq.private_message`
            }, 
            async (payload) => {
              console.log('Community posts change:', payload);
              
              if (payload.eventType === 'INSERT') {
                // Show banner and invalidate React Query cache
                setHasNewPosts(true);
                queryClient.invalidateQueries({ queryKey: ['feed'] });
                onNewContent();
              }
              
              if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                // Update posts in real-time
                onRefreshPosts();
              }
            }
          )
          .subscribe()
      ),
      
      createSafeSubscription(
        supabase
          .channel('post_likes_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'post_likes' }, 
            (payload) => {
              console.log('Post likes change:', payload);
              
              if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                onUpdatePostLikes(postId);
              }
            }
          )
          .subscribe()
      ),
      
      createSafeSubscription(
        supabase
          .channel('post_comments_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'post_comments' }, 
            (payload) => {
              console.log('Post comments change:', payload);
              
              if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                onUpdatePostComments(postId);
              }
            }
        )
          .subscribe()
      )
      ];
    } catch (error: any) {
      // Handle realtime subscription errors gracefully (especially on iOS)
      if (error?.name === 'SecurityError' || error?.message?.includes('insecure') || error?.message?.includes('WebSocket')) {
        console.log('[CommunitySubscriptions] Realtime unavailable (likely iOS), app will function without live updates');
        
        if (isIOS) {
          console.log('[CommunitySubscriptions] iOS detected - continuing without realtime features');
        }
      } else {
        console.error('[CommunitySubscriptions] Unexpected error setting up subscriptions:', error);
      }
    }

    return () => {
      try {
        subscriptions.forEach(cleanup => cleanup());
      } catch (error) {
        console.debug('[CommunitySubscriptions] Error during cleanup (ignored):', error);
      }
    };
  }, [user, profile, currentLocationFilter, onNewContent, onUpdateUnreadCounts, onRefreshPosts, onUpdatePostLikes, onUpdatePostComments, queryClient, setHasNewPosts]);
};