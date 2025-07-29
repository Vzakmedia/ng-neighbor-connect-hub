import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Phone, Mail, Clock, Building, Search, ShieldCheck, Plus } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

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
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const businessCategories = [
  'all',
  'restaurant_food',
  'retail_shopping',
  'health_wellness',
  'automotive',
  'home_services',
  'professional_services',
  'technology',
  'beauty_personal_care',
  'education_training',
  'entertainment',
  'sports_fitness',
  'real_estate',
  'financial_services',
  'other'
];

const BusinessListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const fetchBusinesses = async () => {
    try {
      const { data: businessData, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('verification_status', 'verified')
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately for each business
      const businessesWithProfiles = await Promise.all(
        (businessData || []).map(async (business: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', business.user_id)
            .single();

          return {
            ...business,
            profiles: profile || { full_name: 'Business Owner', avatar_url: '' }
          };
        })
      );

      // Apply client-side filtering
      let filteredBusinesses = businessesWithProfiles;

      if (selectedCategory !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => b.category === selectedCategory);
      }

      if (selectedLocation !== 'all') {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.city?.toLowerCase().includes(selectedLocation.toLowerCase())
        );
      }

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.business_name?.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower)
        );
      }

      setBusinesses(filteredBusinesses as Business[]);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBusinessInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No ratings</span>;
    
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
    fetchBusinesses();
  }, [searchTerm, selectedCategory, selectedLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {businessCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Lagos">Lagos</SelectItem>
              <SelectItem value="Abuja">Abuja</SelectItem>
              <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
              <SelectItem value="Kano">Kano</SelectItem>
              <SelectItem value="Ibadan">Ibadan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Register Business CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Own a business?</h3>
                <p className="text-muted-foreground">Register your business and reach more customers in your community</p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Register Business
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Listings */}
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' 
                ? 'No businesses found matching your criteria' 
                : 'No verified businesses yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={business.logo_url || business.profiles?.avatar_url} />
                    <AvatarFallback>
                      {getBusinessInitials(business.business_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{business.business_name}</CardTitle>
                      {business.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {formatCategory(business.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {business.description}
                </p>

                {renderStars(business.rating)}

                {business.physical_address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{business.physical_address}</span>
                  </div>
                )}

                {(business.city || business.state) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{business.city}{business.city && business.state && ', '}{business.state}</span>
                  </div>
                )}

                {business.operating_hours && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>View Hours</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {business.phone && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  )}
                  {business.email && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Listed {formatTimeAgo(business.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessListings;