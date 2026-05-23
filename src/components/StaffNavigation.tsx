import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Activity,
  ChevronRight,
  Lock,
  Zap,
} from "@/lib/icons";
import { useNavigate } from "react-router-dom";

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
    totalPosts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["super_admin", "moderator", "manager", "support", "staff"])
          .single();
        setUserRole(data?.role || null);
      } catch (error) {
        console.error("Error checking user role:", error);
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
          { count: postsCount },
        ] = await Promise.all([
          supabase.rpc("get_profiles_analytics").then((result) => ({
            count: result.data?.length || 0,
          })),
          supabase.rpc("get_profiles_analytics").then((result) => ({
            count:
              result.data?.filter(
                (p) =>
                  new Date(p.created_at).toISOString().split("T")[0] >=
                  new Date().toISOString().split("T")[0]
              ).length || 0,
          })),
          supabase
            .from("content_reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase.from("marketplace_items").select("*", { count: "exact", head: true }),
          supabase
            .from("marketplace_items")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("community_posts").select("*", { count: "exact", head: true }),
        ]);
        setStats({
          totalUsers: usersCount || 0,
          newUsersToday: newUsersCount || 0,
          flaggedContent: flaggedCount || 0,
          marketplaceItems: marketplaceCount || 0,
          activeMarketplaceItems: activeMarketplaceCount || 0,
          totalPosts: postsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [userRole]);

  if (loading) {
    return (
      <div className="min-h-screen staff-portal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading staff portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className="min-h-screen staff-portal-bg flex items-center justify-center p-4">
        <div className="staff-portal-card rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm">You don't have staff access to this system.</p>
          <Button
            onClick={() => navigate("/")}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Return to App
          </Button>
        </div>
      </div>
    );
  }

  const dashboards = [
    {
      id: "super_admin",
      title: "Super Admin",
      description: "Full platform control, system management, and unrestricted access to all data",
      icon: Settings,
      route: "/admin",
      gradient: "from-red-600 to-rose-700",
      glow: "shadow-red-500/20",
      iconBg: "bg-red-500/10 border-red-500/20",
      iconColor: "text-red-400",
      badgeColor: "bg-red-500/10 text-red-300 border-red-500/20",
      roles: ["super_admin"],
      level: "High Security",
      levelIcon: Lock,
    },
    {
      id: "moderator",
      title: "Moderator",
      description: "Content moderation, community safety, and flagged content review",
      icon: Shield,
      route: "/moderator",
      gradient: "from-blue-600 to-indigo-700",
      glow: "shadow-blue-500/20",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-400",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      roles: ["moderator", "super_admin"],
      level: "Security",
      levelIcon: Shield,
    },
    {
      id: "manager",
      title: "Manager",
      description: "Business operations, analytics, and platform performance management",
      icon: Building,
      route: "/manager",
      gradient: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-500/20",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      iconColor: "text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      roles: ["manager", "super_admin"],
      level: "Operations",
      levelIcon: BarChart3,
    },
    {
      id: "support",
      title: "Support",
      description: "User assistance, emergency response, and help desk operations",
      icon: HeadphonesIcon,
      route: "/support",
      gradient: "from-amber-600 to-orange-700",
      glow: "shadow-amber-500/20",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      iconColor: "text-amber-400",
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      roles: ["support", "super_admin"],
      level: "Assistance",
      levelIcon: HeadphonesIcon,
    },
    {
      id: "staff",
      title: "Staff",
      description: "Basic platform monitoring, user oversight, and marketplace review",
      icon: Users,
      route: "/staff-dashboard",
      gradient: "from-purple-600 to-violet-700",
      glow: "shadow-purple-500/20",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      iconColor: "text-purple-400",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
      roles: ["staff", "super_admin"],
      level: "Monitoring",
      levelIcon: Activity,
    },
  ];

  const accessibleDashboards = dashboards.filter((dashboard) =>
    dashboard.roles.includes(userRole)
  );

  const roleDisplayMap: Record<string, { label: string; color: string }> = {
    super_admin: { label: "Super Admin", color: "text-red-400" },
    moderator: { label: "Moderator", color: "text-blue-400" },
    manager: { label: "Manager", color: "text-emerald-400" },
    support: { label: "Support Agent", color: "text-amber-400" },
    staff: { label: "Staff Member", color: "text-purple-400" },
  };
  const roleDisplay = roleDisplayMap[userRole] || { label: userRole, color: "text-slate-400" };

  const statItems = [
    {
      label: "Platform Users",
      value: statsLoading ? "—" : stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: `+${stats.newUsersToday} today`,
    },
    {
      label: "Flagged Content",
      value: statsLoading ? "—" : stats.flaggedContent.toLocaleString(),
      icon: Flag,
      color: "text-red-400",
      bg: "bg-red-500/10",
      sub: "Pending review",
    },
    {
      label: "Active Listings",
      value: statsLoading ? "—" : stats.activeMarketplaceItems.toLocaleString(),
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      sub: `of ${stats.marketplaceItems} total`,
    },
    {
      label: "Community Posts",
      value: statsLoading ? "—" : stats.totalPosts.toLocaleString(),
      icon: FileText,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      sub: "All time",
    },
  ];

  return (
    <div className="min-h-screen staff-portal-bg">
      {/* Top Header Bar */}
      <div className="staff-portal-header border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">NeighboursNG</p>
              <p className="text-sm font-semibold text-white">Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">Live</span>
            </div>
            <div className={`text-sm font-semibold ${roleDisplay.color}`}>
              {roleDisplay.label}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white hover:bg-white/5 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit Portal</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back, {user.email?.split("@")[0]}
          </h1>
          <p className="text-slate-400">
            You have access to{" "}
            <span className={`font-semibold ${roleDisplay.color}`}>
              {accessibleDashboards.length} portal{accessibleDashboards.length !== 1 ? "s" : ""}
            </span>{" "}
            · All actions are logged and monitored
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statItems.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="staff-portal-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                    {stat.label}
                  </p>
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Dashboard Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-1">Your Portals</h2>
          <p className="text-sm text-slate-500">Select a portal to access your management tools</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleDashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            const LevelIcon = dashboard.levelIcon;
            return (
              <button
                key={dashboard.id}
                onClick={() => navigate(dashboard.route)}
                className={`staff-portal-card rounded-2xl p-6 text-left group hover:scale-[1.02] transition-all duration-200 hover:shadow-xl ${dashboard.glow} cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl border ${dashboard.iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${dashboard.iconColor}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${dashboard.badgeColor}`}
                  >
                    <LevelIcon className="h-3 w-3" />
                    {dashboard.level}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                  {dashboard.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {dashboard.description}
                </p>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  <span>Open Portal</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            <span className="text-amber-300 font-medium">Security Notice:</span> All staff actions
            are logged and monitored for security compliance. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffNavigation;