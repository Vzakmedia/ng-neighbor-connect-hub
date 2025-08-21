import { useState, useEffect } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnlineAvatar from '@/components/OnlineAvatar';
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
  Calendar,
  Eye,
  EyeOff,
  CheckCheck,
  X,
  ChevronDown,
  Home,
  Building,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useReadStatus } from '@/hooks/useReadStatus';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import CommentSection from '@/components/CommentSection';
import ShareDialog from '@/components/ShareDialog';
import { ImageGalleryDialog } from '@/components/ImageGalleryDialog';
import { PostFullScreenDialog } from '@/components/PostFullScreenDialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { PromotePostButton } from '@/components/PromotePostButton';
import PromotedContent from '@/components/PromotedContent';
import { SponsoredContent } from '@/components/SponsoredContent';
import FeedAdCard from '@/components/FeedAdCard';
import BoardSuggestionCard from '@/components/BoardSuggestionCard';
import { usePromotionalAds } from '@/hooks/usePromotionalAds';
import { useBoardSuggestions } from '@/hooks/useBoardSuggestions';
import { PromotionalFeedIntegration } from '@/components/promotional/PromotionalFeedIntegration';
import { usePromotionalContent } from '@/hooks/promotional/usePromotionalContent';
import { PromotionalAd } from '@/types/promotional';
import { postCache, CachedPost, CacheStats } from '@/services/postCache';


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
  user_id: string;
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
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  location?: string;
}

type PostType = 'all' | 'general' | 'safety' | 'marketplace' | 'help' | 'event';
type ViewScope = 'neighborhood' | 'city' | 'state';

const CommunityFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PostType>('all');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [inlineComments, setInlineComments] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [fullScreenPost, setFullScreenPost] = useState<Post | null>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState('');
  const [viewScope, setViewScope] = useState<ViewScope>('neighborhood');
  const [promotionalContent, setPromotionalContent] = useState<PromotionalAd[]>([]);
  
  // Cache-related state
  const [cacheStats, setCacheStats] = useState<CacheStats>({ 
    hits: 0, 
    misses: 0, 
    size: 0,
    lastUpdated: null 
  });
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    community: 0,
    emergency: 0,
    marketplace: 0
  });

  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { markAsRead, unreadCounts: globalUnreadCounts } = useReadStatus();
  const { ads } = usePromotionalAds();
  const { suggestedBoards } = useBoardSuggestions();
  const { content: promotionalFeedContent } = usePromotionalContent();

  const postTypeFilters = [
    { id: 'all', label: 'All Posts', icon: Globe },
    { id: 'general', label: 'General', icon: MessageCircle },
    { id: 'safety', label: 'Safety', icon: AlertTriangle },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'help', label: 'Help', icon: Users },
    { id: 'event', label: 'Events', icon: Calendar }
  ];

  useEffect(() => {
    if (user && profile) {
      // Initialize with cache stats
      setCacheStats(postCache.getStats());
      fetchPosts();
    }
  }, [user, profile, viewScope, selectedType]);

  // Auto-refresh cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && profile && !refreshing) {
        handleRefresh();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [user, profile, refreshing]);

  useEffect(() => {
    if (!user || !profile) return;

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
            (payload) => {
              console.log('Community posts change:', payload);
              
              if (payload.eventType === 'INSERT') {
                setHasNewContent(true);
                setUnreadCounts(prev => ({
                  ...prev,
                  community: prev.community + 1
                }));
                
                // Invalidate cache for new content
                const userLocation = {
                  neighborhood: profile.neighborhood,
                  city: profile.city,
                  state: profile.state
                };
                postCache.invalidate(userLocation);
              }
              
              if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                // Update posts in real-time
                fetchPosts();
              }
            }
          )
          .subscribe(),
      
      createSafeSubscription(
        supabase
          .channel('post_likes_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'post_likes' }, 
            (payload) => {
              console.log('Post likes change:', payload);
              
              if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                const postId = payload.new?.post_id || payload.old?.post_id;
                updatePostLikes(postId);
              }
            }
          )
          .subscribe(),
      
      createSafeSubscription(
        supabase
          .channel('post_comments_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'post_comments' }, 
            (payload) => {
              console.log('Post comments change:', payload);
              
              if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
                const postId = payload.new?.post_id || payload.old?.post_id;
                updatePostComments(postId);
              }
            }
          )
          .subscribe()
      )
    ];

    return () => {
      subscriptions.forEach(cleanup => cleanup());
    };
  }, [user, profile]);

  const fetchPosts = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      
      const userLocation = {
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      };

      // Try to get from cache first
      const cachedPosts = await postCache.get(userLocation, viewScope, selectedType);
      if (cachedPosts) {
        console.log('🎯 Cache HIT - using cached posts');
        setPosts(cachedPosts);
        setCacheStats(postCache.getStats());
        setLoading(false);
        return;
      }

      console.log('💾 Cache MISS - fetching from database');
      
      const { data, error } = await supabase
        .rpc('get_location_filtered_posts', {
          user_neighborhood: profile.neighborhood,
          user_city: profile.city,
          user_state: profile.state,
          scope_filter: viewScope,
          post_type_filter: selectedType === 'all' ? null : selectedType
        });

      if (error) throw error;

      const transformedPosts = await Promise.all(
        (data || []).map(async (post: DatabasePost) => {
          const [likesResult, commentsResult, isLikedResult, isSavedResult] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single(),
            supabase
              .from('saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single()
          ]);

          return {
            id: post.id,
            user_id: post.user_id,
            author: {
              name: post.profiles?.full_name || 'Anonymous',
              avatar: post.profiles?.avatar_url,
              location: post.profiles ? 
                [post.profiles.neighborhood, post.profiles.city, post.profiles.state]
                  .filter(Boolean).join(', ') : 'Unknown'
            },
            content: post.content,
            title: post.title || undefined,
            type: post.post_type as Post['type'],
            timestamp: post.created_at,
            likes: likesResult.count || 0,
            comments: commentsResult.count || 0,
            images: post.image_urls,
            tags: post.tags,
            isLiked: !isLikedResult.error,
            isSaved: !isSavedResult.error,
            location: post.location || undefined
          };
        })
      );

      // Cache the results
      await postCache.set(userLocation, viewScope, selectedType, transformedPosts);
      
      setPosts(transformedPosts);
      setCacheStats(postCache.getStats());
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user || !profile || refreshing) return;

    setRefreshing(true);
    try {
      const userLocation = {
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      };

      // Force invalidate cache and refetch
      postCache.invalidate(userLocation);
      await fetchPosts();
      setHasNewContent(false);
      setUnreadCounts(prev => ({ ...prev, community: 0 }));
      
      toast({
        title: "Refreshed",
        description: "Community feed updated with latest posts.",
      });
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: "Error",
        description: "Failed to refresh feed.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const updatePostLikes = async (postId: string) => {
    try {
      const { count } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      const { data: isLiked } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user?.id)
        .single();

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: count || 0, isLiked: !!isLiked }
          : post
      ));
    } catch (error) {
      console.error('Error updating post likes:', error);
    }
  };

  const updatePostComments = async (postId: string) => {
    try {
      const { count } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments: count || 0 }
          : post
      ));
    } catch (error) {
      console.error('Error updating post comments:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: user.id });
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isSaved: !p.isSaved }
          : p
      ));

      toast({
        title: post.isSaved ? "Post Unsaved" : "Post Saved",
        description: post.isSaved ? "Post removed from saved items." : "Post saved to your collection.",
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(showComments === postId ? null : postId);
  };

  const toggleInlineComments = (postId: string) => {
    setInlineComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAvatarClick = (name: string, avatar?: string) => {
    setSelectedUserName(name);
    setSelectedUserAvatar(avatar || '');
    setUserProfileOpen(true);
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareOpen(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return AlertTriangle;
      case 'marketplace': return ShoppingCart;
      case 'help': return Users;
      case 'event': return Calendar;
      default: return MessageCircle;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'marketplace': return 'bg-green-100 text-green-800 border-green-200';
      case 'help': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache stats and controls */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-lg p-4 border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">
              Cache: {cacheStats.hits}H/{cacheStats.misses}M ({cacheStats.size} items)
            </span>
          </div>
          
          {cacheStats.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(cacheStats.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Post Type Filter Buttons */}
      <div className="hidden md:flex items-center justify-center">
        <div className="flex gap-2">
          {postTypeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={selectedType === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(filter.id as PostType)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Location scope selector */}
      <div className="flex items-center gap-2">
        <Tabs value={viewScope} onValueChange={(value: ViewScope) => setViewScope(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="neighborhood" className="text-xs flex items-center gap-1">
              <Home className="h-3 w-3" />
              Neighbourhood
            </TabsTrigger>
            <TabsTrigger value="city" className="text-xs flex items-center gap-1">
              <Building className="h-3 w-3" />
              City
            </TabsTrigger>
            <TabsTrigger value="state" className="text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" />
              State
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Input
          placeholder="Search posts, tags, or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Mobile filter dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {(() => {
                  const filter = postTypeFilters.find(f => f.id === selectedType);
                  const Icon = filter?.icon || Globe;
                  return (
                    <>
                      <Icon className="h-4 w-4" />
                      {filter?.label || 'All Posts'}
                    </>
                  );
                })()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {postTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id as PostType)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Promotional Content Integration */}
      <PromotionalFeedIntegration />

      {/* Board Suggestions */}
      {suggestedBoards.length > 0 && (
        <div className="grid gap-4">
          {suggestedBoards.slice(0, 2).map((board) => (
            <BoardSuggestionCard key={board.id} board={board} />
          ))}
        </div>
      )}

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No posts found</h3>
            <p className="text-gray-500 text-center">
              {searchQuery 
                ? `No posts match "${searchQuery}". Try a different search term.`
                : "There are no posts in this area yet. Be the first to share something!"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, index) => {
            const PostTypeIcon = getPostTypeIcon(post.type);
            
            return (
              <div key={post.id}>
                <Card className="w-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleAvatarClick(post.author.name, post.author.avatar)}
                        >
                          <OnlineAvatar 
                            userId={post.user_id}
                            src={post.author.avatar}
                            fallback={post.author.name.charAt(0)}
                            size="md"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 
                            className="font-medium text-sm cursor-pointer hover:underline"
                            onClick={() => handleAvatarClick(post.author.name, post.author.avatar)}
                          >
                            {post.author.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{post.author.location}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getPostTypeColor(post.type)} text-xs`}
                        >
                          <PostTypeIcon className="h-3 w-3 mr-1" />
                          {post.type}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setFullScreenPost(post)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(post)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSave(post.id)}>
                              <Bookmark className={`h-4 w-4 mr-2 ${post.isSaved ? 'fill-current' : ''}`} />
                              {post.isSaved ? 'Unsave' : 'Save'}
                            </DropdownMenuItem>
                            {user?.id === post.user_id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <PromotePostButton postId={post.id} />
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {post.title && (
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                    )}
                    
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    
                    {post.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                    )}
                    
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {post.images.slice(0, 6).map((image, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => {
                              setSelectedImages(post.images || []);
                              setImageGalleryOpen(true);
                            }}
                          >
                            <img
                              src={image}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            {post.images && post.images.length > 6 && idx === 5 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  +{post.images.length - 6} more
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleInlineComments(post.id)}
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-2 text-gray-500 hover:text-green-500"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSave(post.id)}
                          className={`${post.isSaved ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
                        >
                          <Bookmark className={`h-4 w-4 ${post.isSaved ? 'fill-current' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFullScreenPost(post)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {inlineComments.has(post.id) && (
                      <CommentSection postId={post.id} />
                    )}
                  </CardContent>
                </Card>

                {/* Insert ads and sponsored content between posts */}
                {index === 2 && ads.length > 0 && (
                  <FeedAdCard ad={ads[0]} />
                )}
                
                {index === 5 && (
                  <SponsoredContent />
                )}
                
                {index === 8 && promotionalFeedContent.length > 0 && (
                  <PromotedContent content={promotionalFeedContent[0]} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        post={selectedPost}
      />

      <ImageGalleryDialog
        open={imageGalleryOpen}
        onOpenChange={setImageGalleryOpen}
        images={selectedImages}
      />

      <PostFullScreenDialog
        post={fullScreenPost}
        onClose={() => setFullScreenPost(null)}
      />

      <UserProfileDialog
        open={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        userName={selectedUserName}
        userAvatar={selectedUserAvatar}
      />
    </div>
  );
};

export default CommunityFeed;
