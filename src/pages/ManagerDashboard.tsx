import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { BarChart3, Building, TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Settings, ArrowLeft } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StaffInvitationManager from "@/components/StaffInvitationManager";
import ManagePromotionDialog from "@/components/ManagePromotionDialog";

const BusinessVerificationAdmin = lazy(() => import("@/components/BusinessVerificationAdmin"));

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    pendingVerifications: 0,
    activePromotions: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    marketplaceItems: 0
  });
  
  const [businesses, setBusinesses] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [pendingAdCampaigns, setPendingAdCampaigns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  // Check if user has manager role
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['manager', 'super_admin'])
        .single();
      
      setUserRole(data?.role);
    };
    
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (!user || !userRole) return;

    const fetchManagerData = async () => {
      try {
        // Fetch business statistics
        const { count: businessesCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });

        const { count: pendingCount } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');

        // Fetch promotions count
        const { count: promotionsCount } = await supabase
          .from('promotions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch marketplace items
        const { count: marketplaceCount } = await supabase
          .from('marketplace_items')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalBusinesses: businessesCount || 0,
          pendingVerifications: pendingCount || 0,
          activePromotions: promotionsCount || 0,
          monthlyRevenue: 0, // Calculate from payments
          totalUsers: usersCount || 0,
          marketplaceItems: marketplaceCount || 0
        });

        // Fetch detailed business data
        const { data: businessesData } = await supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch promotions data
        const { data: promotionsData } = await supabase
          .from('promotions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch pending advertisement campaigns (admin feature parity)
        const { data: adCampaignsData } = await supabase
          .from('advertisement_campaigns')
          .select('id, campaign_name, campaign_type, status, approval_status, target_geographic_scope, daily_budget, total_budget, total_spent, total_impressions, total_clicks, start_date, end_date, created_at, ad_title, ad_description')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        setBusinesses(businessesData || []);
        setPromotions(promotionsData || []);
        setPendingAdCampaigns(adCampaignsData || []);

      } catch (error) {
        console.error('Error fetching manager data:', error);
        toast({
          title: "Error",
          description: "Failed to load manager data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();

    // Set up real-time subscriptions
    const managerChannel = supabase.channel('manager-updates');

    managerChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'businesses' }, 
      (payload) => {
        console.log('Businesses change:', payload);
        if (payload.eventType === 'INSERT') {
          setBusinesses(prev => [payload.new, ...prev.slice(0, 19)]);
          setStats(prev => ({ ...prev, totalBusinesses: prev.totalBusinesses + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setBusinesses(prev => prev.map(business => 
            business.id === payload.new.id ? payload.new : business
          ));
        }
      }
    );

    managerChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'promotions' }, 
      (payload) => {
        console.log('Promotions change:', payload);
        if (payload.eventType === 'INSERT') {
          setPromotions(prev => [payload.new, ...prev.slice(0, 19)]);
          if (payload.new.status === 'active') {
            setStats(prev => ({ ...prev, activePromotions: prev.activePromotions + 1 }));
          }
        } else if (payload.eventType === 'UPDATE') {
          setPromotions(prev => prev.map(promo => 
            promo.id === payload.new.id ? payload.new : promo
          ));
          // Adjust active count when status changes
          if (payload.old.status !== payload.new.status) {
            setStats(prev => ({
              ...prev,
              activePromotions: prev.activePromotions + (payload.new.status === 'active' ? 1 : 0) - (payload.old.status === 'active' ? 1 : 0)
            }));
          }
        }
      }
    );

    // Pending ad campaigns subscription
    managerChannel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'advertisement_campaigns' },
      (payload) => {
        console.log('Ad campaigns change:', payload);
        setPendingAdCampaigns((prev) => {
          const oldRow: any = (payload as any).old || {};
          const newRow: any = (payload as any).new || {};
          const wasPending = oldRow.approval_status === 'pending';
          const isPending = newRow.approval_status === 'pending';
          // INSERT
          if (payload.eventType === 'INSERT' && isPending) {
            return [newRow, ...prev.filter(c => c.id !== newRow.id)].slice(0, 50);
          }
          // UPDATE transitions
          if (payload.eventType === 'UPDATE') {
            if (wasPending && !isPending) {
              return prev.filter(c => c.id !== newRow.id);
            }
            if (isPending) {
              return prev.map(c => c.id === newRow.id ? newRow : c);
            }
          }
          return prev;
        });
      }
    );

    managerChannel.subscribe();

    return () => {
      supabase.removeChannel(managerChannel);
    };
  }, [user, userRole, toast]);

  const handleApproveCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', campaignId);
      if (error) throw error;
      toast({ title: 'Campaign approved', description: 'The ad is now active.' });
      setPendingAdCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (e) {
      console.error('Approve campaign error', e);
      toast({ title: 'Error', description: 'Failed to approve campaign', variant: 'destructive' });
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'rejected',
          status: 'rejected'
        })
        .eq('id', campaignId);
      if (error) throw error;
      toast({ title: 'Campaign rejected', description: 'The ad has been rejected.' });
      setPendingAdCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (e) {
      console.error('Reject campaign error', e);
      toast({ title: 'Error', description: 'Failed to reject campaign', variant: 'destructive' });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole || !['manager', 'super_admin'].includes(userRole)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the manager dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Business operations and platform management</p>
          <div className="flex items-center mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live updates enabled</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/landing')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Landing
        </Button>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="businesses" className="w-full justify-start">
            <Building className="h-4 w-4 mr-2" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="promotions" className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="ad-campaigns" className="w-full justify-start">
            <DollarSign className="h-4 w-4 mr-2" />
            Ad Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="team" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.totalBusinesses}</div>
                  <p className="text-xs text-muted-foreground">Registered businesses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.pendingVerifications}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.activePromotions}</div>
                  <p className="text-xs text-muted-foreground">Running campaigns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Total registered</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marketplace Items</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.marketplaceItems}</div>
                  <p className="text-xs text-muted-foreground">Active listings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₦{stats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Business Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {businesses.slice(0, 5).map((business) => (
                    <div key={business.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={business.verification_status === 'verified' ? "default" : "secondary"}>
                          {business.verification_status}
                        </Badge>
                        <span className="text-sm">{business.business_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(business.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {businesses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No business applications</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Promotions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {promotions.slice(0, 5).map((promotion) => (
                    <div key={promotion.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={promotion.status === 'active' ? "default" : "secondary"}>
                          {promotion.status}
                        </Badge>
                        <span className="text-sm">{promotion.title || 'Promotion'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(promotion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {promotions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active promotions</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Businesses Tab */}
          <TabsContent value="businesses">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading business tools...</div>}>
              <BusinessVerificationAdmin />
            </Suspense>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Campaign Management</CardTitle>
                <CardDescription>Manage advertising campaigns and sponsored content</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>{promotion.title || 'Untitled Campaign'}</TableCell>
                        <TableCell>₦{(promotion.budget || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={promotion.status === 'active' ? "default" : "secondary"}>
                            {promotion.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(promotion.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedPromotion(promotion); setManageOpen(true); }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ad Campaigns Tab */}
          <TabsContent value="ad-campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Ad Campaign Approvals</CardTitle>
                <CardDescription>Review and approve pending advertisement campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAdCampaigns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No pending campaigns</TableCell>
                      </TableRow>
                    )}
                    {pendingAdCampaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.ad_title || c.campaign_name || 'Untitled'}</TableCell>
                        <TableCell>{c.campaign_type}</TableCell>
                        <TableCell>₦{(c.total_budget || 0).toLocaleString()}</TableCell>
                        <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" onClick={() => handleApproveCampaign(c.id)}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectCampaign(c.id)}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics</CardTitle>
                <CardDescription>Platform performance and business insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">Detailed business analytics and reporting coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <StaffInvitationManager />
          </TabsContent>
        </div>
      </Tabs>

      <ManagePromotionDialog 
        open={manageOpen} 
        onOpenChange={setManageOpen} 
        promotion={selectedPromotion}
        onUpdated={(updated) => {
          if (!updated) return;
          setPromotions((prev: any[]) => prev.map((p) => p.id === updated.id ? updated : p));
        }}
      />
    </div>
  );
};

export default ManagerDashboard;