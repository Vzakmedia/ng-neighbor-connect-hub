import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Building, 
  HeadphonesIcon, 
  Users, 
  FileText,
  AlertCircle,
  Settings,
  BarChart3,
  ArrowLeft,
  Flag,
  ShoppingCart,
  TrendingUp,
  Activity
} from "@/lib/icons";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const StaffNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    flaggedContent: 0,
    marketplaceItems: 0,
    activeMarketplaceItems: 0,
    totalPosts: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'moderator', 'manager', 'support', 'staff'])
          .single();
        
        setUserRole(data?.role || null);
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (!userRole) return;

    const fetchStats = async () => {
      try {
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
          totalPosts: postsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have staff access to this system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboards = [
    {
      id: 'super_admin',
      title: 'Super Admin',
      description: 'Full platform control and system management',
      icon: Settings,
      route: '/admin',
      color: 'red',
      roles: ['super_admin'],
      level: 'High Security'
    },
    {
      id: 'moderator',
      title: 'Moderator',
      description: 'Content moderation and community safety',
      icon: Shield,
      route: '/moderator',
      color: 'blue',
      roles: ['moderator', 'super_admin'],
      level: 'Security'
    },
    {
      id: 'manager',
      title: 'Manager', 
      description: 'Business operations and platform management',
      icon: Building,
      route: '/manager',
      color: 'green',
      roles: ['manager', 'super_admin'],
      level: 'Operations'
    },
    {
      id: 'support',
      title: 'Support',
      description: 'User assistance and emergency response',
      icon: HeadphonesIcon,
      route: '/support',
      color: 'orange',
      roles: ['support', 'super_admin'],
      level: 'Assistance'
    },
    {
      id: 'staff',
      title: 'Staff',
      description: 'Basic monitoring and platform oversight',
      icon: Users,
      route: '/staff',
      color: 'purple',
      roles: ['staff', 'super_admin'],
      level: 'Monitoring'
    }
  ];

  const accessibleDashboards = dashboards.filter(dashboard => 
    dashboard.roles.includes(userRole)
  );

  const getRoleDisplay = (role: string) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', color: 'destructive' },
      moderator: { label: 'Moderator', color: 'default' },
      manager: { label: 'Manager', color: 'secondary' },
      support: { label: 'Support', color: 'outline' },
      staff: { label: 'Staff', color: 'outline' }
    };
    return roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'outline' };
  };

  const roleDisplay = getRoleDisplay(userRole);

  return (
    <div className="container mx-auto px-4 py-8 bg-background text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Dashboard Portal</h1>
            <p className="text-muted-foreground">Access your role-specific management tools</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/landing')}
              className="flex items-center gap-2 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Main Site
            </Button>
            <Badge variant={roleDisplay.color as any} className="text-sm">
              {roleDisplay.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">
            Real-time updates enabled • {accessibleDashboards.length} dashboard{accessibleDashboards.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accessibleDashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          const iconColorClass = 
            dashboard.color === 'red' ? 'text-red-600 dark:text-red-400' :
            dashboard.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            dashboard.color === 'green' ? 'text-green-600 dark:text-green-400' :
            dashboard.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
            dashboard.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
            'text-foreground';
          
          const iconBgClass = 
            dashboard.color === 'red' ? 'bg-red-100 dark:bg-red-950/30' :
            dashboard.color === 'blue' ? 'bg-blue-100 dark:bg-blue-950/30' :
            dashboard.color === 'green' ? 'bg-green-100 dark:bg-green-950/30' :
            dashboard.color === 'orange' ? 'bg-orange-100 dark:bg-orange-950/30' :
            dashboard.color === 'purple' ? 'bg-purple-100 dark:bg-purple-950/30' :
            'bg-muted';

          return (
            <Card 
              key={dashboard.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-card border-border"
              onClick={() => navigate(dashboard.route)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${iconBgClass}`}>
                    <Icon className={`h-6 w-6 ${iconColorClass}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboard.level}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl text-card-foreground">{dashboard.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{dashboard.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Access Analytics */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Stats Overview
            </CardTitle>
            <CardDescription>
              Real-time platform statistics across all accessible areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Total registered</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats.newUsersToday}</div>
                  <p className="text-xs text-muted-foreground">Registered today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{statsLoading ? '...' : stats.flaggedContent}</div>
                  <p className="text-xs text-muted-foreground">Pending review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats.activeMarketplaceItems}</div>
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
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Total posts</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <div className="mt-6">
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800 dark:text-orange-200">
                All staff actions are logged and monitored for security compliance
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffNavigation;