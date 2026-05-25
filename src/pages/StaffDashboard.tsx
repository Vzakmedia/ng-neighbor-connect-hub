import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Navigate, useNavigate } from "react-router-dom";
import { Users, Flag, ShoppingCart, Eye, FileText, RefreshCw, TrendingUp, Activity, Zap, Grid } from '@/lib/icons';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StaffDashboard = () => {
  const { user } = useAuth();
  const { role } = useAdminStatus();
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || !role) return;

    const fetchStaffData = async () => {
      try {
        const [
          { count: usersCount },
          { count: newUsersCount },
          { count: flaggedCount },
          { count: marketplaceCount },
          { count: activeMarketplaceCount },
          { count: postsCount }
        ] = await Promise.all([
          supabase.rpc('get_profiles_analytics').then((result: { data: any[] | null }) => ({ count: result.data?.length || 0 })),
          supabase.rpc('get_profiles_analytics').then((result: { data: any[] | null }) => ({ count: result.data?.filter((p: any) => new Date(p.created_at).toISOString().split('T')[0] >= new Date().toISOString().split('T')[0]).length || 0 })),
          supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
          supabase.from('marketplace_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
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

        const { data: usersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, city, state, created_at, is_verified')
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: flaggedData } = await supabase
          .from('content_reports')
          .select(`id, content_type, reason, description, created_at, status, reporter_id, profiles!content_reports_reporter_id_fkey(full_name)`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: marketplaceData } = await supabase
          .from('marketplace_items')
          .select(`id, title, price, status, created_at, category, user_id, profiles!marketplace_items_user_id_fkey(full_name)`)
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: postsData } = await supabase
          .from('community_posts')
          .select(`id, title, content, created_at, post_type, user_id, profiles!community_posts_user_id_fkey(full_name)`)
          .order('created_at', { ascending: false })
          .limit(20);

        setRecentUsers(usersData || []);
        setFlaggedContent(flaggedData || []);
        setMarketplaceItems(marketplaceData || []);
        setCommunityPosts(postsData || []);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast({ title: "Error", description: "Failed to load staff data", variant: "destructive" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchStaffData();

    const staffChannel = supabase.channel('staff-updates');
    staffChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        setRecentUsers(prev => [payload.new, ...prev.slice(0, 9)]);
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_reports' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          setFlaggedContent(prev => [payload.new, ...prev.slice(0, 9)]);
          setStats(prev => ({ ...prev, flaggedContent: prev.flaggedContent + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setFlaggedContent(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
          if (payload.old?.status === 'pending' && payload.new.status !== 'pending') {
            setStats(prev => ({ ...prev, flaggedContent: Math.max(0, prev.flaggedContent - 1) }));
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(staffChannel); };
  }, [user, role, toast]);

  const handleFlagContent = async (contentId: string, contentType: string) => {
    try {
      const { error } = await supabase.from('content_reports').insert({
        content_id: contentId,
        content_type: contentType,
        reason: 'Staff Review',
        description: 'Flagged by staff for review',
        reporter_id: user.id
      });
      if (error) throw error;
      toast({ title: "Success", description: "Content flagged for review" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to flag content", variant: "destructive" });
    }
  };

  if (!user) return <Navigate to="/auth" replace />;

  const statCards = [
    { label: 'Platform Users', value: stats.totalUsers, sub: `+${stats.newUsersToday} today`, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'New Today', value: stats.newUsersToday, sub: 'Registered today', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Flagged Content', value: stats.flaggedContent, sub: 'Pending review', icon: Flag, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Active Listings', value: stats.activeMarketplaceItems, sub: `of ${stats.marketplaceItems} total`, icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Community Posts', value: stats.totalPosts, sub: 'All posts', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: Flag },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen staff-portal-bg">
      {/* Header */}
      <div className="staff-portal-header border-b border-white/5">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">NeighboursNG</p>
              <p className="text-sm font-bold text-white">Staff Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-300 font-medium">Monitoring</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setRefreshing(true); window.location.reload(); }}
              disabled={refreshing}
              className="text-slate-400 hover:text-white hover:bg-white/5 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-xs">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/staff-portal')}
              className="text-slate-400 hover:text-white hover:bg-white/5 gap-1.5"
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Portal Home</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-4 sm:px-6 lg:px-8 gap-1 min-w-max">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-purple-300 border-purple-500 bg-purple-500/5'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'content' && stats.flaggedContent > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                      {stats.flaggedContent}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 relative z-10">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="staff-portal-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-1.5 rounded-lg border ${stat.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {loading ? '—' : stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{stat.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Marketplace Health */}
            <div className="staff-portal-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Marketplace Health</p>
                  <p className="text-xs text-slate-500">Active vs total listings</p>
                </div>
                <span className="text-sm font-bold text-purple-400">
                  {stats.marketplaceItems > 0 ? Math.round((stats.activeMarketplaceItems / stats.marketplaceItems) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-700"
                  style={{ width: `${stats.marketplaceItems > 0 ? (stats.activeMarketplaceItems / stats.marketplaceItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Recent Activity Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="staff-portal-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {u.full_name?.[0] || '?'}
                        </div>
                        <span className="text-sm text-slate-300">{u.full_name || 'Unknown'}</span>
                      </div>
                      <span className="text-xs text-slate-600">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {recentUsers.length === 0 && (
                    <p className="text-sm text-slate-600">No recent users</p>
                  )}
                </div>
              </div>

              <div className="staff-portal-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Content Flags</h3>
                <div className="space-y-3">
                  {flaggedContent.slice(0, 5).map((content) => (
                    <div key={content.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          {content.reason}
                        </span>
                        <span className="text-sm text-slate-400">{content.content_type}</span>
                      </div>
                      <span className="text-xs text-slate-600">{new Date(content.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {flaggedContent.length === 0 && (
                    <p className="text-sm text-slate-600">No flagged content</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="staff-portal-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">User Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monitor user accounts and activity · {recentUsers.length} users shown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Name', 'Email', 'Location', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{u.full_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.email || 'Not provided'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{[u.city, u.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${u.is_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="staff-portal-card rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Flagged Content</h2>
                <p className="text-xs text-slate-500 mt-0.5">{flaggedContent.length} pending reports</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Type', 'Reason', 'Reporter', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedContent.map((content) => (
                      <tr key={content.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs border bg-blue-500/10 text-blue-400 border-blue-500/20">{content.content_type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{content.reason}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{content.profiles?.full_name || 'Anonymous'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${content.status === 'pending' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{content.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(content.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {flaggedContent.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600 text-sm">No flagged content pending</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="staff-portal-card rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Recent Community Posts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Title', 'Author', 'Type', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {communityPosts.slice(0, 10).map((post) => (
                      <tr key={post.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{post.title || post.content?.substring(0, 50) + '...' || 'Untitled'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{post.profiles?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs border bg-purple-500/10 text-purple-400 border-purple-500/20">{post.post_type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(post.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleFlagContent(post.id, 'community_post')}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                            title="Flag for review"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="staff-portal-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Marketplace Monitoring</h2>
              <p className="text-xs text-slate-500 mt-0.5">{marketplaceItems.length} recent items</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Title', 'Seller', 'Price', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marketplaceItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-200 max-w-[140px] truncate">{item.title}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{item.profiles?.full_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">₦{(item.price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs border bg-blue-500/10 text-blue-400 border-blue-500/20">{item.category || 'Uncategorized'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleFlagContent(item.id, 'marketplace_item')}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {marketplaceItems.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 text-sm">No marketplace items</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;