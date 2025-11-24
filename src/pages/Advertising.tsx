import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCampaignDialog } from "@/components/advertising/campaigns/CreateCampaignDialog";
import { useAdvertisingCampaigns } from "@/hooks/advertising/useAdvertisingCampaigns";
import { Campaign } from "@/types/advertising";
import { BarChart3, DollarSign, Eye, TrendingUp, Play, Pause } from '@/lib/icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PaymentStatusHandler from "@/components/PaymentStatusHandler";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useIsMobile } from "@/hooks/use-mobile";

const Advertising = () => {
  const { user } = useAuth();
  const { campaigns, loading, updateCampaignStatus, refetch } = useAdvertisingCampaigns();
  const isMobile = useIsMobile();

  const analytics = {
    totalCampaigns: campaigns.length,
    totalSpent: campaigns.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + (c.total_impressions || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0),
    averageCTR: campaigns.reduce((sum, c) => sum + (c.total_impressions || 0), 0) > 0
      ? (campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0) / 
         campaigns.reduce((sum, c) => sum + (c.total_impressions || 0), 0)) * 100
      : 0,
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      case 'pending_payment': return 'destructive';
      case 'pending_approval': return 'secondary';
      default: return 'outline';
    }
  };

  const getApprovalStatusColor = (status: Campaign['approval_status']) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to view your advertising campaigns.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderCampaignCard = (campaign: Campaign) => (
    <Card key={campaign.id} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
            <Badge variant={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            <Badge variant={getApprovalStatusColor(campaign.approval_status)}>
              {campaign.approval_status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{campaign.ad_title}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateCampaignStatus(campaign.id, 'paused')}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => updateCampaignStatus(campaign.id, 'active')}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Impressions</p>
          <p className="text-lg font-semibold">{campaign.total_impressions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Clicks</p>
          <p className="text-lg font-semibold">{campaign.total_clicks.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="text-lg font-semibold">₦{campaign.total_spent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Budget</p>
          <p className="text-lg font-semibold">₦{campaign.total_budget.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Budget Progress</span>
          <span>{((campaign.total_spent / campaign.total_budget) * 100).toFixed(1)}%</span>
        </div>
        <Progress value={(campaign.total_spent / campaign.total_budget) * 100} />
      </div>

      {campaign.rejection_reason && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-md">
          <p className="text-sm text-destructive">
            <strong>Rejection Reason:</strong> {campaign.rejection_reason}
          </p>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-6 space-y-6">
          <PaymentStatusHandler />

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active and completed campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{analytics.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
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
            <div className="text-2xl font-bold">
              {analytics.totalImpressions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ad views across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageCTR.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Click-through rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
          <TabsTrigger value="pending_payment">Pending Payment</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mt-6">
            {campaigns.map((campaign) => renderCampaignCard(campaign))}
          </div>

          {campaigns.length === 0 && (
            <Card className="p-12 text-center mt-6">
              <div className="max-w-md mx-auto">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first advertising campaign to start reaching your audience
                </p>
                <CreateCampaignDialog onCampaignCreated={refetch} />
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mt-6">
            {campaigns.filter(c => c.status === 'active').map((campaign) => renderCampaignCard(campaign))}
          </div>
        </TabsContent>

        <TabsContent value="pending_approval">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mt-6">
            {campaigns.filter(c => c.approval_status === 'pending').map((campaign) => renderCampaignCard(campaign))}
          </div>
        </TabsContent>

        <TabsContent value="pending_payment">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mt-6">
            {campaigns.filter(c => c.payment_status === 'pending').map((campaign) => renderCampaignCard(campaign))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mt-6">
            {campaigns.filter(c => c.status === 'completed').map((campaign) => renderCampaignCard(campaign))}
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Advertising;
