import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, AlertTriangle, TrendingUp, ShoppingCart, Calendar, Activity, CheckCircle } from '@/lib/icons';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';

export const OverviewTab = () => {
    const { stats, systemHealth, loading } = useAdminStats();

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            description: `${stats.dailyActiveUsers} active today`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Active Posts',
            value: stats.activePosts.toLocaleString(),
            icon: MessageSquare,
            description: `${stats.postsPerDay} posts/day`,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Emergency Alerts',
            value: stats.emergencyAlerts.toLocaleString(),
            icon: AlertTriangle,
            description: `${stats.resolvedToday} resolved today`,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Marketplace Items',
            value: stats.marketplaceItems.toLocaleString(),
            icon: ShoppingCart,
            description: 'Active listings',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Events This Month',
            value: stats.eventsThisMonth.toLocaleString(),
            icon: Calendar,
            description: 'Community events',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Flagged Content',
            value: stats.flaggedContent.toLocaleString(),
            icon: AlertTriangle,
            description: `${stats.autoFlagged} auto-flagged`,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Active Automations',
            value: stats.activeAutomations.toLocaleString(),
            icon: Activity,
            description: 'Running workflows',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
        {
            title: 'User Satisfaction',
            value: `${stats.userSatisfaction}%`,
            icon: TrendingUp,
            description: 'Overall rating',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Real-time system status and performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium">Database</p>
                                <p className="text-xs text-muted-foreground">PostgreSQL</p>
                            </div>
                            <Badge variant={systemHealth.database === 'healthy' ? 'default' : 'destructive'}>
                                {systemHealth.database}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium">Realtime</p>
                                <p className="text-xs text-muted-foreground">Supabase Realtime</p>
                            </div>
                            <Badge variant={systemHealth.realtime === 'active' ? 'default' : 'destructive'}>
                                {systemHealth.realtime}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium">Emergency System</p>
                                <p className="text-xs text-muted-foreground">Alert Processing</p>
                            </div>
                            <Badge variant={systemHealth.emergency === 'operational' ? 'default' : 'destructive'}>
                                {systemHealth.emergency}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Storage Usage</p>
                                <span className="text-sm font-bold">{systemHealth.storage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${systemHealth.storage}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">API Response Time</p>
                                <span className="text-sm font-bold">{systemHealth.apiResponse}ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-muted-foreground">Optimal performance</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
