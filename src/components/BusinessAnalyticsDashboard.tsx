import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
          .maybeSingle();

        if (businessError || !business) {
          throw new Error('No business found for this user');
        }

        // WR-02: Query services by business_id, not user_id
        const { data: _services, error: servicesError } = await supabase
          .from('services')
          .select('id, title, rating, total_reviews')
          .eq('business_id', business.id as any);

        if (servicesError) throw servicesError;

        // CR-04: Real analytics coming soon — show placeholder data without hardcoded mock values
        const realAnalytics: BusinessAnalytics = {
          total_bookings: 0,
          total_revenue: 0,
          average_rating: 0,
          total_reviews: 0,
          weekly_bookings: [],
          service_performance: []
        };

        setAnalytics(realAnalytics);
      } catch (error) {
        // WR-03: Only log in development
        if (import.meta.env.DEV) {
          console.error('Error fetching analytics:', error);
        }
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
      {/* CR-04: Analytics placeholder — real data coming soon */}
      <div className="text-center py-8 text-muted-foreground">Analytics data coming soon</div>
    </div>
  );
};

export default BusinessAnalyticsDashboard;