import { useLikePost, useSavePost } from '@/hooks/useFeedQuery';

/**
 * Hook for handling post engagement actions (like, save)
 */
export function usePostEngagement() {
  const likePost = useLikePost();
  const savePost = useSavePost();

  const handleLike = (postId: string, currentState: boolean) => {
    likePost.mutate({ postId, isLiked: currentState });
  };

  const handleSave = (postId: string, currentState: boolean) => {
    savePost.mutate({ postId, isSaved: currentState });
  };

  return { 
    handleLike, 
    handleSave,
    isLiking: likePost.isPending,
    isSaving: savePost.isPending,
  };
}
