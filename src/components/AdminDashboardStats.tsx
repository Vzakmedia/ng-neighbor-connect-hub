import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Shield, TrendingUp, AlertTriangle, DollarSign, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  total_users?: number;
  active_users_today?: number;
  total_posts?: number;
  posts_today?: number;
  pending_reports?: number;
  total_revenue?: number;
  active_emergencies?: number;
  staff_count?: number;
}

interface SystemHealth {
  database_status?: string;
  realtime_connections?: number;
  avg_response_time?: number;
  storage_usage_mb?: number;
  error_rate?: number;
}

export const AdminDashboardStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      
      // Mock data for now - replace with actual RPC calls once functions are available
      const userStats = {
        total_users: 1250,
        active_users_today: 342,
        total_posts: 5670,
        posts_today: 89,
        pending_reports: 12,
        staff_count: 8
      };

      const healthData = {
        database_status: 'healthy',
        realtime_connections: 45,
        avg_response_time: 120,
        storage_usage_mb: 2048,
        error_rate: 0.5
      };

      const revenueData = { total_revenue: 145000 };
      const emergencyData = { active_emergencies: 2 };

      // Combine all stats
      if (userStats && healthData) {
        setStats({
          total_users: userStats.total_users || 0,
          active_users_today: userStats.active_users_today || 0,
          total_posts: userStats.total_posts || 0,
          posts_today: userStats.posts_today || 0,
          pending_reports: userStats.pending_reports || 0,
          total_revenue: revenueData?.total_revenue || 0,
          active_emergencies: emergencyData?.active_emergencies || 0,
          staff_count: userStats.staff_count || 0
        });

        setSystemHealth({
          database_status: healthData.database_status || 'healthy',
          realtime_connections: healthData.realtime_connections || 0,
          avg_response_time: healthData.avg_response_time || 0,
          storage_usage_mb: healthData.storage_usage_mb || 0,
          error_rate: healthData.error_rate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || !systemHealth) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load dashboard statistics</p>
          <Button onClick={fetchStats} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.total_users.toLocaleString(),
      description: `${stats.active_users_today} active today`,
      icon: Users,
      trend: "up"
    },
    {
      title: "Content Posts", 
      value: stats.total_posts.toLocaleString(),
      description: `${stats.posts_today} posted today`,
      icon: MessageSquare,
      trend: "up"
    },
    {
      title: "Safety Reports",
      value: stats.pending_reports.toString(),
      description: "Pending review",
      icon: Shield,
      trend: stats.pending_reports > 0 ? "warning" : "stable"
    },
    {
      title: "Revenue",
      value: `₦${stats.total_revenue.toLocaleString()}`,
      description: "Total earnings",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Emergency Alerts",
      value: stats.active_emergencies.toString(),
      description: "Currently active",
      icon: AlertTriangle,
      trend: stats.active_emergencies > 0 ? "critical" : "stable"
    },
    {
      title: "Staff Members",
      value: stats.staff_count.toString(),
      description: "Active staff",
      icon: Users,
      trend: "stable"
    },
    {
      title: "System Health",
      value: systemHealth.database_status,
      description: `${systemHealth.avg_response_time}ms avg response`,
      icon: Activity,
      trend: systemHealth.database_status === "healthy" ? "up" : "warning"
    },
    {
      title: "Storage Usage",
      value: `${(systemHealth.storage_usage_mb / 1024).toFixed(1)}GB`,
      description: `${systemHealth.realtime_connections} active connections`,
      icon: TrendingUp,
      trend: "stable"
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "critical": return "text-red-600";
      case "warning": return "text-yellow-600";
      default: return "text-muted-foreground";
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "warning": return <Badge variant="secondary">Warning</Badge>;
      case "up": return <Badge variant="default">Active</Badge>;
      default: return <Badge variant="outline">Stable</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <Button 
          onClick={fetchStats} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {getTrendBadge(stat.trend)}
                </div>
                <p className={`text-xs ${getTrendColor(stat.trend)}`}>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {systemHealth.error_rate > 5 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              High Error Rate Detected
            </CardTitle>
            <CardDescription className="text-red-700">
              System error rate is at {systemHealth.error_rate.toFixed(1)}%. Please investigate.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};