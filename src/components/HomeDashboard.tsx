import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  MessageSquare,
  Home,
  Activity,
  Settings,
  ChevronDown,
  Globe,
  Filter
} from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import HeroSection from './HeroSection';
import CreatePostDialog from './CreatePostDialog';
import HomeAutomations from './HomeAutomations';
import NeighborhoodInsights from './NeighborhoodInsights';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { AdDisplay } from '@/components/advertising/display/AdDisplay';
import { 
  useUpcomingEvents, 
  useSafetyAlerts, 
  useMarketplaceHighlights, 
  useTrendingTopics 
} from '@/hooks/useDashboardSections';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [viewScope, setViewScope] = useState<'neighborhood' | 'state'>('state'); // Default to state for better content visibility
  const dashboardStats = useDashboardStats();
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(3);
  const { alerts: safetyAlerts, loading: alertsLoading } = useSafetyAlerts(2);
  const { items: marketplaceHighlights, loading: marketplaceLoading } = useMarketplaceHighlights(3);
  const { topics: trendingTopics, loading: topicsLoading } = useTrendingTopics(4);

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

      {/* Welcome Section - now more compact */}
      <div className="bg-gradient-primary rounded-lg p-3 sm:p-4 md:p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg md:text-lg font-semibold mb-1">Good morning! 👋</h2>
            <p className="text-white/90 text-xs sm:text-sm md:text-sm leading-tight">What's happening in your neighborhood today?</p>
          </div>
          <Button 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-shrink-0 text-xs sm:text-sm md:text-sm px-3 sm:px-4 md:px-4 py-2"
            onClick={() => setCreatePostOpen(true)}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 mr-1 sm:mr-2 md:mr-2" />
            <span className="hidden sm:inline">Create Post</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>
      </div>

        {/* Mobile Sponsored Section */}
        <div className="lg:hidden">
          <AdDisplay placement="sidebar" maxAds={3} />
        </div>

        {/* Nextdoor-Style Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">
        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Adverts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <CardTitle className="text-lg sm:text-xl md:text-xl">Community Updates</CardTitle>
                    
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-6" data-tutorial="community-feed">
                  <CommunityFeed />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Visible on desktop only due to space constraints */}
            <div className="hidden lg:block space-y-4 sm:space-y-5 md:space-y-6">
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
                            <span className="text-xs sm:text-sm md:text-sm text-muted-foreground">
                              {event.attendees} interested
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
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

              {/* Safety & Alerts */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-destructive" />
                    <span>Safety & Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6" data-tutorial="safety-alerts">
                  {alertsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="animate-pulse p-3 rounded-lg bg-muted/50">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-full mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : safetyAlerts.length > 0 ? (
                    <div className="space-y-2 md:space-y-3">
                      {safetyAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className="p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors touch-manipulation active:bg-muted/80"
                          onClick={() => navigate('/safety')}
                          title={`View details for ${alert.title}`}
                        >
                          <div className="flex items-start justify-between mb-1.5 md:mb-2">
                            <h4 className="font-medium text-sm md:text-base">{alert.title}</h4>
                            <Badge 
                              variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">{alert.description}</p>
                          <span className="text-xs text-muted-foreground">{alert.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active safety alerts. Your area is secure!
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
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors touch-manipulation active:bg-muted/70"
                          onClick={() => navigate('/marketplace')}
                          title={`View ${item.title}`}
                        >
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm md:text-base truncate">{item.title}</h4>
                            <p className="text-sm md:text-base font-semibold text-community-green">{item.price}</p>
                            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
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
                          onClick={() => setActiveTab('all')} // This could filter by hashtag in the future
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
        </TabsContent>

        <TabsContent value="automations" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          <HomeAutomations />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          <NeighborhoodInsights />
          
          {/* Trending Topics */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : trendingTopics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trendingTopics.map((topic, index) => (
                    <div 
                      key={topic.tag} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => {
                        // Navigate to community with search filter
                        navigate('/community');
                      }}
                    >
                      <span className="font-medium text-sm sm:text-base">{topic.tag}</span>
                      <Badge variant="outline" className="text-xs">
                        {topic.posts}
                      </Badge>
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
        </TabsContent>

        <TabsContent value="ads" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Active Advertisements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdDisplay placement="inline" maxAds={9} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </div>
  );
};

export default HomeDashboard;