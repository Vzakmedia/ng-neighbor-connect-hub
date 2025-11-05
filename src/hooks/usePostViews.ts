import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track post views for recommendation algorithm
 */
export function usePostViews() {
  const { user } = useAuth();

  const trackPostView = async (postId: string) => {
    if (!user) return;

    try {
      // Use upsert to avoid duplicates (post_views has unique constraint on user_id, post_id)
      await supabase
        .from('post_views')
        .upsert({
          user_id: user.id,
          post_id: postId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,post_id'
        });
    } catch (error) {
      // Silently fail - view tracking shouldn't interrupt user experience
      console.error('Error tracking post view:', error);
    }
  };

  return { trackPostView };
}
