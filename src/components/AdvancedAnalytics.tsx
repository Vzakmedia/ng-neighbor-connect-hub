import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  DollarSign, 
  Clock, 
  BarChart3,
  Download,
  Filter,
  Calendar,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Zap,
  Monitor,
  AlertCircle
} from 'lucide-react';

interface AnalyticsSummary {
  total_users: number;
  new_users: number;
  active_users: number;
  total_posts: number;
  total_engagement: number;
  total_revenue: number;
  avg_session_time: number;
}

interface TopContent {
  content_id: string;
  content_type: string;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  engagement_score: number;
}

interface RevenueData {
  date: string;
  revenue_source: string;
  amount: number;
  transaction_count: number;
  net_revenue: number;
}

interface SystemMetric {
  metric_type: string;
  metric_value: number;
  metric_unit: string;
  timestamp: string;
}

export const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
    fetchTopContent();
    fetchRevenueData();
    fetchSystemMetrics();
  }, [dateRange, contentTypeFilter]);

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      if (error) throw error;
      setAnalyticsData(data[0] || null);
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      toast.error('Failed to load analytics summary');
    }
  };

  const fetchTopContent = async () => {
    try {
      const { data, error } = await supabase.rpc('get_top_content_by_engagement', {
        content_type_filter: contentTypeFilter === 'all' ? null : contentTypeFilter,
        start_date: dateRange.start,
        end_date: dateRange.end,
        limit_count: 10
      });

      if (error) throw error;
      setTopContent(data || []);
    } catch (error) {
      console.error('Error fetching top content:', error);
      toast.error('Failed to load top content');
    }
  };

  const fetchRevenueData = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_analytics')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) throw error;
      setRevenueData(data || []);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('system_performance')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSystemMetrics(data || []);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert([{
          report_name: `${reportType}_report_${Date.now()}`,
          report_type: reportType,
          report_config: {
            date_range: dateRange,
            content_filter: contentTypeFilter
          },
          generated_by: user?.id,
          date_range_start: dateRange.start,
          date_range_end: dateRange.end
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Report generation started. You will be notified when ready.');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'response_time': return <Clock className="h-4 w-4" />;
      case 'cpu_usage': return <Monitor className="h-4 w-4" />;
      case 'memory_usage': return <Zap className="h-4 w-4" />;
      case 'active_connections': return <Users className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricColor = (metricType: string, value: number) => {
    switch (metricType) {
      case 'response_time':
        return value > 500 ? 'text-red-500' : value > 200 ? 'text-yellow-500' : 'text-green-500';
      case 'cpu_usage':
      case 'memory_usage':
        return value > 80 ? 'text-red-500' : value > 60 ? 'text-yellow-500' : 'text-green-500';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics & Reporting</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateReport('user_analytics')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="community_post">Community Posts</SelectItem>
                  <SelectItem value="marketplace_item">Marketplace Items</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData?.new_users || 0} new users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.active_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.total_users ? 
                    ((analyticsData.active_users / analyticsData.total_users) * 100).toFixed(1) 
                    : 0}% engagement rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.total_posts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.total_engagement || 0} total interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{analyticsData?.total_revenue?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg session: {analyticsData?.avg_session_time?.toFixed(1) || 0}min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Content with highest engagement scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Engagement Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topContent.map((content, index) => (
                    <TableRow key={content.content_id}>
                      <TableCell>
                        <Badge variant="outline">{content.content_type}</Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {content.total_views}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {content.total_likes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {content.total_shares}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {content.total_comments}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={index < 3 ? "bg-green-500" : "bg-gray-500"}>
                          {content.engagement_score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Revenue breakdown by source and date</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Net Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.map((revenue) => (
                    <TableRow key={`${revenue.date}-${revenue.revenue_source}`}>
                      <TableCell>{new Date(revenue.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{revenue.revenue_source}</Badge>
                      </TableCell>
                      <TableCell>₦{revenue.amount.toFixed(2)}</TableCell>
                      <TableCell>{revenue.transaction_count}</TableCell>
                      <TableCell className="font-semibold">
                        ₦{revenue.net_revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              systemMetrics.reduce((acc, metric) => {
                if (!acc[metric.metric_type]) {
                  acc[metric.metric_type] = metric;
                }
                return acc;
              }, {} as Record<string, SystemMetric>)
            ).map(([type, metric]) => (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {type.replace('_', ' ')}
                  </CardTitle>
                  {getMetricIcon(type)}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMetricColor(type, metric.metric_value)}`}>
                    {metric.metric_value}
                    <span className="text-sm font-normal ml-1">{metric.metric_unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(metric.timestamp).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                System Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemMetrics.slice(0, 5).map((metric) => (
                  <div key={metric.metric_type} className="flex justify-between items-center p-2 border rounded">
                    <span className="capitalize">{metric.metric_type.replace('_', ' ')}</span>
                    <Badge className={getMetricColor(metric.metric_type, metric.metric_value).includes('red') ? 'bg-red-500' : 
                                     getMetricColor(metric.metric_type, metric.metric_value).includes('yellow') ? 'bg-yellow-500' : 'bg-green-500'}>
                      {metric.metric_value} {metric.metric_unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};