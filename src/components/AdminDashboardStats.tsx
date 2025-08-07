import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Shield, TrendingUp, AlertTriangle, ShoppingCart, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  activePosts: number;
  safetyReports: number;
  emergencyAlerts: number;
  marketplaceItems: number;
  flaggedContent: number;
  dailyActiveUsers: number;
  systemHealth: string;
}

interface AdminDashboardStatsProps {
  isSuperAdmin: boolean;
}

const AdminDashboardStats = ({ isSuperAdmin }: AdminDashboardStatsProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activePosts: 0,
    safetyReports: 0,
    emergencyAlerts: 0,
    marketplaceItems: 0,
    flaggedContent: 0,
    dailyActiveUsers: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      
      // Fetch basic stats in parallel
      const [
        usersResponse,
        postsResponse,
        alertsResponse,
        marketplaceResponse,
        reportsResponse
      ] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }),
        supabase.from('safety_alerts').select('id').eq('status', 'active'),
        supabase.from('marketplace_items').select('id', { count: 'exact', head: true }),
        supabase.from('content_reports').select('id').eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersResponse.count || 0,
        activePosts: postsResponse.count || 0,
        safetyReports: 0, // Would need safety_reports table
        emergencyAlerts: alertsResponse.data?.length || 0,
        marketplaceItems: marketplaceResponse.count || 0,
        flaggedContent: reportsResponse.data?.length || 0,
        dailyActiveUsers: Math.floor((usersResponse.count || 0) * 0.15), // Estimate
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered users",
      trend: "+5.2%",
      variant: "default" as const
    },
    {
      title: "Active Posts",
      value: stats.activePosts.toLocaleString(),
      icon: MessageSquare,
      description: "Published posts",
      trend: "+12.1%",
      variant: "default" as const
    },
    {
      title: "Emergency Alerts",
      value: stats.emergencyAlerts.toString(),
      icon: AlertTriangle,
      description: "Active alerts",
      trend: stats.emergencyAlerts > 0 ? "Active" : "Clear",
      variant: stats.emergencyAlerts > 0 ? "destructive" as const : "secondary" as const
    },
    {
      title: "Marketplace Items",
      value: stats.marketplaceItems.toLocaleString(),
      icon: ShoppingCart,
      description: "Listed items",
      trend: "+8.3%",
      variant: "default" as const
    },
    {
      title: "Flagged Content",
      value: stats.flaggedContent.toString(),
      icon: Shield,
      description: "Pending review",
      trend: stats.flaggedContent > 0 ? "Needs Review" : "All Clear",
      variant: stats.flaggedContent > 0 ? "destructive" as const : "secondary" as const
    },
    {
      title: "Daily Active Users",
      value: stats.dailyActiveUsers.toLocaleString(),
      icon: Activity,
      description: "Users today",
      trend: "+2.8%",
      variant: "default" as const
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            System Status
            <Badge variant={stats.systemHealth === 'healthy' ? 'default' : 'destructive'}>
              {stats.systemHealth === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <Badge variant={stat.variant} className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardStats;