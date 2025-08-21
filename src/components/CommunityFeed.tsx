
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
  RefreshCw
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
  tags?: string[];
  isLiked: boolean;
  isSaved: boolean;
}

type FeedItem = Post | { type: 'ad'; ad: any } | { type: 'board_suggestion'; board: any } | { type: 'sponsored_content'; content: any };

interface CommunityFeedProps {
  activeTab?: string;
  viewScope?: 'neighborhood' | 'city' | 'state';
}

type ViewScope = 'neighborhood' | 'city' | 'state';

const CommunityFeed = ({ activeTab = 'all', viewScope: propViewScope }: CommunityFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [backgroundPosts, setBackgroundPosts] = useState<Post[]>([]);
  const [hasNewContent, setHasNewContent] = useState(false);
  const { ads: promotionalAds } = usePromotionalAds(5);
  const { sponsoredContent, promotionalAds: newPromotionalAds, loading: promotionalLoading, logInteraction } = usePromotionalContent(5);
  const [viewScope, setViewScope] = useState<ViewScope>(() => {
    // Default to neighborhood
    const saved = localStorage.getItem('communityFeedViewScope') as ViewScope;
    return propViewScope || saved || 'neighborhood';
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readStatuses, setReadStatuses] = useState<Record<string, boolean>>({});
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [postFullScreenOpen, setPostFullScreenOpen] = useState(false);
  const [selectedFullScreenPost, setSelectedFullScreenPost] = useState<Post | null>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>(undefined);
  const [inlineComments, setInlineComments] = useState<Set<string>>(new Set());
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { 
    unreadCounts, 
    markCommunityPostAsRead, 
    markAllCommunityPostsAsRead, 
    checkIfPostIsRead 
  } = useReadStatus();
  const { suggestions: boardSuggestions, refreshSuggestions } = useBoardSuggestions(2);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const transformDatabasePost = (dbPost: DatabasePost): Post => {
    // Basic transformation without expensive queries
    const authorName = dbPost.profiles?.full_name || 'Anonymous User';
    const authorAvatar = dbPost.profiles?.avatar_url || undefined;
    const authorLocation = dbPost.profiles?.neighborhood || dbPost.profiles?.city || dbPost.profiles?.state || 'Unknown Location';

    return {
      id: dbPost.id,
      user_id: dbPost.user_id,
      author: {
        name: authorName,
        avatar: authorAvatar,
        location: authorLocation
      },
      content: dbPost.content,
      title: dbPost.title || undefined,
      type: dbPost.post_type as Post['type'],
      timestamp: formatTimeAgo(dbPost.created_at),
      likes: 0, // Will be loaded separately
      comments: 0, // Will be loaded separately
      images: dbPost.image_urls || [],
      tags: dbPost.tags || [],
      isLiked: false, // Will be loaded separately
      isSaved: false // Will be loaded separately
    };
  };

  // Separate function to load post dependencies (likes, comments, saved status)
  const loadPostDependencies = async (posts: Post[]) => {
    if (!user || posts.length === 0) return posts;

    console.log('CommunityFeed: Loading post dependencies for', posts.length, 'posts');

    const postIds = posts.map(p => p.id);

    try {
      // Batch load all dependencies in parallel
      const [likesData, commentsData, savedData] = await Promise.all([
        // Get like counts and user's like status
        supabase
          .from('post_likes')
          .select('post_id, user_id')
          .in('post_id', postIds),
        
        // Get comment counts
        supabase
          .from('post_comments')
          .select('post_id, id')
          .in('post_id', postIds),
        
        // Get user's saved status
        supabase
          .from('saved_posts')
          .select('post_id, id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
      ]);

      // Process the data into maps for efficient lookup
      const likesMap = new Map<string, { count: number; isLiked: boolean }>();
      const commentsMap = new Map<string, number>();
      const savedMap = new Set<string>();

      // Process likes data
      likesData.data?.forEach(like => {
        const current = likesMap.get(like.post_id) || { count: 0, isLiked: false };
        current.count += 1;
        if (like.user_id === user.id) {
          current.isLiked = true;
        }
        likesMap.set(like.post_id, current);
      });

      // Process comments data
      commentsData.data?.forEach(comment => {
        commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1);
      });

      // Process saved data
      savedData.data?.forEach(saved => {
        savedMap.add(saved.post_id);
      });

      // Update posts with dependency data
      return posts.map(post => ({
        ...post,
        likes: likesMap.get(post.id)?.count || 0,
        isLiked: likesMap.get(post.id)?.isLiked || false,
        comments: commentsMap.get(post.id) || 0,
        isSaved: savedMap.has(post.id)
      }));

    } catch (error) {
      console.error('Error loading post dependencies:', error);
      return posts; // Return posts without dependencies if error
    }
  };

  const fetchPosts = async (isInitialLoad = false) => {
    if (!user) {
      console.log('CommunityFeed: No user found, skipping fetch');
      return;
    }
    
    // Allow posts to load even without complete profile, with fallback behavior
    if (!profile) {
      console.log('CommunityFeed: Profile still loading, will show all posts for now');
    }
    
    console.log('CommunityFeed: Starting optimized fetch posts', { viewScope, user: user.id, isInitialLoad, hasProfile: !!profile });
    
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Use the new location filtering function based on exact view scope
      console.log('CommunityFeed: Fetching posts with params:', {
        viewScope,
        user_neighborhood: viewScope === 'neighborhood' ? profile?.neighborhood : null,
        user_city: viewScope === 'city' ? profile?.city : null,
        user_state: viewScope === 'state' ? profile?.state : null,
        profile: profile
      });
      
      const response = await supabase.rpc('get_location_filtered_posts', {
        user_neighborhood: viewScope === 'neighborhood' ? profile?.neighborhood || null : null,
        user_city: viewScope === 'city' ? profile?.city || null : null,
        user_state: viewScope === 'state' ? profile?.state || null : null,
        show_all_posts: !profile, // Show all posts if profile not loaded yet
        post_limit: 50,
        post_offset: 0
      });
      
      console.log('CommunityFeed: Database response:', response);
      
      const postsData = response.data;
      const postsError = response.error;

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        toast({
          title: "Error loading posts",
          description: "Network connection issue. Please check your internet connection and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Step 2: Get user profiles for post authors (batch query)
      const userIds = [...new Set(postsData?.map((post: any) => post.user_id) || [])].filter(Boolean) as string[];
      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Step 3: Create profile map and transform posts
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, {
          full_name: p.display_name,
          avatar_url: p.avatar_url,
          neighborhood: p.neighborhood,
          city: p.city,
          state: p.state,
        }])
      );

      // Transform posts with profile data (location filtering already done by the function)
      const filteredAndTransformed = (postsData || [])
        .map((post: any) => {
          const userProfile = profilesMap.get(post.user_id);
          return {
            ...post,
            profiles: userProfile || null
          };
        })
        .filter((post: any) => post.profiles !== null);

      // Step 4: Transform to Post objects (fast, no DB queries)
      const transformedPosts = filteredAndTransformed.map(transformDatabasePost);
      
      // Step 5: Set basic posts immediately for fast UI update
      console.log('CommunityFeed: Setting basic posts', { count: transformedPosts.length, viewScope });
      setPosts(transformedPosts);
      setLastFetchTime(new Date());
      
      if (isInitialLoad) {
        setLoading(false);
      }

      // Step 6: Load dependencies asynchronously (likes, comments, saved status)
      const postsWithDependencies = await loadPostDependencies(transformedPosts);
      console.log('CommunityFeed: Updated posts with dependencies');
      setPosts(postsWithDependencies);

    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Connection Error",
        description: "Unable to load posts. Please check your internet connection.",
        variant: "destructive",
      });
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const backgroundRefresh = async () => {
    if (!user || !lastFetchTime) return;
    
    try {
      const { data: newPostsData } = await supabase
        .from('community_posts')
        .select('id, created_at')
        .gt('created_at', lastFetchTime.toISOString())
        .order('created_at', { ascending: false });

      if (newPostsData && newPostsData.length > 0) {
        console.log('CommunityFeed: Found', newPostsData.length, 'new posts');
        setHasNewContent(true);
      }
    } catch (error) {
      console.error('Error checking for new posts:', error);
    }
  };

  const fetchPostsToBackground = async () => {
    if (!user) return;
    
    try {
      // Use the same optimized pattern for background fetch
      let postsQuery = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: postsData, error: postsError } = await postsQuery;
      if (postsError) return;

      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, {
          full_name: p.display_name,
          avatar_url: p.avatar_url,
          neighborhood: p.neighborhood,
          city: p.city,
          state: p.state,
        }])
      );

      const filteredAndTransformed = (postsData || [])
        .map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id) || null
        }))
        .filter(post => {
          if (!post.profiles) return false;
          if (!profile || !profile.city || !profile.state) return true;
          
          if (viewScope === 'state') {
            return post.profiles.state?.trim().toLowerCase() === profile.state?.trim().toLowerCase();
          } else if (viewScope === 'city') {
            return post.profiles.city?.trim().toLowerCase() === profile.city?.trim().toLowerCase() && 
                   post.profiles.state?.trim().toLowerCase() === profile.state?.trim().toLowerCase();
          } else {
            const sameNeighborhood = post.profiles.neighborhood?.trim().toLowerCase() === profile.neighborhood?.trim().toLowerCase();
            const sameCity = post.profiles.city?.trim().toLowerCase() === profile.city?.trim().toLowerCase();
            const sameState = post.profiles.state?.trim().toLowerCase() === profile.state?.trim().toLowerCase();
            
            if (sameNeighborhood && sameCity && sameState) return true;
            if (sameCity && sameState) return true;
            return false;
          }
        });

      // Transform posts without dependencies first
      const transformedPosts = filteredAndTransformed.map(transformDatabasePost);
      
      // Load dependencies for background posts
      const postsWithDependencies = await loadPostDependencies(transformedPosts);
      setBackgroundPosts(postsWithDependencies);
    } catch (error) {
      console.error('Error preparing background posts:', error);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    if (hasNewContent && backgroundPosts.length > 0) {
      // Use prepared background posts
      setPosts(backgroundPosts);
      setHasNewContent(false);
      toast({
        title: "Feed refreshed",
        description: "Showing latest posts from your area.",
      });
    } else {
      // Fetch fresh if no background data
      await fetchPosts(false);
    }
    setRefreshing(false);
  };

  // Check read statuses for posts with memoization to prevent infinite loops
  useEffect(() => {
    const checkReadStatuses = async () => {
      if (!user || posts.length === 0) return;
      
      const statuses: Record<string, boolean> = {};
      const postsToCheck = posts.filter(post => !readStatuses.hasOwnProperty(post.id));
      
      if (postsToCheck.length === 0) return; // No new posts to check
      
      await Promise.all(
        postsToCheck.map(async (post) => {
          const isRead = await checkIfPostIsRead(post.id);
          statuses[post.id] = isRead;
        })
      );
      
      if (Object.keys(statuses).length > 0) {
        setReadStatuses(prev => ({ ...prev, ...statuses }));
      }
    };

    checkReadStatuses();
  }, [posts.map(p => p.id).join(','), user?.id]); // Use stable dependency

  // Apply filters to posts and update filteredPosts state
  useEffect(() => {
    const applyFilters = () => {
      const filtered = posts.filter(post => {
        // Filter by post type
        const matchesType = selectedPostType === 'all' || post.type === selectedPostType;

        // Filter by read status
        const isRead = readStatuses[post.id] || false;
        const matchesReadStatus = !showUnreadOnly || !isRead;

        return matchesType && matchesReadStatus;
      });
      
      setFilteredPosts(filtered);
    };

    applyFilters();
  }, [posts, selectedPostType, showUnreadOnly, readStatuses]);

  // Create combined feed with all content types interspersed
  useEffect(() => {
    const createFeedWithContent = () => {
      if (filteredPosts.length === 0) {
        setFeedItems([]);
        return;
      }

      const combinedFeed: FeedItem[] = [];
      const allPromotionalAds = [...promotionalAds, ...newPromotionalAds];
      
      // Add promotional content after every 3rd post for better visibility
      filteredPosts.forEach((post, index) => {
        combinedFeed.push(post);
        
        // Strategic placement: Higher frequency promotional content
        // Insert sponsored content every 3 posts (high priority)
        if ((index + 1) % 3 === 0 && sponsoredContent.length > 0) {
          const contentIndex = Math.floor(index / 3) % sponsoredContent.length;
          const sponsoredData = sponsoredContent[contentIndex];
          combinedFeed.push({ type: 'sponsored_content', content: sponsoredData });
        }
        
        // Insert promotional ads every 4 posts 
        else if ((index + 1) % 4 === 0 && allPromotionalAds.length > 0) {
          const adIndex = Math.floor(index / 4) % allPromotionalAds.length;
          const adData = allPromotionalAds[adIndex];
          
          // Transform promotional ad to match FeedAdCard format
          const feedAd = {
            id: adData.id,
            business: {
               name: adData.business?.name || adData.location?.split(',')[0] || 'Local Business',
               logo: adData.business?.logo,
               location: adData.business?.location || adData.location || 'Local Area',
               verified: adData.business?.verified || false
             },
             title: adData.title || 'Advertisement',
             description: adData.description || '',
             category: adData.category || 'General',
             image: adData.images && adData.images.length > 0 ? adData.images[0] : undefined,
             images: adData.images || [],
             cta: adData.cta || 'Learn More',
             url: adData.url,
             promoted: true,
             timePosted: adData.timePosted || 'Recently',
             likes: Math.floor(Math.random() * 50) + 10,
             comments: Math.floor(Math.random() * 20) + 5,
             rating: 4.5,
             price: adData.price,
             type: adData.type || 'general'
          };
          
          combinedFeed.push({ type: 'ad', ad: feedAd });
        }
        
        // Insert board suggestions every 6 posts (lower priority)
        else if ((index + 1) % 6 === 0 && boardSuggestions.length > 0) {
          const suggestionIndex = Math.floor(index / 6) % boardSuggestions.length;
          const boardData = boardSuggestions[suggestionIndex];
          combinedFeed.push({ type: 'board_suggestion', board: boardData });
        }
      });
      
      setFeedItems(combinedFeed);
    };

    createFeedWithContent();
  }, [filteredPosts, promotionalAds, newPromotionalAds, sponsoredContent, boardSuggestions]);

  useEffect(() => {
    if (propViewScope) {
      setViewScope(propViewScope);
    }
  }, [propViewScope]);

  useEffect(() => {
    // Allow initial fetch with just user, don't wait for profile
    if (user && !loading) {
      fetchPosts(true);
    }
  }, [user]); // Remove viewScope dependency to prevent repeated fetches
  
  // Separate effect to refetch when profile becomes available (only once)
  useEffect(() => {
    if (user && profile && posts.length === 0) {
      console.log('CommunityFeed: Profile loaded, refetching posts with location filter');
      fetchPosts(false);
    }
  }, [profile]); // Only depend on profile, not user

  // Enhanced real-time system with debouncing
  useEffect(() => {
    if (!user) return;

    let debounceTimeout: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => fetchPosts(false), 2000);
    };

    console.log('CommunityFeed: Setting up optimized real-time subscriptions');

    const subscription = createSafeSubscription(
      (channel) => channel
        // Listen to all community posts changes with reduced frequency
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        }, (payload) => {
          console.log('CommunityFeed: New post detected');
          setHasNewPosts(true); // Just show indicator, don't auto-fetch
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'post_likes'
        }, async (payload) => {
          console.log('CommunityFeed: Post like added');
          
          const postId = payload.new?.post_id;
          if (!postId) return;

          // Update like count and status efficiently
          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likes: post.likes + 1,
                isLiked: payload.new.user_id === user.id ? true : post.isLiked
              };
            }
            return post;
          }));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'post_likes'
        }, async (payload) => {
          console.log('CommunityFeed: Post like removed');
          
          const postId = payload.old?.post_id;
          if (!postId) return;

          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likes: Math.max(0, post.likes - 1),
                isLiked: payload.old.user_id === user.id ? false : post.isLiked
              };
            }
            return post;
          }));
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments'
        }, async (payload) => {
          console.log('CommunityFeed: Comment added');
          
          const postId = payload.new?.post_id;
          if (!postId) return;

          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return { ...post, comments: post.comments + 1 };
            }
            return post;
          }));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'post_comments'
        }, async (payload) => {
          console.log('CommunityFeed: Comment removed');
          
          const postId = payload.old?.post_id;
          if (!postId) return;

          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return { ...post, comments: Math.max(0, post.comments - 1) };
            }
            return post;
          }));
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'saved_posts',
          filter: `user_id=eq.${user.id}`
        }, async (payload) => {
          console.log('CommunityFeed: Post saved');
          
          const postId = payload.new?.post_id;
          if (!postId) return;

          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return { ...post, isSaved: true };
            }
            return post;
          }));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'saved_posts',
          filter: `user_id=eq.${user.id}`
        }, async (payload) => {
          console.log('CommunityFeed: Post unsaved');
          
          const postId = payload.old?.post_id;
          if (!postId) return;

          setPosts(prev => prev.map(post => {
            if (post.id === postId) {
              return { ...post, isSaved: false };
            }
            return post;
          }));
        }),
      {
        channelName: `community_feed_${user.id}`, // User-specific channel
        onError: debouncedFetch, // Use debounced fetch for error recovery
        pollInterval: 120000, // Poll every 2 minutes instead of 30 seconds
        debugName: 'CommunityFeedOptimized'
      }
    );

    return () => {
      console.log('CommunityFeed: Cleaning up real-time subscriptions');
      subscription?.unsubscribe();
    };
  }, [user?.id]); // Remove profile and viewScope dependencies

  // Handle viewScope changes separately to prevent flickering
  useEffect(() => {
    if (user && viewScope) {
      // Store current filter preference
      localStorage.setItem('communityFeedViewScope', viewScope);
      // Fetch posts with new filter
      fetchPosts(true);
    }
  }, [viewScope]);


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

  const handleAvatarClick = (authorName: string, avatarUrl?: string) => {
    setSelectedUserName(authorName);
    setSelectedUserAvatar(avatarUrl);
    setUserProfileOpen(true);
  };

  const handlePostClick = async (postId: string, event?: React.MouseEvent) => {
    // Don't open full screen if clicking on interactive elements
    if (event?.target) {
      const target = event.target as HTMLElement;
      const isInteractiveElement = target.closest(`
        button, 
        a, 
        [role="button"], 
        input, 
        textarea, 
        .avatar-clickable, 
        .comment-section,
        [data-interactive],
        .lucide
      `.replace(/\s+/g, ''));
      
      if (isInteractiveElement) {
        return;
      }
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

  // Feed items are already filtered through filteredPosts, no need to filter again
  const filteredFeedItems = feedItems;

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
      {/* Header with location filter and refresh button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Community Feed</h2>
          
          {/* Current location scope indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {viewScope === 'neighborhood' && <Home className="h-4 w-4" />}
            {viewScope === 'city' && <Building className="h-4 w-4" />}
            {viewScope === 'state' && <Globe className="h-4 w-4" />}
            <span>
              {viewScope === 'neighborhood' ? 'My Neighbourhood' : 
               viewScope === 'city' ? 'My City' : 'Entire State'}
            </span>
          </div>
          
          {unreadCounts.community > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {unreadCounts.community} new
            </Badge>
          )}
          
          {hasNewContent && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              New content available
            </Badge>
          )}
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
          
          {/* Refresh button */}
          <Button
            onClick={handleManualRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Post Type Filter Buttons */}
      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-center">
        <div className="flex gap-2">
          {postTypeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <DropdownMenu key={filter.key}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={selectedPostType === filter.key ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs px-2 py-1 h-8"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {filter.label}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-background border shadow-lg z-50 min-w-[160px]">
                  <DropdownMenuLabel>Post Type</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSelectedPostType(filter.key)}>
                    <Icon className="h-4 w-4 mr-2" />
                    {filter.label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>View Scope</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setViewScope('neighborhood')}>
                    <Home className="h-4 w-4 mr-2" />
                    My Neighbourhood
                    {viewScope === 'neighborhood' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewScope('city')}>
                    <Building className="h-4 w-4 mr-2" />
                    My City
                    {viewScope === 'city' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewScope('state')}>
                    <Globe className="h-4 w-4 mr-2" />
                    Entire State
                    {viewScope === 'state' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
                    {showUnreadOnly ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showUnreadOnly ? 'Show All' : 'Unread Only'}
                    {showUnreadOnly && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={markAllCommunityPostsAsRead}
                    disabled={unreadCounts.community === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All Read
                    {unreadCounts.community > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {unreadCounts.community}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="w-full">
          <div className="flex justify-center gap-1 w-full flex-wrap">
            {postTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <DropdownMenu key={filter.key}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={selectedPostType === filter.key ? 'default' : 'outline'}
                      size="sm"
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
                      {selectedPostType === filter.key && (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-background border shadow-lg z-50 min-w-[160px]">
                    <DropdownMenuLabel>Post Type</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSelectedPostType(filter.key)}>
                      <Icon className="h-4 w-4 mr-2" />
                      {filter.label}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>View Scope</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setViewScope('neighborhood')}>
                      <Home className="h-4 w-4 mr-2" />
                      My Neighbourhood
                      {viewScope === 'neighborhood' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewScope('city')}>
                      <Building className="h-4 w-4 mr-2" />
                      My City
                      {viewScope === 'city' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewScope('state')}>
                      <Globe className="h-4 w-4 mr-2" />
                      Entire State
                      {viewScope === 'state' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
                      {showUnreadOnly ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showUnreadOnly ? 'Show All' : 'Unread Only'}
                      {showUnreadOnly && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={markAllCommunityPostsAsRead}
                      disabled={unreadCounts.community === 0}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark All Read
                      {unreadCounts.community > 0 && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {unreadCounts.community}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        </div>
      </div>





      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading posts...</p>
        </div>
      ) : filteredFeedItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No posts found for this {viewScope === 'neighborhood' ? 'neighborhood' : 'state'} and category.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to start a conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredFeedItems.map((item, index) => {
            if (item.type === 'ad') {
              return (
                <FeedAdCard 
                  key={`ad-${item.ad.id}-${index}`} 
                  ad={item.ad} 
                />
              );
            }
            
            if (item.type === 'board_suggestion') {
              return (
                <BoardSuggestionCard
                  key={`board-${item.board.id}-${index}`}
                  board={item.board}
                  onJoin={refreshSuggestions}
                />
              );
            }
            
            if (item.type === 'sponsored_content') {
              const content = item.content;
              return (
                <Card key={`sponsored-${content.id}-${index}`} className="relative shadow-card">
                  <Badge className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs">
                    Sponsored
                  </Badge>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">AD</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{content.title || 'Sponsored Content'}</h3>
                        <p className="text-xs text-muted-foreground">Promoted</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{content.description}</p>
                    <Button
                      size="sm"
                      onClick={() => logInteraction(content.id, 'click')}
                      className="w-full"
                    >
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            
            const post = item as Post;
            const typeBadge = getPostTypeBadge(post.type);
            
            // Extra safety check
            if (!post || !post.author) {
              console.warn('Post or post.author is undefined:', post);
              return null;
            }
            
            return (
                <Card
                  key={post.id} 
                  className={`shadow-card hover:shadow-elevated transition-shadow cursor-pointer ${
                    !readStatuses[post.id] ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  onClick={(e) => handlePostClick(post.id, e)}
            >
              <CardHeader className="px-3 py-2 md:px-6 md:py-4">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(post.author.name, post.author.avatar);
                    }}
                  >
                    <OnlineAvatar
                      userId={post.user_id}
                      src={post.author.avatar}
                      fallback={post.author.name.split(' ').map(n => n[0]).join('')}
                      size="md"
                      className="md:h-10 md:w-10"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm md:text-base">
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
                      <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{post.author.location}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                      <DropdownMenuItem onClick={() => handleShare(post)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                        toast({ title: "Link copied to clipboard" });
                      }}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePostClick(post.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {user?.id === post.user_id && (
                        <DropdownMenuItem asChild>
                          <PromotePostButton
                            postId={post.id}
                            postType={post.type === 'event' ? 'event' : 'community_post'}
                            postTitle={post.title || `${post.type} post`}
                            postDescription={post.content}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                          />
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-3 md:px-6">
                <ScrollArea className="max-h-48 md:max-h-60 overflow-auto">
                  <div className="pr-4">
                    {post.title && (
                      <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 line-clamp-2">{post.title}</h3>
                    )}
                    <p className="text-xs md:text-sm leading-relaxed mb-2 md:mb-4">{post.content}</p>
                    
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
                            className="w-full h-20 md:h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={(e) => handleImageClick(post.images!, index, e)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex items-center justify-between pt-2 md:pt-3 border-t">
                  <div className="flex items-center gap-2 md:gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={`${post.isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive px-2 md:px-3 h-7 md:h-9`}
                    >
                      <Heart className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs md:text-sm">{post.likes}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                       className="text-muted-foreground hover:text-primary px-2 md:px-3 h-7 md:h-9"
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
                      className={`${post.isSaved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary px-2 md:px-3 h-7 md:h-9`}
                    >
                      <Bookmark className={`h-3 w-3 md:h-4 md:w-4 ${post.isSaved ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(post)}
                      className="text-muted-foreground hover:text-primary px-2 md:px-3 h-7 md:h-9"
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
                    onAvatarClick={handleAvatarClick}
                    isInline={true}
                  />
                )}
              </CardContent>
                </Card>
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
