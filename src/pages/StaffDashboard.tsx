import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Users, Flag, ShoppingCart, Eye, FileText, Clock, CheckCircle, ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, Activity } from '@/lib/icons';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const StaffDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    flaggedContent: 0,
    marketplaceItems: 0,
    activeMarketplaceItems: 0,
    totalPosts: 0,
    tasksCompleted: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        // Fetch comprehensive statistics
        const [
          { count: usersCount },
          { count: newUsersCount },
          { count: flaggedCount },
          { count: marketplaceCount },
          { count: activeMarketplaceCount },
          { count: postsCount }
        ] = await Promise.all([
          supabase.rpc('get_profiles_analytics').then(result => ({ count: result.data?.length || 0 })),
          supabase.rpc('get_profiles_analytics').then(result => ({ count: result.data?.filter(p => new Date(p.created_at).toISOString().split('T')[0] >= new Date().toISOString().split('T')[0]).length || 0 })),
          supabase.from('content_reports').select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
          supabase.from('marketplace_items').select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase.from('community_posts').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          totalUsers: usersCount || 0,
          newUsersToday: newUsersCount || 0,
          flaggedContent: flaggedCount || 0,
          marketplaceItems: marketplaceCount || 0,
          activeMarketplaceItems: activeMarketplaceCount || 0,
          totalPosts: postsCount || 0,
          tasksCompleted: 0
        });

        // Fetch recent users with more details
        const { data: usersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, city, state, created_at, email_verified')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch flagged content with more context
        const { data: flaggedData } = await supabase
          .from('content_reports')
          .select(`
            id, content_type, reason, description, created_at, status,
            reporter_id,
            profiles!content_reports_reporter_id_fkey(full_name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch marketplace items with seller info
        const { data: marketplaceData } = await supabase
          .from('marketplace_items')
          .select(`
            id, title, price, status, created_at, category,
            user_id,
            profiles!marketplace_items_user_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch recent community posts
        const { data: postsData } = await supabase
          .from('community_posts')
          .select(`
            id, title, content, created_at, post_type,
            user_id,
            profiles!community_posts_user_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        setRecentUsers(usersData || []);
        setFlaggedContent(flaggedData || []);
        setMarketplaceItems(marketplaceData || []);
        setCommunityPosts(postsData || []);

      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast({
          title: "Error",
          description: "Failed to load staff data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
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

  const refreshData = async () => {
    setRefreshing(true);
    // Re-trigger the useEffect by toggling a dependency
    const event = new CustomEvent('refreshStaffData');
    window.dispatchEvent(event);
  };

  const handleViewUser = (userId) => {
    toast({
      title: "User Details",
      description: `Viewing details for user: ${userId}`,
    });
  };

  const handleViewContent = (contentId) => {
    toast({
      title: "Content Details", 
      description: `Viewing content: ${contentId}`,
    });
  };

  const handleViewMarketplaceItem = (itemId) => {
    toast({
      title: "Marketplace Item",
      description: `Viewing marketplace item: ${itemId}`,
    });
  };

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">Platform monitoring and basic operations</p>
          <div className="flex items-center mt-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Monitoring active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/staff-portal')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <Activity className="h-4 w-4 mr-2" />
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
                  <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.newUsersToday}</div>
                  <p className="text-xs text-muted-foreground">Registered today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{loading ? '...' : stats.flaggedContent}</div>
                  <p className="text-xs text-muted-foreground">Pending review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.activeMarketplaceItems}</div>
                  <p className="text-xs text-muted-foreground">of {stats.marketplaceItems} total</p>
                  <Progress 
                    value={stats.marketplaceItems > 0 ? (stats.activeMarketplaceItems / stats.marketplaceItems) * 100 : 0} 
                    className="h-1 mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Total posts</p>
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
                <CardTitle>User Management</CardTitle>
                <CardDescription>Monitor user accounts and activity ({recentUsers.length} users shown)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.full_name || 'Unknown'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email || 'Not provided'}
                        </TableCell>
                        <TableCell>{[user.city, user.state].filter(Boolean).join(', ') || 'Not specified'}</TableCell>
                        <TableCell>
                          <Badge variant={user.email_verified ? "default" : "secondary"}>
                            {user.email_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewUser(user.user_id)}
                          >
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
                <CardDescription>Monitor flagged content and community posts ({flaggedContent.length} pending reports)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Flagged Content</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Reporter</TableHead>
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
                            <TableCell className="text-sm text-muted-foreground">
                              {content.profiles?.full_name || 'Anonymous'}
                            </TableCell>
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
                                onClick={() => handleViewContent(content.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Community Posts</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communityPosts.slice(0, 5).map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="max-w-xs truncate">
                              {post.title || post.content?.substring(0, 50) + '...' || 'Untitled'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {post.profiles?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{post.post_type}</Badge>
                            </TableCell>
                            <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleFlagContent(post.id, 'community_post')}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace Monitoring</CardTitle>
                <CardDescription>Monitor marketplace activity and listings ({marketplaceItems.length} recent items)</CardDescription>
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
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketplaceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.profiles?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>₦{(item.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'active' ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewMarketplaceItem(item.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleFlagContent(item.id, 'marketplace_item')}
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          </div>
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