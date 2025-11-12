import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PostDetails {
  content: string;
  author_name: string;
}

export const useCommunityPostToasts = () => {
  const { onCommunityPost } = useRealtimeContext();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const recentPostIds = useRef<Set<string>>(new Set());
  const lastToastTime = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = onCommunityPost(async (payload) => {
      // Only show toasts for new posts (INSERT events)
      if (payload.eventType !== 'INSERT') return;

      // Don't show toasts when on community or home routes
      const isCommunityRoute = location.pathname === '/community' || location.pathname === '/';
      if (isCommunityRoute) return;

      const postId = payload.new?.id;
      if (!postId) return;

      // Prevent duplicate toasts for the same post
      if (recentPostIds.current.has(postId)) return;
      recentPostIds.current.add(postId);

      // Cleanup old post IDs after 30 seconds
      setTimeout(() => {
        recentPostIds.current.delete(postId);
      }, 30000);

      // Cooldown between toasts (2 seconds)
      const now = Date.now();
      if (now - lastToastTime.current < 2000) return;
      lastToastTime.current = now;

      try {
        // Fetch post details with author information
        const { data: postData, error } = await supabase
          .from('community_posts')
          .select('content, author_name')
          .eq('id', postId)
          .single();

        if (error || !postData) {
          console.error('Failed to fetch post details for toast:', error);
          return;
        }

        const { content, author_name } = postData as PostDetails;
        
        // Create content preview (first 60 characters)
        const contentPreview = content.length > 60 
          ? `${content.substring(0, 60)}...` 
          : content;

        // Show toast notification
        toast({
          title: "New community post",
          description: `${author_name}: ${contentPreview}`,
          action: (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/community')}
              className="shrink-0"
            >
              View
            </Button>
          ),
          duration: 6000, // 6 seconds to allow reading
        });
      } catch (error) {
        console.error('Error showing community post toast:', error);
      }
    });

    return unsubscribe;
  }, [location.pathname, onCommunityPost, toast, navigate]);
};
