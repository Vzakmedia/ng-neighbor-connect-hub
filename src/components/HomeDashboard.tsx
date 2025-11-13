import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  ShoppingBag,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  MessageSquare,
} from '@/lib/icons';
import CommunityFeed from './CommunityFeed';
import HeroSection from './HeroSection';
import CreatePostDialog from './CreatePostDialog';
import { ScrollToTop } from './ScrollToTop';
import { FeedTabNavigation } from './community/feed/FeedTabNavigation';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Lazy load AdDisplay - not critical for initial render
const AdDisplay = lazy(() => import('@/components/advertising/display/AdDisplay').then(m => ({ default: m.AdDisplay })));
import { 
  useUpcomingEvents, 
  useSafetyAlerts, 
  useMarketplaceHighlights, 
  useTrendingTopics 
} from '@/hooks/useDashboardSections';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'for-you' | 'recent' | 'nearby' | 'trending'>('for-you');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedLocationScope, setSelectedLocationScope] = useState<'neighborhood' | 'city' | 'state' | null>(null);
  const [feedFilters, setFeedFilters] = useState({
    locationScope: 'neighborhood',
    tags: [] as string[],
    postTypes: 'all',
    sortBy: 'recommended',
    dateRange: 'all',
  });

  const handleTabChange = (tab: 'for-you' | 'recent' | 'nearby' | 'trending') => {
    setActiveTab(tab);
    setSelectedLocationScope(null); // Clear location pill when switching main tabs
    
    switch (tab) {
      case 'for-you':
        // Personalized feed using AI recommendations
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'recommended',
          dateRange: 'all',
        });
        break;
      case 'recent':
        // Most recent posts
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'newest',
          dateRange: 'all',
        });
        break;
      case 'nearby':
        // Posts from user's immediate neighborhood
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'newest',
          dateRange: 'all',
        });
        break;
      case 'trending':
        // Popular posts based on engagement
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'popular',
          dateRange: 'week',
        });
        break;
    }
  };

  const handleLocationScopeChange = (scope: 'neighborhood' | 'city' | 'state' | null) => {
    setSelectedLocationScope(scope);
    
    if (scope) {
      setFeedFilters(prev => ({
        ...prev,
        locationScope: scope
      }));
    } else {
      // Reset to default neighborhood when clearing
      setFeedFilters(prev => ({
        ...prev,
        locationScope: 'neighborhood'
      }));
    }
  };

  // Keyboard shortcuts for tab navigation (1-4 keys)
  useKeyboardShortcuts([
    { key: '1', callback: () => handleTabChange('for-you') },
    { key: '2', callback: () => handleTabChange('recent') },
    { key: '3', callback: () => handleTabChange('nearby') },
    { key: '4', callback: () => handleTabChange('trending') },
  ]);

  const dashboardStats = useDashboardStats();
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(3);
  const { alerts: safetyAlerts, loading: alertsLoading } = useSafetyAlerts(2);
  const { items: marketplaceHighlights, loading: marketplaceLoading } = useMarketplaceHighlights(3);
  const { topics: trendingTopics, loading: topicsLoading } = useTrendingTopics(4);

  // Prefetch common feed filter combinations for instant switching
  useEffect(() => {
    if (!user || !profile) return;

    // Prefetch common filter combinations users might switch to
    const commonFilters = [
      { locationScope: 'neighborhood' as const },
      { locationScope: 'city' as const },
      { locationScope: 'state' as const },
      { locationScope: 'all' as const },
    ];

    // Prefetch in the background after a short delay (don't block initial load)
    const prefetchTimeout = setTimeout(() => {
      commonFilters.forEach(filter => {
        const queryKey = ['feed', {
          userId: user.id,
          locationScope: filter.locationScope,
          tags: [],
          postType: undefined,
          sortBy: 'recent',
          searchQuery: '',
        }];
        
        // Only prefetch if not already cached
        const existing = queryClient.getQueryData(queryKey);
        if (!existing) {
          // Note: prefetchInfiniteQuery doesn't support 'pages' parameter
          // We just prefetch the first page by default
          queryClient.prefetchInfiniteQuery({
            queryKey,
            initialPageParam: 0,
          } as any); // Type assertion to bypass strict typing
        }
      });
    }, 2000); // Prefetch after 2 seconds

    return () => clearTimeout(prefetchTimeout);
  }, [user, profile, queryClient]);

  // Create dynamic quick stats based on real data
  const quickStats = [
    { 
      icon: Users, 
      label: 'Active Neighbors', 
      value: dashboardStats.loading ? '...' : `${dashboardStats.activeNeighbors}+`, 
      color: 'text-community-blue', 
      trend: '+12%' 
    },
    { 
      icon: MessageSquare, 
      label: 'Posts Today', 
      value: dashboardStats.loading ? '...' : dashboardStats.postsToday.toString(), 
      color: 'text-primary', 
      trend: '+8%' 
    },
    { 
      icon: Calendar, 
      label: 'Upcoming Events', 
      value: dashboardStats.loading ? '...' : dashboardStats.upcomingEvents.toString(), 
      color: 'text-community-yellow', 
      trend: '+2%' 
    },
    { 
      icon: ShoppingBag, 
      label: 'Items for Sale', 
      value: dashboardStats.loading ? '...' : dashboardStats.itemsForSale.toString(), 
      color: 'text-community-green', 
      trend: '+15%' 
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 overflow-x-hidden">
      {/* Hero Section */}
      <HeroSection />

      {/* Mobile Sponsored Section */}
      <div className="lg:hidden">
        <AdDisplay placement="sidebar" maxAds={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <FeedTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onCreatePost={() => setCreatePostOpen(true)}
            selectedLocationScope={selectedLocationScope}
            onLocationScopeChange={handleLocationScopeChange}
          />
          
          {/* Feed Content */}
          <Card className="shadow-card border-0">
            <CardContent className="px-3 sm:px-4 md:px-6 pt-6" data-tutorial="community-feed">
              <CommunityFeed 
                filters={feedFilters}
                onFiltersChange={setFeedFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Visible on desktop only due to space constraints */}
        <div className="hidden lg:block space-y-4 sm:space-y-5 md:space-y-6 sticky top-4 self-start max-h-[calc(100vh-6rem)]">
              {/* Sponsored Ads Section */}
              <AdDisplay placement="sidebar" maxAds={3} />

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base sm:text-lg md:text-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 mr-2 text-community-yellow" />
                      <span>Upcoming Events</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/events')}
                      title="View all events"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-6">
                  {eventsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingEvents.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 md:space-y-4">
                      {upcomingEvents.slice(0, 2).map((event) => (
                        <div 
                          key={event.id} 
                          className="border-l-4 border-primary pl-3 sm:pl-4 md:pl-4 pb-3 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors touch-manipulation active:bg-muted/70"
                          onClick={() => navigate('/events')}
                          title={`View details for ${event.title}`}
                        >
                          <h4 className="font-medium mb-1 text-sm sm:text-base md:text-base">{event.title}</h4>
                          <div className="flex items-center text-xs sm:text-sm md:text-sm text-muted-foreground mb-1 sm:mb-2 md:mb-2">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.date} at {event.time}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm md:text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center justify-between">
                            {event.attendees > 0 && (
                              <span className="text-xs sm:text-sm md:text-sm text-muted-foreground">
                                {event.attendees} attending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming events. Be the first to create one!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Marketplace Highlights */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 mr-2 text-community-green" />
                      <span>Marketplace</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/marketplace')}
                      title="View marketplace"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  {marketplaceLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="animate-pulse flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : marketplaceHighlights.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {marketplaceHighlights.slice(0, 2).map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-start gap-3 p-2.5 md:p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors touch-manipulation active:bg-muted/70"
                          onClick={() => navigate('/marketplace')}
                          title={`View ${item.title}`}
                        >
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <h4 className="font-medium text-sm md:text-base line-clamp-1">{item.title}</h4>
                            <p className="text-base md:text-lg font-semibold text-community-green">{item.price}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items for sale. List something to get started!
                    </p>
                  )}
                </CardContent>
              </Card>


              {/* Trending Topics */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    <span>Trending</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  {topicsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-6 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : trendingTopics.length > 0 ? (
                    <div className="space-y-1.5 md:space-y-2">
                      {trendingTopics.map((topic, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer touch-manipulation active:bg-muted/70"
                          onClick={() => handleTabChange('trending')}
                        >
                          <span className="font-medium text-sm text-primary truncate mr-2">{topic.tag}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{topic.posts} posts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No trending topics yet. Start a conversation!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default HomeDashboard;