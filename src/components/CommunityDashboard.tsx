import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare,
  Users,
  Calendar,
  ShoppingBag,
  Shield,
  TrendingUp,
  Plus,
  Filter,
  Search,
  Bell,
  Settings
} from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import CommunityBoards from './CommunityBoards';
import CommunityAutomations from './CommunityAutomations';
import AdvertisementCard from './AdvertisementCard';
import CreatePostDialog from './CreatePostDialog';
import HomeIntegration from './HomeIntegration';

const CommunityDashboard = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Sample advertisements
  const advertisements = [
    {
      id: '1',
      title: 'Fresh Groceries Delivered',
      description: 'Get fresh groceries delivered to your door within 30 minutes',
      business: 'QuickMart Lagos',
      location: 'Victoria Island',
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 234,
      category: 'Grocery',
      sponsored: true,
      ctaText: 'Order Now',
      ctaUrl: '#'
    },
    {
      id: '2',
      title: 'Home Security System',
      description: 'Professional installation and 24/7 monitoring for your peace of mind',
      business: 'SecureHome NG',
      location: 'Ikoyi',
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 156,
      category: 'Security',
      sponsored: true,
      ctaText: 'Get Quote',
      ctaUrl: '#'
    },
    {
      id: '3',
      title: 'Local Cleaning Service',
      description: 'Professional home and office cleaning services in your neighborhood',
      business: 'CleanPro Lagos',
      location: 'Victoria Island',
      image: '/placeholder.svg',
      rating: 4.7,
      reviews: 89,
      category: 'Services',
      sponsored: true,
      ctaText: 'Book Now',
      ctaUrl: '#'
    }
  ];

  const communityStats = [
    { icon: Users, label: 'Active Members', value: '2,847', change: '+12%' },
    { icon: MessageSquare, label: 'Posts Today', value: '156', change: '+8%' },
    { icon: Calendar, label: 'Upcoming Events', value: '12', change: '+3%' },
    { icon: ShoppingBag, label: 'Marketplace Items', value: '234', change: '+15%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Victoria Island Community</h1>
            <p className="text-white/90">Stay connected with your neighbors and local businesses</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button 
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setCreatePostOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {communityStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed Area */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="boards">Boards</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="mt-6">
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Community Updates</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CommunityFeed activeTab="all" />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="boards" className="mt-6">
              <CommunityBoards />
            </TabsContent>
            
            <TabsContent value="automations" className="mt-6">
              <CommunityAutomations />
            </TabsContent>
            
            <TabsContent value="integration" className="mt-6">
              <HomeIntegration />
            </TabsContent>
            
            <TabsContent value="insights" className="mt-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Community Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Detailed analytics and insights about your community engagement will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Local Business Ads */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <ShoppingBag className="h-5 w-5 mr-2 text-community-green" />
                Local Businesses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {advertisements.map((ad) => (
                <AdvertisementCard key={ad.id} ad={ad} size="small" />
              ))}
              <Button variant="outline" size="sm" className="w-full">
                View More Businesses
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Report Safety Issue
                </Button>
                <Button variant="outline" className="justify-start" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button variant="outline" className="justify-start" size="sm">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Sell Item
                </Button>
                <Button variant="outline" className="justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Find Neighbors
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Be respectful and kind to neighbors</p>
                <p>• Keep discussions relevant to the community</p>
                <p>• Report suspicious activities to authorities</p>
                <p>• Help maintain a positive environment</p>
              </div>
              <Button variant="link" className="p-0 h-auto text-primary mt-2">
                Read full guidelines →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </div>
  );
};

export default CommunityDashboard;