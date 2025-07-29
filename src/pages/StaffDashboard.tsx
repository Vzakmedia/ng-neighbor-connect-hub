import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, Flag, ShoppingCart, Eye, FileText, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StaffDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    flaggedContent: 0,
    marketplaceItems: 0,
    tasksCompleted: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user has staff role
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['staff', 'super_admin'])
        .single();
      
      setUserRole(data?.role);
    };
    
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (!user || !userRole) return;

    const fetchStaffData = async () => {
      try {
        // Fetch basic statistics
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: flaggedCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: marketplaceCount } = await supabase
          .from('marketplace_items')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          flaggedContent: flaggedCount || 0,
          marketplaceItems: marketplaceCount || 0,
          tasksCompleted: 0 // Track daily completed tasks
        });

        // Fetch recent users (limited view for staff)
        const { data: usersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, city, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch flagged content (read-only for staff)
        const { data: flaggedData } = await supabase
          .from('content_reports')
          .select('id, content_type, reason, created_at, status')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch marketplace items (monitoring view)
        const { data: marketplaceData } = await supabase
          .from('marketplace_items')
          .select('id, title, price, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        setRecentUsers(usersData || []);
        setFlaggedContent(flaggedData || []);
        setMarketplaceItems(marketplaceData || []);

      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast({
          title: "Error",
          description: "Failed to load staff data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();

    // Set up real-time subscriptions for monitoring
    const staffChannel = supabase.channel('staff-updates');

    // Enhanced real-time handlers with error handling
    staffChannel.on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'profiles' }, 
      (payload) => {
        try {
          console.log('New user registered:', payload);
          setRecentUsers(prev => [payload.new, ...prev.slice(0, 9)]);
          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        } catch (error) {
          console.error('Error handling new user event:', error);
        }
      }
    );

    staffChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'content_reports' }, 
      (payload) => {
        try {
          console.log('Content report change:', payload);
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            setFlaggedContent(prev => [payload.new, ...prev.slice(0, 9)]);
            setStats(prev => ({ ...prev, flaggedContent: prev.flaggedContent + 1 }));
          } else if (payload.eventType === 'UPDATE') {
            setFlaggedContent(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ));
            // Update stats if status changed from pending
            if (payload.old?.status === 'pending' && payload.new.status !== 'pending') {
              setStats(prev => ({ ...prev, flaggedContent: Math.max(0, prev.flaggedContent - 1) }));
            }
          }
        } catch (error) {
          console.error('Error handling content report event:', error);
        }
      }
    );

    staffChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'marketplace_items' }, 
      (payload) => {
        try {
          console.log('Marketplace item change:', payload);
          if (payload.eventType === 'INSERT') {
            setMarketplaceItems(prev => [payload.new, ...prev.slice(0, 9)]);
            setStats(prev => ({ ...prev, marketplaceItems: prev.marketplaceItems + 1 }));
          } else if (payload.eventType === 'UPDATE') {
            setMarketplaceItems(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ));
          }
        } catch (error) {
          console.error('Error handling marketplace item event:', error);
        }
      }
    );

    staffChannel.subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
    };
  }, [user, userRole, toast]);

  const handleFlagContent = async (contentId, contentType) => {
    try {
      // Staff can flag content for review
      const { error } = await supabase
        .from('content_reports')
        .insert({
          content_id: contentId,
          content_type: contentType,
          reason: 'Staff Review',
          description: 'Flagged by staff for review',
          reporter_id: user.id
        });

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_staff_activity', {
        _action_type: 'flag_content',
        _resource_type: contentType,
        _resource_id: contentId,
        _details: { reason: 'Staff Review' }
      });

      toast({
        title: "Success",
        description: "Content flagged for review"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag content",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole || !['staff', 'super_admin'].includes(userRole)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the staff dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Platform monitoring and basic operations</p>
        <div className="flex items-center mt-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Monitoring active</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="w-full justify-start">
            <Flag className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.flaggedContent}</div>
                  <p className="text-xs text-muted-foreground">Pending review</p>
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
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">New User</Badge>
                        <span className="text-sm">{user.full_name || 'Unknown'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {recentUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent user activity</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Flags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flaggedContent.slice(0, 5).map((content) => (
                    <div key={content.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">{content.reason}</Badge>
                        <span className="text-sm">{content.content_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {flaggedContent.length === 0 && (
                    <p className="text-sm text-muted-foreground">No flagged content</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>View basic user information and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.full_name || 'Unknown'}</TableCell>
                        <TableCell>{user.city || 'Not specified'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Monitoring</CardTitle>
                <CardDescription>Monitor and flag inappropriate content</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell>
                          <Badge variant="outline">{content.content_type}</Badge>
                        </TableCell>
                        <TableCell>{content.reason}</TableCell>
                        <TableCell>
                          <Badge variant={content.status === 'pending' ? "destructive" : "secondary"}>
                            {content.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(content.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFlagContent(content.id, content.content_type)}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace Monitoring</CardTitle>
                <CardDescription>Monitor marketplace activity and listings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketplaceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>₦{(item.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'active' ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StaffDashboard;