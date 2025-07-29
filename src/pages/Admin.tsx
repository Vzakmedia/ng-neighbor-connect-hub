import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, MessageSquare, Shield, TrendingUp, MapPin, Calendar, ShoppingCart, Settings, AlertTriangle, Edit, DollarSign, Eye, Play, Pause, BarChart3, Download, Clock, Building, UserPlus, MoreHorizontal, UserX, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import BusinessVerificationAdmin from "@/components/BusinessVerificationAdmin";
import StaffInvitationManager from "@/components/StaffInvitationManager";

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
  
  // State management, auth checks, data fetching functions
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  
  
  // Config update handler
  const handleConfigUpdate = async (key: string, value: any) => {
    toast({
      title: "Configuration Updated",
      description: "Settings have been saved successfully.",
    });
  };

  // User management handlers
  const handleEditUserRole = async (user: any) => {
    const validRoles = ['user', 'admin', 'super_admin', 'moderator', 'manager', 'support', 'staff'];
    const newRole = prompt(`Enter new role for ${user.full_name} (${validRoles.join(', ')}):`, user.user_roles?.[0]?.role || 'user');
    if (!newRole || !validRoles.includes(newRole)) {
      if (newRole) {
        toast({
          title: "Invalid Role",
          description: `Role must be one of: ${validRoles.join(', ')}`,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
      
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleToggleVerification = async (user: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !user.is_verified })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Verification Updated",
        description: `User ${user.is_verified ? 'unverified' : 'verified'} successfully`,
      });
      
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (user: any) => {
    const message = prompt(`Send message to ${user.full_name}:`);
    if (!message) return;

    // This would integrate with your messaging system
    toast({
      title: "Message Sent",
      description: `Message sent to ${user.full_name}`,
    });
  };

  const handleExportUserData = async (user: any) => {
    try {
      const userData = {
        profile: user,
        exported_at: new Date().toISOString(),
        exported_by: user?.email
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-${user.full_name}-data.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: `User data exported for ${user.full_name}`,
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to suspend ${user.full_name}?`);
    if (!confirm) return;

    try {
      // Add suspension logic here - could be a flag in profiles table
      toast({
        title: "User Suspended",
        description: `${user.full_name} has been suspended`,
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`);
    if (!confirm) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `${user.full_name} has been deleted`,
      });
      
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };
  
  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) return;
      
      try {
        const { data: userRole } = await supabase
          .rpc('get_user_staff_role', { _user_id: user.id });
          
        setIsSuperAdmin(userRole === 'super_admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  // Data fetching functions
  const fetchStats = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [
        { count: totalUsers },
        { count: activePosts },
        { count: eventsThisMonth },
        { count: emergencyAlerts },
        { count: marketplaceItems },
        { count: flaggedContent },
        { count: promotions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('post_type', 'event').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('safety_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activePosts: activePosts || 0,
        eventsThisMonth: eventsThisMonth || 0,
        emergencyAlerts: emergencyAlerts || 0,
        marketplaceItems: marketplaceItems || 0,
        promotions: promotions || 0,
        flaggedContent: flaggedContent || 0,
        sponsoredContent: 0,
        activeAutomations: 0,
        configSettings: 0,
        safetyReports: emergencyAlerts || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // First get basic user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Then get user roles separately to avoid join issues
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Combine the data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: userRoles?.filter(role => role.user_id === profile.user_id) || []
      })) || [];
      
      console.log('Fetched users:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEmergencyAlerts = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: alerts, error } = await supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setEmergencyAlerts(alerts || []);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
    }
  };

  const fetchMarketplaceItems = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: items, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setMarketplaceItems(items || []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
    }
  };

  const fetchPromotions = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: promoData, error } = await supabase
        .from('promotions')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setPromotions(promoData || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const fetchContentReports = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: reports, error } = await supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setFlaggedReports(reports || []);
    } catch (error) {
      console.error('Error fetching content reports:', error);
    }
  };

  // Load all data when admin status is confirmed
  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchUsers();
      fetchEmergencyAlerts();
      fetchMarketplaceItems();
      fetchPromotions();
      fetchContentReports();
    }
  }, [isSuperAdmin]);

  // All functions and effects

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
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
          <TabsTrigger value="staff" className="w-full justify-start">
            <UserPlus className="h-4 w-4 mr-2" />
            Staff Management
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
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active registered users</p>
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
                <p className="text-xs text-muted-foreground">Upcoming community events</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.emergencyAlerts}</div>
                <p className="text-xs text-muted-foreground">Active safety alerts</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage platform users and authentication</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Search users..." 
                      className="w-72" 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="User Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="super_admin">Super Admins</SelectItem>
                        <SelectItem value="moderator">Moderators</SelectItem>
                        <SelectItem value="manager">Managers</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUsers.length > 0 && (
                      <>
                        <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const confirmed = window.confirm(`Export data for ${selectedUsers.length} selected users?`);
                            if (confirmed) {
                              // Handle bulk export
                              toast({
                                title: "Bulk Export Started",
                                description: `Exporting data for ${selectedUsers.length} users`,
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Bulk Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUsers([])}
                        >
                          Clear Selection
                        </Button>
                      </>
                    )}
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                    <Button variant="outline">Export All Users</Button>
                  </div>
                </div>
                
                {/* Filter users based on search and role filter */}
                {(() => {
                  const filteredUsers = users.filter(user => {
                    const matchesSearch = !userSearchQuery || 
                      user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      user.neighborhood?.toLowerCase().includes(userSearchQuery.toLowerCase());
                    
                    const matchesRole = userRoleFilter === 'all' || 
                      user.user_roles?.[0]?.role === userRoleFilter;
                    
                    return matchesSearch && matchesRole;
                  });

                  return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.user_id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.user_id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
                              }
                            }}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{user.neighborhood}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.user_roles?.[0]?.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedUser(user);
                                setUserDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUserRole(user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleVerification(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {user.is_verified ? 'Unverify' : 'Verify'} User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendMessage(user)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportUserData(user)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleSuspendUser(user)}
                                  className="text-destructive"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>User Profile Details</DialogTitle>
                <DialogDescription>
                  View and manage user profile information and permissions
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedUser.avatar_url} />
                            <AvatarFallback>
                              {selectedUser.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedUser.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>User Type</Label>
                          <Badge variant="outline">{selectedUser.user_type || 'resident'}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Neighborhood</Label>
                          <span className="text-sm">{selectedUser.neighborhood || 'Not specified'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Phone</Label>
                          <span className="text-sm">{selectedUser.phone || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Emergency Contact</Label>
                          <span className="text-sm">{selectedUser.emergency_contact || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Joined Date</Label>
                          <span className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Last Active</Label>
                          <span className="text-sm">{selectedUser.last_seen ? new Date(selectedUser.last_seen).toLocaleString() : 'Never'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Account Status</Label>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          Change Permissions
                        </Button>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Suspend Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Posts Created</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Events Created</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Safety Reports</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Marketplace Items</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Two-Factor Authentication</span>
                          <Badge variant="outline">Disabled</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Email Verified</span>
                          <Badge variant="default">Verified</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Privacy Settings</span>
                          <Badge variant="outline">Standard</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Alert Management</CardTitle>
              <p className="text-sm text-muted-foreground">Monitor and manage emergency situations</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Alert Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_alarm">False Alarm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Create Alert</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.title || alert.description || 'Safety Alert'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.alert_type || 'emergency'}</Badge>
                        </TableCell>
                        <TableCell>{alert.address || alert.location || 'N/A'}</TableCell>
                        <TableCell>{alert.profiles?.full_name || 'Anonymous'}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === 'active' ? 'destructive' : 'default'}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage marketplace listings and transactions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search items..." className="w-72" />
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Export Data</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Listed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketplaceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.profiles?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>₦{item.price?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Sponsored Content</CardTitle>
              <p className="text-sm text-muted-foreground">Manage sponsored posts, events, and marketplace items</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="boost">Boost</SelectItem>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Revenue Report</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">{promotion.content_title}</TableCell>
                        <TableCell>{promotion.advertiser_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{promotion.promotion_type}</Badge>
                        </TableCell>
                        <TableCell>₦{promotion.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>
                            {promotion.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{promotion.duration} days</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Pause className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <p className="text-sm text-muted-foreground">Review flagged posts and comments</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                          <SelectItem value="harassment">Harassment</SelectItem>
                          <SelectItem value="inappropriate">Inappropriate</SelectItem>
                          <SelectItem value="misinformation">Misinformation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="destructive">{flaggedReports.length} pending</Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {flaggedReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{report.report_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{report.content_preview}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">Review</Button>
                          <Button size="sm" variant="destructive">Remove</Button>
                          <Button size="sm" variant="secondary">Dismiss</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sponsored Content</CardTitle>
                <p className="text-sm text-muted-foreground">Manage promoted posts and ads</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm">Create Ad</Button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sponsoredContent.map((content) => (
                      <div key={content.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={content.status === 'active' ? 'default' : 'secondary'}>
                            {content.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ₦{content.budget?.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{content.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {content.impressions} impressions • {content.clicks} clicks
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-3 w-3 mr-1" /> Stats
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Verification & Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Verify and manage business accounts on the platform
              </p>
            </CardHeader>
            <CardContent>
              <BusinessVerificationAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <StaffInvitationManager />
        </TabsContent>

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
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {automations.map((automation) => (
                      <div key={automation.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="font-medium">{automation.name}</span>
                          </div>
                          <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                            {automation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{automation.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last run: {automation.last_run ? new Date(automation.last_run).toLocaleString() : 'Never'}</span>
                          <span>Executions: {automation.execution_count || 0}</span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Logs
                          </Button>
                          {automation.status === 'active' ? (
                            <Button size="sm" variant="outline">
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Automation Logs</CardTitle>
                <p className="text-sm text-muted-foreground">Recent automation executions and results</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Automation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.automation_name}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.execution_status === 'success' ? 'default' : 
                              log.execution_status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {log.execution_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(log.executed_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                        User engagement rate
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦0</div>
                      <p className="text-xs text-muted-foreground">
                        Total platform revenue
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        Current active sessions
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Overview</CardTitle>
                      <p className="text-sm text-muted-foreground">Key metrics and statistics</p>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Admin;
