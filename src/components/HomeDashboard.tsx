import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare
} from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import HeroSection from './HeroSection';

const HomeDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');

  const quickStats = [
    { icon: Users, label: 'Active Neighbors', value: '2,400+', color: 'text-community-blue', trend: '+12%' },
    { icon: MessageSquare, label: 'Posts Today', value: '24', color: 'text-primary', trend: '+8%' },
    { icon: Calendar, label: 'Upcoming Events', value: '7', color: 'text-community-yellow', trend: '+2%' },
    { icon: ShoppingBag, label: 'Items for Sale', value: '89', color: 'text-community-green', trend: '+15%' },
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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection />

      {/* Welcome Section - now more compact */}
      <div className="bg-gradient-primary rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Good morning! 👋</h2>
            <p className="text-white/90 text-sm">What's happening in your neighborhood today?</p>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Community Updates</CardTitle>
                <div className="flex space-x-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <CommunityFeed />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-community-yellow" />
                  Upcoming Events
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-primary pl-4 pb-4 last:pb-0">
                    <h4 className="font-medium mb-1">{event.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
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
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                Safety & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safetyAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge 
                        variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Highlights */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-community-green" />
                  Marketplace
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketplaceHighlights.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <p className="text-sm font-semibold text-primary">{item.price}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Trending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm text-primary">{topic.tag}</span>
                    <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;