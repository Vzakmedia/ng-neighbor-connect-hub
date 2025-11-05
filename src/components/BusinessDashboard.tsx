import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  BarChart3, 
  Users, 
  ShoppingBag, 
  Calendar,
  Edit,
  Upload,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock3
} from 'lucide-react';
import BusinessPromotionDialog from './BusinessPromotionDialog';
import { formatTimeAgo } from '@/lib/utils';
import BusinessAnalyticsDashboard from '@/components/BusinessAnalyticsDashboard';

interface Business {
  id: string;
  business_name: string;
  description: string;
  category: string;
  phone: string | null;
  email: string | null;
  physical_address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  operating_hours: any;
  is_verified: boolean;
  verification_status: string;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  updated_at: string;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id as any)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // @ts-ignore - Supabase typing issue
      if (data && typeof data === 'object' && !('error' in data)) {
        setBusiness(data as Business);
      } else {
        setBusiness(null);
      }
    } catch (error) {
      console.error('Error fetching business:', error);
      toast({
        title: "Error",
        description: "Failed to load business information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Under Review';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No ratings yet</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  useEffect(() => {
    fetchBusiness();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No Business Registered</CardTitle>
          <p className="text-muted-foreground mb-4">
            You haven't registered a business yet. Register your business to access the business dashboard.
          </p>
          <Button>Register Your Business</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={business.logo_url} />
                <AvatarFallback className="text-lg">
                  {business.business_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{business.business_name}</CardTitle>
                  <Badge className={`${getStatusColor(business.verification_status)} text-white`}>
                    {getStatusText(business.verification_status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {formatCategory(business.category)}
                  </span>
                  {business.city && business.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {business.city}, {business.state}
                    </span>
                  )}
                </div>
                {renderStars(business.rating)}
              </div>
            </div>
            {/* Desktop buttons */}
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              {business.verification_status === 'verified' && (
                <BusinessPromotionDialog business={business} onPromotionCreated={fetchBusiness}>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Promote
                  </Button>
                </BusinessPromotionDialog>
              )}
            </div>
            
            {/* Mobile buttons - icon only */}
            <div className="md:hidden flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              {business.verification_status === 'verified' && (
                <BusinessPromotionDialog business={business} onPromotionCreated={fetchBusiness}>
                  <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </BusinessPromotionDialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Verification Status Alert */}
      {business.verification_status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Clock3 className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Verification in Progress</h4>
                <p className="text-yellow-700 text-sm">
                  Your business registration is under review. This typically takes 1-3 business days.
                  You'll receive a notification once the review is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {business.verification_status === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Verification Rejected</h4>
                <p className="text-red-700 text-sm">
                  Your business registration was rejected. Please review the requirements and submit again.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Resubmit Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Clicks</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Phone className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                    <p className="text-2xl font-bold">{business.total_reviews || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold">{business.rating?.toFixed(1) || 'N/A'}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions with your business profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>No activity yet</p>
                <p className="text-sm">Activity will appear here once customers start engaging with your business</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your business profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Business Name</p>
                  <p className="text-muted-foreground">{business.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-muted-foreground">{formatCategory(business.category)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-muted-foreground">{business.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">{business.email || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-muted-foreground">{business.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-muted-foreground">{business.physical_address}</p>
              </div>
              <Button>Edit Business Information</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <BusinessAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Advertising</CardTitle>
              <CardDescription>Boost your business visibility with targeted promotions</CardDescription>
            </CardHeader>
            <CardContent>
              {business.verification_status === 'verified' ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Promote Your Business?</h3>
                    <p className="text-muted-foreground mb-4">
                      Reach more customers in your community with targeted promotions
                    </p>
                    <BusinessPromotionDialog business={business} onPromotionCreated={fetchBusiness}>
                      <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Create Promotion Campaign
                      </Button>
                    </BusinessPromotionDialog>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                  <p>Promotions Available After Verification</p>
                  <p className="text-sm">Create targeted ads and promotions once your business is verified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Manage your business preferences and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Registration Date</p>
                <p className="text-muted-foreground">{formatTimeAgo(business.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Last Updated</p>
                <p className="text-muted-foreground">{formatTimeAgo(business.updated_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Business ID</p>
                <p className="text-muted-foreground font-mono text-xs">{business.id}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessDashboard;