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
          console.error('Error unsubscribing:', error);
        }
      };
    };

    console.log('Setting up real-time subscriptions for community feed');

    const subscriptions = [
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

    return () => {
      subscriptions.forEach(cleanup => cleanup());
    };
  }, [user, profile, currentLocationFilter, onNewContent, onUpdateUnreadCounts, onRefreshPosts, onUpdatePostLikes, onUpdatePostComments]);
};