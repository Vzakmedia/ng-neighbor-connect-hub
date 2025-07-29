import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { BarChart3, Building, TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BusinessVerificationAdmin from "@/components/BusinessVerificationAdmin";

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

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

        setBusinesses(businessesData || []);
        setPromotions(promotionsData || []);

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
        }
      }
    );

    managerChannel.subscribe();

    return () => {
      supabase.removeChannel(managerChannel);
    };
  }, [user, userRole, toast]);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Business operations and platform management</p>
        <div className="flex items-center mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live updates enabled</span>
        </div>
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
          <TabsTrigger value="analytics" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
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
            <BusinessVerificationAdmin />
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
                          <Button variant="outline" size="sm">
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
        </div>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;