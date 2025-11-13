import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowTrendingUpIcon, UsersIcon, CurrencyDollarIcon, StarIcon } from '@heroicons/react/24/outline';

interface BusinessAnalytics {
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
  weekly_bookings: Array<{ date: string; bookings: number; revenue: number }>;
  service_performance: Array<{ service_name: string; bookings: number; revenue: number }>;
}

const BusinessAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get user's business
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id as any)
          .single();

        if (businessError || !business) {
          throw new Error('No business found for this user');
        }

        // Get services for this business
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id, title, rating, total_reviews')
          .eq('user_id', user.id as any);

        if (servicesError) throw servicesError;

        // Mock analytics data for now - in real implementation, you'd fetch from bookings/transactions tables
        const mockAnalytics: BusinessAnalytics = {
          total_bookings: 156,
          total_revenue: 12450.00,
          average_rating: 4.8,
          total_reviews: 89,
          weekly_bookings: [
            { date: '2024-01-01', bookings: 12, revenue: 980 },
            { date: '2024-01-08', bookings: 18, revenue: 1200 },
            { date: '2024-01-15', bookings: 15, revenue: 1100 },
            { date: '2024-01-22', bookings: 22, revenue: 1650 },
            { date: '2024-01-29', bookings: 19, revenue: 1450 },
            { date: '2024-02-05', bookings: 25, revenue: 1890 },
            { date: '2024-02-12', bookings: 21, revenue: 1520 },
          ],
          service_performance: (services || []).map((service: any) => ({
            service_name: service?.title || 'Unknown Service',
            bookings: Math.floor(Math.random() * 50) + 10,
            revenue: Math.floor(Math.random() * 2000) + 500,
          }))
        };

        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load business analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No analytics data available. Start by registering your business.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_bookings}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_rating}</div>
            <p className="text-xs text-muted-foreground">{analytics.total_reviews} reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">Month over month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings Trend</TabsTrigger>
          <TabsTrigger value="services">Service Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Bookings & Revenue</CardTitle>
              <CardDescription>Your booking performance over the last 7 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.weekly_bookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Revenue and bookings by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.service_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessAnalyticsDashboard;