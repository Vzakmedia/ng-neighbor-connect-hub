import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, MessageSquare, Shield, TrendingUp, MapPin, Calendar, ShoppingCart, Settings, AlertTriangle, Edit, DollarSign, Eye, Play, Pause, BarChart3, Download, Clock, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import BusinessVerificationAdmin from "@/components/BusinessVerificationAdmin";

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for real-time data
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePosts: 0,
    eventsThisMonth: 0,
    safetyReports: 0,
    emergencyAlerts: 0,
    marketplaceItems: 0,
    promotions: 0,
    flaggedContent: 0,
    sponsoredContent: 0,
    activeAutomations: 0,
    configSettings: 0
  });
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [sponsoredContent, setSponsoredContent] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [appConfigs, setAppConfigs] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simple admin check
  const isAdmin = user?.email === "vzakfenwa@gmail.com";

  // Real-time data fetching
  useEffect(() => {
    if (!isAdmin) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch community posts count
        const { count: postsCount } = await supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true });

        // Fetch events this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { count: eventsCount } = await supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true })
          .eq('post_type', 'event')
          .gte('created_at', startOfMonth.toISOString());

        // Fetch safety alerts count
        const { count: alertsCount } = await supabase
          .from('safety_alerts')
          .select('*', { count: 'exact', head: true });

        // Fetch emergency alerts count
        const { count: emergencyCount } = await supabase
          .from('panic_alerts')
          .select('*', { count: 'exact', head: true });

        // Fetch marketplace items count
        const { count: marketplaceCount } = await supabase
          .from('marketplace_items')
          .select('*', { count: 'exact', head: true });

        // Fetch promotions count
        const { count: promotionsCount } = await supabase
          .from('promotions')
          .select('*', { count: 'exact', head: true });

        // Fetch flagged content count
        const { count: flaggedCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch sponsored content count
        const { count: sponsoredCount } = await supabase
          .from('sponsored_content')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gt('end_date', new Date().toISOString());

        // Fetch active automations count
        const { count: automationsCount } = await supabase
          .from('platform_automations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch app configuration count
        const { count: configCount } = await supabase
          .from('app_configuration')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          activePosts: postsCount || 0,
          eventsThisMonth: eventsCount || 0,
          safetyReports: alertsCount || 0,
          emergencyAlerts: emergencyCount || 0,
          marketplaceItems: marketplaceCount || 0,
          promotions: promotionsCount || 0,
          flaggedContent: flaggedCount || 0,
          sponsoredContent: sponsoredCount || 0,
          activeAutomations: automationsCount || 0,
          configSettings: configCount || 0
        });

        // Fetch detailed data for management
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: emergencyData } = await supabase
          .from('panic_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: promotionsData } = await supabase
          .from('promotions')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: marketplaceData } = await supabase
          .from('marketplace_items')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch flagged content for moderation
        const { data: reportsData } = await supabase
          .from('content_reports')
          .select('*, profiles(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch sponsored content for management
        const { data: sponsoredData } = await supabase
          .from('sponsored_content')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch automations data
        const { data: automationsData } = await supabase
          .from('platform_automations')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch app configuration data
        const { data: configData } = await supabase
          .from('app_configuration')
          .select('*')
          .order('updated_at', { ascending: false });

        // Fetch automation logs
        const { data: logsData } = await supabase
          .from('automation_logs')
          .select('*, platform_automations(name)')
          .order('executed_at', { ascending: false })
          .limit(20);

        setUsers(usersData || []);
        setEmergencyAlerts(emergencyData || []);
        setPromotions(promotionsData || []);
        setMarketplaceItems(marketplaceData || []);
        setFlaggedReports(reportsData || []);
        setSponsoredContent(sponsoredData || []);
        setAutomations(automationsData || []);
        setAppConfigs(configData || []);
        setAutomationLogs(logsData || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchDashboardData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'community_posts' }, 
        () => fetchDashboardData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'panic_alerts' }, 
        () => fetchDashboardData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'promotions' }, 
        () => fetchDashboardData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'marketplace_items' }, 
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast]);

  // Emergency alert management
  const handleEmergencyAlert = async (alertId, action) => {
    try {
      if (action === 'resolve') {
        const { error } = await supabase
          .from('panic_alerts')
          .update({ 
            is_resolved: true, 
            resolved_at: new Date().toISOString(),
            resolved_by: user.id 
          })
          .eq('id', alertId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Emergency alert resolved"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update emergency alert",
        variant: "destructive"
      });
    }
  };

  // Promotion management
  const handlePromotionStatus = async (promotionId, status) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ status })
        .eq('id', promotionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promotion ${status}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promotion",
        variant: "destructive"
      });
    }
  };

  // Marketplace item management
  const handleMarketplaceStatus = async (itemId, status) => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Item ${status}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update marketplace item",
        variant: "destructive"
      });
    }
  };

  // Content moderation management
  const handleContentReport = async (reportId, action) => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({ 
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${action}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content report",
        variant: "destructive"
      });
    }
  };

  // Sponsored content management
  const handleSponsoredContent = async (contentId, action) => {
    try {
      const { error } = await supabase
        .from('sponsored_content')
        .update({ status: action })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Sponsored content ${action}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sponsored content",
        variant: "destructive"
      });
    }
  };

  // Automation management
  const handleAutomationToggle = async (automationId, isActive) => {
    try {
      const { error } = await supabase
        .from('platform_automations')
        .update({ is_active: isActive })
        .eq('id', automationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Automation ${isActive ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update automation",
        variant: "destructive"
      });
    }
  };

  // App configuration management
  const handleConfigUpdate = async (configKey, configValue) => {
    try {
      const { error } = await supabase
        .from('app_configuration')
        .update({ 
          config_value: configValue,
          updated_by: user.id
        })
        .eq('config_key', configKey);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Real-time neighborhood platform management</p>
        <div className="flex items-center mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live data updates enabled</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="emergency" className="w-full justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="promotions" className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="content" className="w-full justify-start">
            <MessageSquare className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="businesses" className="w-full justify-start">
            <Building className="h-4 w-4 mr-2" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="automations" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Real-time count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.activePosts}</div>
                <p className="text-xs text-muted-foreground">Community posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.eventsThisMonth}</div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{loading ? '...' : stats.emergencyAlerts}</div>
                <p className="text-xs text-muted-foreground">Active alerts</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.promotions}</div>
                <p className="text-xs text-muted-foreground">Sponsored content</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Safety Reports</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.safetyReports}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Emergency Broadcast
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage User Roles
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Moderate Content
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Platform Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Emergency Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emergencyAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.is_resolved ? "secondary" : "destructive"}>
                        {alert.is_resolved ? "Resolved" : "Active"}
                      </Badge>
                      <span className="text-sm">{alert.situation_type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {emergencyAlerts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No emergency alerts</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage platform users and authentication</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input placeholder="Search users..." className="max-w-sm" />
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.city || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_verified ? "default" : "secondary"}>
                            {user.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Management Tab */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Alert Management</CardTitle>
              <p className="text-sm text-muted-foreground">Monitor and manage emergency situations</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emergencyAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant="destructive">{alert.situation_type}</Badge>
                      </TableCell>
                      <TableCell>{alert.address || 'Location not provided'}</TableCell>
                      <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={alert.is_resolved ? "secondary" : "destructive"}>
                          {alert.is_resolved ? "Resolved" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!alert.is_resolved && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEmergencyAlert(alert.id, 'resolve')}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Management Tab */}
        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage marketplace listings and transactions</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketplaceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>₦{item.price}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'active' ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => handleMarketplaceStatus(item.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activate</SelectItem>
                            <SelectItem value="inactive">Deactivate</SelectItem>
                            <SelectItem value="sold">Mark Sold</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Management Tab */}
        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Sponsored Content</CardTitle>
              <p className="text-sm text-muted-foreground">Manage sponsored posts, events, and marketplace items</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>{promotion.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{promotion.item_type}</Badge>
                      </TableCell>
                      <TableCell>₦{promotion.budget}</TableCell>
                      <TableCell>{promotion.duration_days} days</TableCell>
                      <TableCell>
                        <Badge variant={
                          promotion.status === 'approved' ? "default" : 
                          promotion.status === 'pending' ? "secondary" : "destructive"
                        }>
                          {promotion.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => handlePromotionStatus(promotion.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Moderation Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <p className="text-sm text-muted-foreground">Review flagged user content</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pending Reports</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.flaggedContent}</div>
                        <p className="text-xs text-muted-foreground">Needs review</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Content Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.profiles?.full_name || 'Anonymous'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.content_type}</Badge>
                          </TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContentReport(report.id, 'reviewed')}
                              >
                                Review
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleContentReport(report.id, 'resolved')}
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sponsored Content Manager</CardTitle>
                <p className="text-sm text-muted-foreground">Manage boosted posts and promotions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Sponsorships</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.sponsoredContent}</div>
                        <p className="text-xs text-muted-foreground">Running campaigns</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Boost Level</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sponsoredContent.slice(0, 5).map((content) => (
                        <TableRow key={content.id}>
                          <TableCell>{content.profiles?.full_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{content.content_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={content.boost_level > 3 ? "default" : "secondary"}>
                              Level {content.boost_level}
                            </Badge>
                          </TableCell>
                          <TableCell>₦{content.budget}</TableCell>
                          <TableCell>
                            <Select onValueChange={(value) => handleSponsoredContent(content.id, value)}>
                              <SelectTrigger className="w-20">
                                <SelectValue placeholder="..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Activate</SelectItem>
                                <SelectItem value="paused">Pause</SelectItem>
                                <SelectItem value="cancelled">Cancel</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Verification Tab */}
        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Verification Management
              </CardTitle>
              <CardDescription>
                Review and approve business registration applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessVerificationAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Automations</CardTitle>
                <p className="text-sm text-muted-foreground">Manage platform automation workflows</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Active Automations</h3>
                      <p className="text-sm text-muted-foreground">{loading ? '...' : stats.activeAutomations} workflows running</p>
                    </div>
                    <Button>
                      <Play className="mr-2 h-4 w-4" />
                      Create Automation
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automations.map((automation) => (
                        <TableRow key={automation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{automation.name}</div>
                              <div className="text-sm text-muted-foreground">{automation.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{automation.automation_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={automation.is_active ? "default" : "secondary"}>
                              {automation.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={automation.is_active}
                              onCheckedChange={(checked) => handleAutomationToggle(automation.id, checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Logs</CardTitle>
                <p className="text-sm text-muted-foreground">Recent automation executions</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Automation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Executed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.platform_automations?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={log.execution_status === 'success' ? "default" : "destructive"}>
                            {log.execution_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(log.executed_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Manage platform settings and configuration</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {appConfigs.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{config.config_key.replace(/_/g, ' ').toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Badge variant="outline">{config.config_type}</Badge>
                    </div>
                    
                    {config.config_type === 'theme' && (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Primary Color" 
                          defaultValue={config.config_value.primary_color}
                          className="mb-2"
                        />
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked={config.config_value.dark_mode} />
                          <span className="text-sm">Dark Mode</span>
                        </div>
                      </div>
                    )}
                    
                    {config.config_type === 'emergency_settings' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Alert Radius (km):</span>
                          <Input 
                            type="number" 
                            defaultValue={config.config_value.auto_alert_radius}
                            className="w-20"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked={config.config_value.auto_resolve_false_alarms} />
                          <span className="text-sm">Auto-resolve false alarms</span>
                        </div>
                      </div>
                    )}
                    
                    {config.config_type === 'app_settings' && (
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Configuration JSON"
                          defaultValue={JSON.stringify(config.config_value, null, 2)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleConfigUpdate(config.config_key, config.config_value)}
                    >
                      Save Changes
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and reporting for platform insights
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        Analytics events tracked
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0%</div>
                      <p className="text-xs text-muted-foreground">
                        User engagement
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Session Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0min</div>
                      <p className="text-xs text-muted-foreground">
                        Average session
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Button>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Open Advanced Analytics
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground">Real-time platform statistics</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Users</span>
                      <span className="text-sm font-medium">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Posts</span>
                      <span className="text-sm font-medium">{stats.activePosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Emergency Alerts</span>
                      <span className="text-sm font-medium">{stats.emergencyAlerts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Marketplace Items</span>
                      <span className="text-sm font-medium">{stats.marketplaceItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Automations</span>
                      <span className="text-sm font-medium">{stats.activeAutomations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Config Settings</span>
                      <span className="text-sm font-medium">{stats.configSettings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Content Moderation Stats</CardTitle>
                  <p className="text-sm text-muted-foreground">Content management overview</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Flagged Content</span>
                      <span className="text-sm font-medium">{stats.flaggedContent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sponsored Content</span>
                      <span className="text-sm font-medium">{stats.sponsoredContent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Promotions</span>
                      <span className="text-sm font-medium">{stats.promotions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Admin;