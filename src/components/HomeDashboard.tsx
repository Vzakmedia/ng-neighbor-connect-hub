import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings
} from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import HeroSection from './HeroSection';
import CreatePostDialog from './CreatePostDialog';
import AdvertisementCard from './AdvertisementCard';
import HomeAutomations from './HomeAutomations';
import NeighborhoodInsights from './NeighborhoodInsights';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const dashboardStats = useDashboardStats();

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

  const upcomingEvents = [
    {
      id: 1,
      title: 'Community Cleanup',
      date: 'Saturday, Nov 25',
      time: '9:00 AM',
      location: 'Victoria Island Park',
      attendees: 45,
      type: 'community'
    },
    {
      id: 2,
      title: 'Neighborhood Watch Meeting',
      date: 'Sunday, Nov 26',
      time: '6:00 PM',
      location: 'Community Center',
      attendees: 28,
      type: 'safety'
    },
    {
      id: 3,
      title: 'Kids Soccer Tournament',
      date: 'Saturday, Dec 2',
      time: '10:00 AM',
      location: 'Sports Complex',
      attendees: 67,
      type: 'sports'
    }
  ];

  const safetyAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Road Construction',
      description: 'Adeola Odeku Street partially closed until Dec 1st',
      time: '2 hours ago',
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      title: 'Power Outage Scheduled',
      description: 'Planned maintenance on Sunday 2-4 PM',
      time: '4 hours ago',
      severity: 'low'
    }
  ];

  const marketplaceHighlights = [
    {
      id: 1,
      title: 'Samsung Smart TV',
      price: '₦250,000',
      location: 'Lekki Phase 1',
      image: '/placeholder.svg',
      category: 'Electronics'
    },
    {
      id: 2,
      title: 'Toyota Camry 2018',
      price: '₦8,500,000',
      location: 'Victoria Island',
      image: '/placeholder.svg',
      category: 'Vehicles'
    },
    {
      id: 3,
      title: 'Apartment for Rent',
      price: '₦1,200,000/year',
      location: 'Ikoyi',
      image: '/placeholder.svg',
      category: 'Real Estate'
    }
  ];

  const trendingTopics = [
    { tag: '#CommunityCleanup', posts: 45 },
    { tag: '#LocalBusiness', posts: 32 },
    { tag: '#NeighborhoodWatch', posts: 28 },
    { tag: '#EventPlanning', posts: 19 }
  ];

  const advertisements = [
    {
      id: '1',
      title: 'Fresh Groceries Delivered',
      description: 'Get fresh groceries delivered to your door. Same-day delivery available in Victoria Island.',
      image: '/placeholder.svg',
      location: 'Victoria Island',
      category: 'Services',
      price: 'From ₦500',
      url: 'https://example.com/groceries',
      sponsored: true,
      timePosted: '2 hours ago'
    },
    {
      id: '2',
      title: 'Home Security Systems',
      description: 'Protect your home with our advanced security systems. Professional installation included.',
      location: 'Lekki',
      category: 'Security',
      price: 'From ₦150,000',
      url: 'https://example.com/security',
      sponsored: true,
      timePosted: '5 hours ago'
    },
    {
      id: '3',
      title: 'Local Fitness Classes',
      description: 'Join our community fitness classes. Yoga, Pilates, and cardio available.',
      location: 'Ikoyi',
      category: 'Health',
      price: '₦8,000/month',
      sponsored: true,
      timePosted: '1 day ago'
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Hero Section */}
      <HeroSection />

      {/* Welcome Section - now more compact */}
      <div className="bg-gradient-primary rounded-lg p-3 md:p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-semibold mb-1">Good morning! 👋</h2>
            <p className="text-white/90 text-xs md:text-sm leading-tight">What's happening in your neighborhood today?</p>
          </div>
          <Button 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-shrink-0 text-xs md:text-sm px-3 md:px-4 py-2"
            onClick={() => setCreatePostOpen(true)}
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Create Post</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>
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
            Local Deals
          </TabsTrigger>
        </TabsList>
        
        {/* Mobile Tabs - Grid Layout */}
        <div className="md:hidden w-full">
          <TabsList className="grid w-full grid-cols-4 gap-0.5 h-auto p-1">
            <TabsTrigger value="overview" className="flex flex-col items-center justify-center py-2 px-1 text-xs">
              <Home className="h-3 w-3 mb-0.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex flex-col items-center justify-center py-2 px-1 text-xs">
              <Settings className="h-3 w-3 mb-0.5" />
              <span>Auto</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex flex-col items-center justify-center py-2 px-1 text-xs">
              <Activity className="h-3 w-3 mb-0.5" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex flex-col items-center justify-center py-2 px-1 text-xs">
              <TrendingUp className="h-3 w-3 mb-0.5" />
              <span>Deals</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              
              const handleStatClick = () => {
                switch (stat.label) {
                  case 'Active Neighbors':
                    navigate('/community');
                    break;
                  case 'Posts Today':
                    setActiveTab('all');
                    break;
                  case 'Upcoming Events':
                    navigate('/events');
                    break;
                  case 'Items for Sale':
                    navigate('/marketplace');
                    break;
                  default:
                    break;
                }
              };
              
              return (
                <Card 
                  key={index} 
                  className={`bg-gradient-card shadow-card hover:shadow-elevated transition-all cursor-pointer touch-manipulation active:scale-95 md:hover:scale-105 min-h-[100px] sm:min-h-[110px] ${
                    dashboardStats.loading ? 'animate-pulse' : ''
                  }`}
                  onClick={handleStatClick}
                >
                  <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 ${stat.color}`} />
                      <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 hidden sm:flex">
                        <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                        {stat.trend}
                      </Badge>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</div>
                    {/* Mobile trend badge */}
                    <Badge variant="secondary" className="text-[9px] px-1 py-0.5 mt-1 self-start sm:hidden">
                      <TrendingUp className="h-2 w-2 mr-0.5" />
                      {stat.trend}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
                    <CardTitle className="text-lg md:text-xl">Community Updates</CardTitle>
                    {/* Desktop filter buttons */}
                    <div className="hidden md:flex space-x-2">
                      {['all', 'safety', 'events', 'marketplace'].map((tab) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTab(tab)}
                          className="capitalize"
                        >
                          {tab}
                        </Button>
                      ))}
                    </div>
                    {/* Mobile filter buttons - contained grid */}
                    <div className="md:hidden w-full">
                      <div className="grid grid-cols-2 gap-1 w-full">
                        {['all', 'safety', 'events', 'marketplace'].map((tab) => (
                          <Button
                            key={tab}
                            variant={activeTab === tab ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTab(tab)}
                            className="capitalize text-xs px-2 py-1.5 w-full"
                          >
                            {tab === 'marketplace' ? 'market' : tab}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                  <CommunityFeed activeTab={activeTab} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Sponsored Ads */}
              <div className="space-y-3 md:space-y-4">
                {advertisements.slice(0, 1).map((ad) => (
                  <AdvertisementCard key={ad.id} ad={ad} />
                ))}
              </div>

              {/* Upcoming Events */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 text-community-yellow" />
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
                <CardContent className="px-3 md:px-6">
                  <div className="space-y-3 md:space-y-4">
                    {upcomingEvents.slice(0, 2).map((event) => (
                      <div 
                        key={event.id} 
                        className="border-l-4 border-primary pl-3 md:pl-4 pb-3 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors touch-manipulation active:bg-muted/70"
                        onClick={() => navigate('/events')}
                        title={`View details for ${event.title}`}
                      >
                        <h4 className="font-medium mb-1 text-sm md:text-base">{event.title}</h4>
                        <div className="flex items-center text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.date} at {event.time}
                        </div>
                        <div className="flex items-center text-xs md:text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {event.attendees} attending
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Safety Alerts */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-destructive" />
                    <span>Safety & Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
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
                            variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
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
                  <div className="space-y-2 md:space-y-3">
                    {marketplaceHighlights.slice(0, 2).map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center space-x-2 md:space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer touch-manipulation active:bg-muted/70"
                        onClick={() => navigate('/marketplace')}
                      >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-sm truncate">{item.title}</h4>
                          <p className="text-sm md:text-sm font-semibold text-primary">{item.price}</p>
                          <p className="text-xs text-muted-foreground">{item.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Another Ad Slot */}
              <div className="space-y-4">
                {advertisements.slice(1, 2).map((ad) => (
                  <AdvertisementCard key={ad.id} ad={ad} />
                ))}
              </div>

              {/* Trending Topics */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                    <span>Trending</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automations">
          <HomeAutomations />
        </TabsContent>

        <TabsContent value="insights">
          <NeighborhoodInsights />
        </TabsContent>

        <TabsContent value="ads" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {advertisements.map((ad) => (
              <AdvertisementCard key={ad.id} ad={ad} />
            ))}
          </div>
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