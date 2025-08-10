import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, BarChart3, DollarSign, TrendingUp, Users, Eye } from 'lucide-react';
import { CreateAdCampaignDialog } from '@/components/advertising/CreateAdCampaignDialog';
import { AdCampaignCard } from '@/components/advertising/AdCampaignCard';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Advertising = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCTR: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchAnalytics();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('status, total_spent, total_impressions, total_clicks')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = data?.reduce((acc, campaign) => {
        acc.totalCampaigns += 1;
        if (campaign.status === 'active') acc.activeCampaigns += 1;
        acc.totalSpent += campaign.total_spent || 0;
        acc.totalImpressions += campaign.total_impressions || 0;
        acc.totalClicks += campaign.total_clicks || 0;
        return acc;
      }, {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0
      }) || analytics;

      const averageCTR = stats.totalImpressions > 0 
        ? ((stats.totalClicks / stats.totalImpressions) * 100) 
        : 0;

      setAnalytics({ ...stats, averageCTR });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`,
      });

      fetchCampaigns();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PaymentStatusHandler />
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Advertising</h1>
            <p className="text-muted-foreground">Promote your content and reach more customers</p>
          </div>
          <CreateAdCampaignDialog onCampaignCreated={fetchCampaigns}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </CreateAdCampaignDialog>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalClicks} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageCTR.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns */}
        <Tabs defaultValue="all" className="w-full">
          {/* Mobile tab buttons */}
          <div className="md:hidden flex items-center justify-center gap-1 mb-6 overflow-x-auto">
            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">All</Button>
            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">Active</Button>
            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">Pending</Button>
            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">Done</Button>
          </div>
          
          {/* Desktop tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-4">
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Create your first advertising campaign to promote your services, products, or content to a wider audience.
                  </p>
                  <CreateAdCampaignDialog onCampaignCreated={fetchCampaigns}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </CreateAdCampaignDialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign: any) => (
                  <AdCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onStatusChange={handleStatusChange}
                    onViewAnalytics={(id) => console.log('View analytics for:', id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((c: any) => c.status === 'active')
                .map((campaign: any) => (
                  <AdCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onStatusChange={handleStatusChange}
                    onViewAnalytics={(id) => console.log('View analytics for:', id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((c: any) => c.status === 'pending_approval' || c.status === 'pending_payment' || c.status === 'draft')
                .map((campaign: any) => (
                  <AdCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onStatusChange={handleStatusChange}
                    onViewAnalytics={(id) => console.log('View analytics for:', id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns
                .filter((c: any) => c.status === 'completed')
                .map((campaign: any) => (
                  <AdCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onStatusChange={handleStatusChange}
                    onViewAnalytics={(id) => console.log('View analytics for:', id)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Advertising;