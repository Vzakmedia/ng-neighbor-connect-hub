import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/community/post/PostCard';
import { transformToCardData } from '@/lib/community/postTransformers';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useLikePost, useSavePost } from '@/hooks/useFeedQuery';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(true);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id || !user) throw new Error('Missing post ID or user');

      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postError) throw postError;
      if (!postData) throw new Error('Post not found');

      // Fetch author profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, city, state')
        .eq('user_id', postData.user_id)
        .single();

      // Fetch engagement counts
      const [likesResult, commentsResult, savesResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id),
        supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id),
        supabase
          .from('saved_posts')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id),
      ]);

      // Check if current user has liked/saved
      const [userLikeResult, userSaveResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('saved_posts')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      return {
        ...postData,
        author_name: profileData?.full_name || 'Unknown',
        author_avatar: profileData?.avatar_url || null,
        author_city: profileData?.city || null,
        author_state: profileData?.state || null,
        like_count: likesResult.count || 0,
        comment_count: commentsResult.count || 0,
        save_count: savesResult.count || 0,
        is_liked: !!userLikeResult.data,
        is_saved: !!userSaveResult.data,
        post_type: postData.post_type || 'general',
      };
    },
    enabled: !!id && !!user,
  });

  const likeMutation = useLikePost();
  const saveMutation = useSavePost();

  const handleLike = () => {
    if (id && post) {
      likeMutation.mutate({ postId: id, isLiked: post.is_liked });
    }
  };

  const handleSave = () => {
    if (id && post) {
      saveMutation.mutate({ postId: id, isSaved: post.is_saved });
    }
  };

  const handleRSVP = () => {
    toast.info('RSVP feature coming soon!');
  };

  const handleAvatarClick = (userId: string) => {
    navigate(`/profile?user=${userId}`);
  };

  const handleImageClick = (imageIndex: number) => {
    // Image viewer could be added here
    console.log('Image clicked:', imageIndex);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">Post Not Found</h1>
        <p className="text-muted-foreground">The post you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/community')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
      </div>
    );
  }

  const transformedPost = transformToCardData(post);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <PostCard
          post={transformedPost}
          onLike={handleLike}
          onSave={handleSave}
          onShare={() => {
            if (navigator.share) {
              navigator.share({
                title: post.title || 'Community Post',
                text: post.content,
                url: window.location.href,
              });
            } else {
              toast.success('Link copied to clipboard!');
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          onRSVP={handleRSVP}
          onAvatarClick={handleAvatarClick}
          onImageClick={handleImageClick}
          showComments={showComments}
          onToggleComments={() => setShowComments(!showComments)}
          onPostClick={() => {}}
        />
      </div>
    </div>
  );
}
