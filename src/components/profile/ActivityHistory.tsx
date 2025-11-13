import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BoltIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ShieldCheckIcon, 
  StarIcon, 
  ClockIcon,
  EyeIcon,
  BookmarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
}

interface Service {
  id: string;
  title: string;
  category: string;
  price_min: number;
  price_max: number;
  is_active: boolean;
  created_at: string;
}

interface SafetyAlert {
  id: string;
  title: string;
  alert_type: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface SavedPost {
  id: string;
  post_id: string;
  created_at: string;
  community_posts: {
    id: string;
    title: string | null;
    content: string;
    post_type: string;
    created_at: string;
    location: string | null;
    tags: string[] | null;
  } | null;
}

const ActivityHistory = () => {
  const { user } = useAuth();
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    try {
      const [marketplaceRes, servicesRes, alertsRes, reviewsRes, savedPostsRes] = await Promise.all([
        supabase
          .from('marketplace_items')
          .select('id, title, category, price, status, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('services')
          .select('id, title, category, price_min, price_max, is_active, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('safety_alerts')
          .select('id, title, alert_type, severity, status, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at')
          .eq('reviewer_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Fetch saved posts with manual join
        (async () => {
          const { data: savedPostsData, error: savedPostsError } = await supabase
            .from('saved_posts')
            .select('id, post_id, created_at')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (savedPostsError) throw savedPostsError;

          if (savedPostsData && savedPostsData.length > 0) {
            const postIds = savedPostsData.map(sp => sp.post_id);
            const { data: communityPostsData, error: communityPostsError } = await supabase
              .from('community_posts')
              .select('id, title, content, post_type, created_at, location, tags')
              .in('id', postIds);

            if (communityPostsError) throw communityPostsError;

            // Combine the data
            const combinedSavedPosts = savedPostsData.map(savedPost => ({
              ...savedPost,
              community_posts: communityPostsData?.find(cp => cp.id === savedPost.post_id) || null
            }));

            return { data: combinedSavedPosts };
          }

          return { data: [] };
        })()
      ]);

      if (marketplaceRes.data) setMarketplaceItems(marketplaceRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (alertsRes.data) setSafetyAlerts(alertsRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (savedPostsRes.data) setSavedPosts(savedPostsRes.data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'sold':
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <BoltIcon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">Activity History</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 overflow-x-hidden">
        <Tabs defaultValue="marketplace" className="w-full max-w-full">
          <TabsList className="flex mb-4 flex-wrap overflow-x-auto">
            <TabsTrigger value="marketplace" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 min-w-0">
              <ShoppingBagIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Marketplace</span>
              <span className="sm:hidden">Market</span>
              <span className="text-xs">({marketplaceItems.length})</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 min-w-0">
              <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Services</span>
              <span className="sm:hidden">Services</span>
              <span className="text-xs">({services.length})</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 min-w-0">
              <ShieldCheckIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Safety</span>
              <span className="sm:hidden">Safety</span>
              <span className="text-xs">({safetyAlerts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 min-w-0">
              <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Reviews</span>
              <span className="sm:hidden">Reviews</span>
              <span className="text-xs">({reviews.length})</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3 min-w-0">
              <BookmarkIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Saved</span>
              <span className="sm:hidden">Saved</span>
              <span className="text-xs">({savedPosts.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="w-full max-w-full overflow-hidden space-y-4">
            {marketplaceItems.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingBagIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No marketplace items yet</p>
                <Button variant="outline" className="mt-2 text-sm">Create Your First Listing</Button>
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {marketplaceItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 w-full max-w-full overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">{item.title}</h4>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="w-fit">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{item.category}</span>
                        <span className="font-medium">₦{item.price?.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{getTimeSince(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="w-full max-w-full overflow-hidden space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <UsersIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No services offered yet</p>
                <Button variant="outline" className="mt-2 text-sm">Create Your First Service</Button>
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {services.map((service) => (
                  <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 w-full max-w-full overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">{service.title}</h4>
                        <Badge variant={service.is_active ? 'default' : 'secondary'} className="w-fit">
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{service.category}</span>
                        <span className="font-medium">₦{service.price_min?.toLocaleString()} - ₦{service.price_max?.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{getTimeSince(service.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="safety" className="w-full max-w-full overflow-hidden space-y-4">
            {safetyAlerts.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShieldCheckIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No safety alerts reported</p>
                <Button variant="outline" className="mt-2 text-sm">Report Safety Issue</Button>
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {safetyAlerts.map((alert) => (
                  <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 w-full max-w-full overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1 flex-wrap">
                        <h4 className="font-medium text-sm sm:text-base truncate">{alert.title}</h4>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={getStatusBadgeVariant(alert.status)} className="w-fit">
                            {alert.status}
                          </Badge>
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'} className="w-fit">
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{alert.alert_type}</span>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>{getTimeSince(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="w-full max-w-full overflow-hidden space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <StarIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No reviews written yet</p>
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {reviews.map((review) => (
                  <div key={review.id} className="p-3 sm:p-4 border rounded-lg w-full max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-sm sm:text-base">{review.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <ClockIcon className="h-3 w-3 flex-shrink-0" />
                        <span>{getTimeSince(review.created_at)}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs sm:text-sm text-foreground break-words">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="w-full max-w-full overflow-hidden space-y-4">
            {savedPosts.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <BookmarkIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No saved posts yet</p>
                <p className="text-xs sm:text-sm mt-2">Start saving posts you want to revisit later</p>
              </div>
            ) : (
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {savedPosts.map((savedPost) => {
                  const post = savedPost.community_posts;
                  if (!post) {
                    return (
                      <div key={savedPost.id} className="p-3 sm:p-4 border rounded-lg bg-muted/20 w-full max-w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <BookmarkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-muted-foreground">Post no longer available</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <ClockIcon className="h-3 w-3 flex-shrink-0" />
                          <span>Saved {getTimeSince(savedPost.created_at)}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={savedPost.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg gap-3 w-full max-w-full overflow-hidden">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1">
                          <div className="flex items-center gap-2">
                            <BookmarkIcon className="h-4 w-4 text-primary flex-shrink-0" />
                            {post.title ? (
                              <h4 className="font-medium text-sm sm:text-base truncate">{post.title}</h4>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">Untitled Post</span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs w-fit">
                            {post.post_type}
                          </Badge>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                          {post.content.substring(0, 120)}
                          {post.content.length > 120 ? '...' : ''}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          {post.location && (
                            <span className="truncate">{post.location}</span>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {post.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="bg-muted px-1 py-0.5 rounded text-xs">
                                  #{tag}
                                </span>
                              ))}
                              {post.tags.length > 2 && (
                                <span>+{post.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 flex-shrink-0" />
                            <span>Saved {getTimeSince(savedPost.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <HeartIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ActivityHistory;