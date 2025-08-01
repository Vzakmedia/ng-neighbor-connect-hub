
import { useState, useEffect } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
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
  Globe,
  Bookmark,
  Search,
  Calendar,
  Eye,
  EyeOff,
  CheckCheck,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useReadStatus } from '@/hooks/useReadStatus';
import { Input } from '@/components/ui/input';
import CommentSection from '@/components/CommentSection';
import ShareDialog from '@/components/ShareDialog';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import { PostFullScreenDialog } from '@/components/PostFullScreenDialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import PromotedContent from '@/components/PromotedContent';
import { SponsoredContent } from '@/components/SponsoredContent';


interface DatabasePost {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string;
  location: string | null;
  image_urls: string[];
  tags: string[];
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
  tags?: string[];
  isLiked: boolean;
  isSaved: boolean;
}

type FeedItem = Post;

interface CommunityFeedProps {
  activeTab?: string;
  viewScope?: 'neighborhood' | 'state';
}

type ViewScope = 'neighborhood' | 'state';

const CommunityFeed = ({ activeTab = 'all', viewScope: propViewScope }: CommunityFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<ViewScope>(propViewScope || 'neighborhood');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readStatuses, setReadStatuses] = useState<Record<string, boolean>>({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [postFullScreenOpen, setPostFullScreenOpen] = useState(false);
  const [selectedFullScreenPost, setSelectedFullScreenPost] = useState<Post | null>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { 
    unreadCounts, 
    markCommunityPostAsRead, 
    markAllCommunityPostsAsRead, 
    checkIfPostIsRead 
  } = useReadStatus();

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

    // Get saved status for this post
    const { data: savedData } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', dbPost.id)
      .eq('user_id', user?.id || '');

    const likesCount = likesData?.length || 0;
    const commentsCount = commentsData?.length || 0;
    const isLikedByUser = user ? likesData?.some(like => like.user_id === user.id) || false : false;
    const isSavedByUser = user ? (savedData?.length || 0) > 0 : false;

    // Ensure author object is always properly formed
    const authorName = dbPost.profiles?.full_name || 'Anonymous User';
    const authorAvatar = dbPost.profiles?.avatar_url || undefined;
    const authorLocation = dbPost.profiles?.neighborhood || dbPost.profiles?.city || dbPost.profiles?.state || 'Unknown Location';

    return {
      id: dbPost.id,
      author: {
        name: authorName,
        avatar: authorAvatar,
        location: authorLocation
      },
      content: dbPost.content,
      title: dbPost.title || undefined,
      type: dbPost.post_type as Post['type'],
      timestamp: formatTimeAgo(dbPost.created_at),
      likes: likesCount,
      comments: commentsCount,
      images: dbPost.image_urls || [],
      tags: dbPost.tags || [],
      isLiked: isLikedByUser,
      isSaved: isSavedByUser
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

  // Check read statuses for posts
  useEffect(() => {
    const checkReadStatuses = async () => {
      if (!user || posts.length === 0) return;
      
      const statuses: Record<string, boolean> = {};
      await Promise.all(
        posts.map(async (post) => {
          const isRead = await checkIfPostIsRead(post.id);
          statuses[post.id] = isRead;
        })
      );
      setReadStatuses(statuses);
    };

    checkReadStatuses();
  }, [posts, user, checkIfPostIsRead]);

  useEffect(() => {
    if (propViewScope) {
      setViewScope(propViewScope);
    }
  }, [propViewScope]);

  useEffect(() => {
    fetchPosts();
  }, [user, profile, viewScope]);

  // Set up safe real-time subscription for posts and interactions
  useEffect(() => {
    if (!user) return;

    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        }, () => {
          fetchPosts();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_likes'
        }, () => {
          fetchPosts();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_comments'
        }, () => {
          fetchPosts();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'saved_posts'
        }, () => {
          fetchPosts();
        }),
      {
        channelName: 'community_feed_changes',
        onError: fetchPosts,
        pollInterval: 45000,
        debugName: 'CommunityFeed'
      }
    );

    return () => {
      subscription?.unsubscribe();
      cleanupSafeSubscription('community_feed_changes', 'CommunityFeed');
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

  const toggleSave = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isSaved) {
        // Unsave the post
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isSaved: false }
            : p
        ));

        toast({
          title: "Post unsaved",
          description: "Removed from your saved posts",
        });
      } else {
        // Save the post
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isSaved: true }
            : p
        ));

        toast({
          title: "Post saved",
          description: "Added to your saved posts",
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareDialogOpen(true);
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handlePostClick = async (postId: string, event?: React.MouseEvent) => {
    // Don't open full screen if clicking on interactive elements
    if (event?.target && (event.target as HTMLElement).closest('button, a, [role="button"]')) {
      return;
    }
    
    if (!readStatuses[postId]) {
      await markCommunityPostAsRead(postId);
      setReadStatuses(prev => ({ ...prev, [postId]: true }));
    }
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedFullScreenPost(post);
      setPostFullScreenOpen(true);
    }
  };

  const handleImageClick = (images: string[], index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setImageGalleryOpen(true);
  };

  const handleProfileClick = (userName: string, userAvatar?: string) => {
    setSelectedUserName(userName);
    setSelectedUserAvatar(userAvatar);
    setUserProfileOpen(true);
  };

  // Filter posts based on search and post type
  const filteredPosts = posts.filter(post => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by post type
    const matchesType = selectedPostType === 'all' || post.type === selectedPostType;

    // Filter by read status
    const matchesReadFilter = !showUnreadOnly || !readStatuses[post.id];

    // Filter by active tab (for backward compatibility)
    let matchesTab = true;
    if (activeTab !== 'all') {
      if (activeTab === 'events') matchesTab = post.type === 'event';
      else if (activeTab === 'safety') matchesTab = post.type === 'safety';
      else if (activeTab === 'marketplace') matchesTab = post.type === 'marketplace';
      else matchesTab = post.type === activeTab;
    }

    return matchesSearch && matchesType && matchesTab && matchesReadFilter;
  });

  const postTypeFilters = [
    { key: 'all', label: 'All Posts', icon: Users },
    { key: 'general', label: 'General', icon: MessageCircle },
    { key: 'safety', label: 'Safety', icon: AlertTriangle },
    { key: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { key: 'help', label: 'Help', icon: Users },
    { key: 'event', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts, users, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Post Type Filter Buttons */}
      {/* Desktop filter buttons */}
      <div className="hidden md:flex flex-wrap gap-2">
        {postTypeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <Button
              key={filter.key}
              variant={selectedPostType === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPostType(filter.key)}
              className="text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          );
        })}
      </div>
      
      {/* Mobile filter buttons - icons only, expand when active */}
      <div className="md:hidden w-full">
        <div className="flex justify-center gap-1 w-full flex-wrap">
          {postTypeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.key}
                variant={selectedPostType === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPostType(filter.key)}
                className={`transition-all duration-300 ease-in-out ${
                  selectedPostType === filter.key 
                    ? 'px-3 flex items-center gap-2 min-w-fit' 
                    : 'px-0 w-8 h-8 justify-center'
                }`}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                {selectedPostType === filter.key && (
                  <span className="text-xs whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                    {filter.label}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* View Scope Toggle - only show if not controlled by parent */}
      {!propViewScope && (
        <div className="bg-card p-3 md:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium hidden md:inline">Viewing posts from:</span>
              <span className="text-xs font-medium md:hidden">View:</span>
            </div>
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center md:justify-end">
              <Button
                variant={viewScope === 'neighborhood' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewScope('neighborhood')}
                className={`transition-all duration-300 ease-in-out text-xs ${
                  viewScope === 'neighborhood' 
                    ? 'px-3 flex items-center gap-2 min-w-fit' 
                    : 'px-2 md:px-3 w-10 md:w-auto md:flex-none justify-center md:justify-start'
                }`}
              >
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {viewScope === 'neighborhood' && (
                  <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 md:inline">
                    <span className="hidden xs:inline">My </span>Neighborhood
                  </span>
                )}
                <span className="hidden md:inline">
                  {viewScope !== 'neighborhood' && (
                    <>
                      <span className="hidden xs:inline">My </span>Neighborhood
                    </>
                  )}
                </span>
              </Button>
              <Button
                variant={viewScope === 'state' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewScope('state')}
                className={`transition-all duration-300 ease-in-out text-xs ${
                  viewScope === 'state' 
                    ? 'px-3 flex items-center gap-2 min-w-fit' 
                    : 'px-2 md:px-3 w-10 md:w-auto md:flex-none justify-center md:justify-start'
                }`}
              >
                <Globe className="h-3 w-3 flex-shrink-0" />
                {viewScope === 'state' && (
                  <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 md:inline">
                    Entire State
                  </span>
                )}
                <span className="hidden md:inline">
                  {viewScope !== 'state' && 'Entire State'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Read Status Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-3 md:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="text-xs"
            >
              {showUnreadOnly ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            {unreadCounts.community > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCounts.community} unread
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllCommunityPostsAsRead}
          className="text-xs"
          disabled={unreadCounts.community === 0}
        >
          <CheckCheck className="h-3 w-3 mr-1" />
          Mark All Read
        </Button>
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
        <div className="space-y-6">
          {/* Banner Promotions - Full Width */}
          <PromotedContent promotionType="banner" maxItems={1} />
          
          {/* Featured Promotions - Large Cards */}
          <PromotedContent promotionType="featured" maxItems={2} />
          
          {/* Regular Posts with Boost and Highlight Promotions Interspersed */}
          {filteredPosts.map((post: Post, index) => {
            const typeBadge = getPostTypeBadge(post.type);
            
            // Extra safety check - this should now never be needed due to proper transformDatabasePost
            if (!post || !post.author) {
              console.warn('Post or post.author is undefined:', post);
              return null;
            }
            
            return (
              <div key={`post-section-${index}`} className="space-y-4">
                {/* Insert Boost promotions every 3 posts */}
                {index % 3 === 0 && index > 0 && (
                  <PromotedContent promotionType="boost" maxItems={1} />
                )}
                
                 {/* Insert Highlight promotions every 5 posts */}
                {index % 5 === 0 && index > 0 && (
                  <PromotedContent promotionType="highlight" maxItems={2} />
                )}
                
                 {/* Insert Sponsored Content every 4 posts */}
                {index % 4 === 0 && index > 0 && (
                  <SponsoredContent 
                    userLocation={profile?.city || profile?.state} 
                    limit={2}
                  />
                )}
                
                <Card
                  key={post.id} 
                  className={`shadow-card hover:shadow-elevated transition-shadow cursor-pointer ${
                    !readStatuses[post.id] ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  onClick={(e) => handlePostClick(post.id, e)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(post.author.name, post.author.avatar);
                    }}
                  >
                    <Avatar>
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>
                        {post.author.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">
                          {post.author.name}
                        </h4>
                        <Badge variant={typeBadge.variant} className="text-xs">
                          {getPostTypeIcon(post.type)}
                          <span className="ml-1">{typeBadge.label}</span>
                        </Badge>
                        {!readStatuses[post.id] && (
                          <Badge variant="default" className="text-xs bg-primary">
                            New
                          </Badge>
                        )}
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
              
              <CardContent className="pt-0 px-3 md:px-6">
                {post.title && (
                  <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2">{post.title}</h3>
                )}
                <p className="text-xs md:text-sm leading-relaxed mb-3 md:mb-4">{post.content}</p>
                
                {/* Display tags if any */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Display images if any */}
                {post.images && post.images.length > 0 && (
                  <div className={`grid gap-1 md:gap-2 mb-3 md:mb-4 ${
                    post.images.length === 1 ? 'grid-cols-1' : 
                    post.images.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2'
                  }`}>
                    {post.images.slice(0, 4).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt="Post image"
                        className="w-full h-24 md:h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => handleImageClick(post.images!, index, e)}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 md:pt-3 border-t">
                  <div className="flex items-center gap-2 md:gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={`${post.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive px-2 md:px-3 h-8 md:h-9`}
                    >
                      <Heart className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs md:text-sm">{post.likes}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                      className="text-muted-foreground hover:text-primary px-2 md:px-3 h-8 md:h-9"
                    >
                      <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="text-xs md:text-sm">{post.comments}</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleSave(post.id)}
                      className={`${post.isSaved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary px-2 md:px-3 h-8 md:h-9`}
                    >
                      <Bookmark className={`h-3 w-3 md:h-4 md:w-4 ${post.isSaved ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(post)}
                      className="text-muted-foreground hover:text-primary px-2 md:px-3 h-8 md:h-9"
                    >
                      <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Comment Section */}
                {openComments.has(post.id) && (
                  <CommentSection 
                    postId={post.id}
                    commentCount={post.comments}
                  />
                )}
              </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
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

      {/* Image Gallery Dialog */}
      <ImageGalleryDialog
        isOpen={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        images={selectedImages}
        title="Post Images"
        initialIndex={selectedImageIndex}
      />

      {/* Post Full Screen Dialog */}
      <PostFullScreenDialog
        isOpen={postFullScreenOpen}
        onClose={() => setPostFullScreenOpen(false)}
        post={selectedFullScreenPost}
        onLike={toggleLike}
        onSave={toggleSave}
        onShare={handleShare}
        onProfileClick={handleProfileClick}
      />

      {/* User Profile Dialog */}
      <UserProfileDialog
        isOpen={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        userName={selectedUserName}
        userAvatar={selectedUserAvatar}
      />
    </div>
  );
};

export default CommunityFeed;
