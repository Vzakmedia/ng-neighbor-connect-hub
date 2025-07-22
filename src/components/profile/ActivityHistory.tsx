import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  ShoppingBag, 
  Users, 
  Shield, 
  Star, 
  Clock,
  Eye
} from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
}

interface Service {
  id: string;
  title: string;
  category: string;
  price_min: number;
  price_max: number;
  is_active: boolean;
  created_at: string;
}

interface SafetyAlert {
  id: string;
  title: string;
  alert_type: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

const ActivityHistory = () => {
  const { user } = useAuth();
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    try {
      const [marketplaceRes, servicesRes, alertsRes, reviewsRes] = await Promise.all([
        supabase
          .from('marketplace_items')
          .select('id, title, category, price, status, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('services')
          .select('id, title, category, price_min, price_max, is_active, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('safety_alerts')
          .select('id, title, alert_type, severity, status, created_at')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at')
          .eq('reviewer_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (marketplaceRes.data) setMarketplaceItems(marketplaceRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (alertsRes.data) setSafetyAlerts(alertsRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'sold':
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="marketplace" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Marketplace ({marketplaceItems.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety ({safetyAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4">
            {marketplaceItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No marketplace items yet</p>
                <Button variant="outline" className="mt-2">Create Your First Listing</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {marketplaceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{item.category}</span>
                        <span>₦{item.price?.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(item.created_at)}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No services offered yet</p>
                <Button variant="outline" className="mt-2">Create Your First Service</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{service.title}</h4>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{service.category}</span>
                        <span>₦{service.price_min?.toLocaleString()} - ₦{service.price_max?.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(service.created_at)}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            {safetyAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No safety alerts reported</p>
                <Button variant="outline" className="mt-2">Report Safety Issue</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {safetyAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={getStatusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{alert.alert_type}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(alert.created_at)}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews written yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeSince(review.created_at)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ActivityHistory;