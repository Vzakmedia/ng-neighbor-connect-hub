import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin,
  MessageCircle,
  User,
  Calendar,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import { PostFullScreenDialog } from '@/components/PostFullScreenDialog';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  is_verified: boolean;
}

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
}

export const UserProfileDialog = ({ 
  isOpen, 
  onClose, 
  userName, 
  userAvatar 
}: UserProfileDialogProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userName) {
      fetchUserProfile();
    }
  }, [isOpen, userName]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // First find the user by name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('full_name', userName)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Profile not found",
          description: "Could not load user profile.",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Fetch user's recent posts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('id, title, content, post_type, created_at, image_urls')
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!postsError) {
        setUserPosts(postsData || []);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getLocation = () => {
    if (!profile) return 'Unknown Location';
    return profile.neighborhood || profile.city || profile.state || 'Unknown Location';
  };

  const handleSendMessage = async () => {
    if (!profile || !user) return;
    
    try {
      // Create or find existing conversation
      const { data: existingConversation } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${user.id})`)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: user.id,
            user2_id: profile.user_id
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConversation.id;
      }

      // Navigate to messages page with the conversation
      navigate(`/messages?conversation=${conversationId}`);
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Could not start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarClick = () => {
    if (profile?.avatar_url || userAvatar) {
      setShowImageGallery(true);
    }
  };

  const handlePostClick = (post: any) => {
    // Transform the post to match the expected format
    const transformedPost = {
      ...post,
      author: {
        name: profile?.full_name || 'Anonymous User',
        avatar: profile?.avatar_url || userAvatar
      },
      likes: 0,
      comments: 0,
      isLiked: false,
      isSaved: false
    };
    setSelectedPost(transformedPost);
    setShowPostDialog(true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">User Profile</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start space-x-4">
              <Avatar 
                className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={profile.avatar_url || userAvatar} />
                <AvatarFallback className="text-lg">
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h2>
                  {profile.is_verified && (
                    <Badge variant="default" className="bg-blue-500">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocation()}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {formatDate(profile.created_at)}</span>
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}

                {user?.id !== profile.user_id && (
                  <Button onClick={handleSendMessage} className="w-full sm:w-auto">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Posts ({userPosts.length})</h3>
              
              {userPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No posts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {userPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {post.title && (
                            <h4 className="font-medium mb-1">{post.title}</h4>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                        {post.image_urls && post.image_urls.length > 0 && (
                          <img 
                            src={post.image_urls[0]} 
                            alt="Post preview"
                            className="w-16 h-16 object-cover rounded ml-3"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {post.post_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>

      {/* Image Gallery Dialog */}
      <ImageGalleryDialog
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        images={[(profile?.avatar_url || userAvatar || '')].filter(Boolean)}
        title="Profile Picture"
        initialIndex={0}
      />

      {/* Post Full Screen Dialog */}
      {selectedPost && (
        <PostFullScreenDialog
          isOpen={showPostDialog}
          onClose={() => setShowPostDialog(false)}
          post={selectedPost}
          onLike={() => {}}
          onSave={() => {}}
          onShare={() => {}}
          onProfileClick={() => {}}
        />
      )}
    </Dialog>
  );
};