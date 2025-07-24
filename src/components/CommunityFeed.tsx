import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Users,
  Filter,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import CommentDropdown from '@/components/CommentDropdown';
import ShareDialog from '@/components/ShareDialog';


interface DatabasePost {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string;
  location: string | null;
  image_urls: string[];
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    location: string;
  };
  content: string;
  title?: string;
  type: 'general' | 'safety' | 'marketplace' | 'help' | 'event';
  timestamp: string;
  likes: number;
  comments: number;
  images?: string[];
  isLiked: boolean;
}

type FeedItem = Post;

interface CommunityFeedProps {
  activeTab?: string;
}

type ViewScope = 'neighborhood' | 'state';

const CommunityFeed = ({ activeTab = 'all' }: CommunityFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<ViewScope>('neighborhood');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const transformDatabasePost = async (dbPost: DatabasePost): Promise<Post> => {
    // Get like count and user's like status for this post
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', dbPost.id);

    // Get comment count for this post
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('id')
      .eq('post_id', dbPost.id);

    const likesCount = likesData?.length || 0;
    const commentsCount = commentsData?.length || 0;
    const isLikedByUser = user ? likesData?.some(like => like.user_id === user.id) || false : false;

    return {
      id: dbPost.id,
      author: {
        name: dbPost.profiles?.full_name || 'Anonymous User',
        avatar: dbPost.profiles?.avatar_url || undefined,
        location: dbPost.profiles?.neighborhood || dbPost.profiles?.city || 'Unknown Location'
      },
      content: dbPost.content,
      title: dbPost.title || undefined,
      type: dbPost.post_type as Post['type'],
      timestamp: formatTimeAgo(dbPost.created_at),
      likes: likesCount,
      comments: commentsCount,
      images: dbPost.image_urls || [],
      isLiked: isLikedByUser
    };
  };

  const fetchPosts = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      // First, get all posts
      let postsQuery = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        toast({
          title: "Error loading posts",
          description: "Failed to load community posts.",
          variant: "destructive",
        });
        return;
      }

      // Get all unique user IDs from posts
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user_id to profile for easy lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Filter posts based on location and transform them
      const filteredAndTransformed = (postsData || [])
        .map(post => {
          const userProfile = profilesMap.get(post.user_id);
          return {
            ...post,
            profiles: userProfile || null
          };
        })
        .filter(post => {
          // Apply location filtering
          if (viewScope === 'neighborhood' && profile.neighborhood) {
            return post.profiles?.neighborhood === profile.neighborhood;
          } else if (viewScope === 'state' && profile.state) {
            return post.profiles?.state === profile.state;
          }
          return true; // If no filtering criteria, show all posts
        });

      // Process all posts with their like/comment counts
      const processedPosts = await Promise.all(filteredAndTransformed.map(transformDatabasePost));
      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, profile, viewScope]);

  // Set up real-time subscription for posts and interactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('community_feed_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, viewScope]);


  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marketplace':
        return <ShoppingCart className="h-4 w-4 text-community-green" />;
      case 'help':
        return <Users className="h-4 w-4 text-community-blue" />;
      case 'event':
        return <Users className="h-4 w-4 text-community-yellow" />;
      default:
        return null;
    }
  };

  const getPostTypeBadge = (type: string) => {
    const badges = {
      safety: { label: 'Safety Alert', variant: 'destructive' as const },
      marketplace: { label: 'For Sale', variant: 'secondary' as const },
      help: { label: 'Need Help', variant: 'outline' as const },
      event: { label: 'Community Event', variant: 'default' as const },
      general: { label: 'General', variant: 'outline' as const },
    };
    
    return badges[type as keyof typeof badges] || badges.general;
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: false, likes: p.likes - 1 }
            : p
        ));

        toast({
          title: "Removed like",
          description: "You unliked this post",
        });
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: true, likes: p.likes + 1 }
            : p
        ));

        toast({
          title: "Liked post",
          description: "You liked this post",
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareDialogOpen(true);
  };

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'events') return post.type === 'event';
    if (activeTab === 'safety') return post.type === 'safety';
    if (activeTab === 'marketplace') return post.type === 'marketplace';
    return post.type === activeTab;
  });

  return (
    <div className="space-y-4">
      {/* View Scope Toggle */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Viewing posts from:</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewScope === 'neighborhood' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewScope('neighborhood')}
            className="text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            My Neighborhood
          </Button>
          <Button
            variant={viewScope === 'state' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewScope('state')}
            className="text-xs"
          >
            <Globe className="h-3 w-3 mr-1" />
            Entire State
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No posts found for this {viewScope === 'neighborhood' ? 'neighborhood' : 'state'} and category.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to start a conversation!
          </p>
        </div>
      ) : (
        filteredPosts.map((post: Post) => {
          const typeBadge = getPostTypeBadge(post.type);
          
          return (
            <Card key={post.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{post.author.name}</h4>
                        <Badge variant={typeBadge.variant} className="text-xs">
                          {getPostTypeIcon(post.type)}
                          <span className="ml-1">{typeBadge.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{post.author.location}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {post.title && (
                  <h3 className="font-semibold text-base mb-2">{post.title}</h3>
                )}
                <p className="text-sm leading-relaxed mb-4">{post.content}</p>
                
                {/* Display images if any */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.images.slice(0, 4).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt="Post image"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={`${post.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </Button>
                    <CommentDropdown 
                      postId={post.id}
                      commentCount={post.comments}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleShare(post)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}


      {/* Share Dialog */}
      {selectedPost && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          postContent={selectedPost.content}
          postAuthor={selectedPost.author.name}
        />
      )}
    </div>
  );
};

export default CommunityFeed;