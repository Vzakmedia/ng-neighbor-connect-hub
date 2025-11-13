import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CalendarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, UsersIcon, EyeIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';

interface PromotionCampaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  target_audience: any;
  target_locations: any;
}

interface PromotedPost {
  id: string;
  campaign_id: string;
  post_type: string;
  post_content: any;
  daily_budget: number;
  cost_per_click: number;
  is_active: boolean;
}

interface PromotionAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  click_through_rate: number;
  conversion_rate: number;
}

export const PromotionManagement = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<PromotedPost[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, PromotionAnalytics>>({});
  const [loading, setLoading] = useState(true);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    budget: '',
    start_date: '',
    end_date: '',
    target_locations: [] as string[]
  });

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchPromotedPosts();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const fetchPromotedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('promoted_posts')
        .select(`
          *,
          promotion_campaigns (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotedPosts(data || []);

      // Fetch analytics for each promoted post
      if (data) {
        for (const post of data) {
          await fetchAnalytics(post.id);
        }
      }
    } catch (error) {
      console.error('Error fetching promoted posts:', error);
      toast.error('Failed to load promoted posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (promotedPostId: string) => {
    try {
      const { data, error } = await supabase
        .from('promotion_analytics')
        .select('*')
        .eq('promoted_post_id', promotedPostId)
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data[0]) {
        setAnalytics(prev => ({
          ...prev,
          [promotedPostId]: data[0]
        }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const createCampaign = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('promotion_campaigns')
        .insert([{
          user_id: user.id,
          title: newCampaign.title,
          description: newCampaign.description,
          budget: parseFloat(newCampaign.budget),
          start_date: newCampaign.start_date,
          end_date: newCampaign.end_date,
          target_locations: newCampaign.target_locations,
          status: 'draft'
        }]);

      if (error) throw error;

      toast.success('Campaign created successfully');
      setNewCampaign({
        title: '',
        description: '',
        budget: '',
        start_date: '',
        end_date: '',
        target_locations: []
      });
      setShowCreateForm(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('promotion_campaigns')
        .update({ status })
        .eq('id', campaignId);

      if (error) throw error;

      toast.success(`Campaign ${status} successfully`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Promotion Management</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          Create Campaign
        </Button>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="posts">Promoted Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Campaign Title</Label>
                    <Input
                      id="title"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter campaign title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (₦)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Campaign description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={newCampaign.start_date}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={newCampaign.end_date}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={createCampaign}>Create Campaign</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {campaign.title}
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Budget: ₦{campaign.budget}</p>
                      <p className="text-sm text-gray-600">Spent: ₦{campaign.spent_amount}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress 
                      value={(campaign.spent_amount / campaign.budget) * 100} 
                      className="w-full"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-x-2">
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateCampaignStatus(campaign.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                          >
                            Pause
                          </Button>
                        )}
                        {campaign.status === 'paused' && (
                          <Button 
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'active')}
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4">
            {promotedPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{post.post_content?.title || 'Promoted Content'}</span>
                    <Badge variant={post.is_active ? "default" : "secondary"}>
                      {post.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Type: {post.post_type} | Daily Budget: ₦{post.daily_budget} | CPC: ₦{post.cost_per_click}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {post.post_content?.description}
                  </p>
                  {analytics[post.id] && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span className="font-semibold">{analytics[post.id].impressions}</span>
                        </div>
                        <p className="text-xs text-gray-500">Impressions</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          <span className="font-semibold">{analytics[post.id].clicks}</span>
                        </div>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-semibold">{(analytics[post.id].click_through_rate * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-gray-500">CTR</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">₦{analytics[post.id].spend}</span>
                        </div>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{campaigns.reduce((sum, c) => sum + c.spent_amount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(analytics).reduce((sum, a) => sum + a.impressions, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};