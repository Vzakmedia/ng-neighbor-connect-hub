import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, DollarSign, Eye, Calendar, Package } from 'lucide-react';

interface ContentSuggestionPanelProps {
  adType: string;
  onContentSelect: (content: any) => void;
}

interface SuggestedContent {
  id: string;
  title: string;
  description: string;
  images?: string[];
  price?: number;
  location?: string;
  rating?: number;
  created_at: string;
  category?: string;
  type: string;
}

const ContentSuggestionPanel = ({ adType, onContentSelect }: ContentSuggestionPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<SuggestedContent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adType && user) {
      fetchContent();
    }
  }, [adType, user]);

  const fetchContent = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (adType) {
        case 'service':
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', user.id)
            .eq('approval_status', 'approved')
            .order('created_at', { ascending: false });
          
          if (servicesError) throw servicesError;
          data = (services || []).map(service => ({
            ...service,
            type: 'service'
          }));
          break;

        case 'marketplace_item':
          const { data: items, error: itemsError } = await supabase
            .from('marketplace_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('approval_status', 'approved')
            .order('created_at', { ascending: false });
          
          if (itemsError) throw itemsError;
          data = (items || []).map(item => ({
            ...item,
            type: 'marketplace_item'
          }));
          break;

        case 'community_post':
          const { data: posts, error: postsError } = await supabase
            .from('community_posts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (postsError) throw postsError;
          data = (posts || []).map(post => ({
            ...post,
            type: 'community_post'
          }));
          break;

        case 'event':
          // Events table doesn't exist yet - skip for now
          data = [];
          break;

        case 'business':
          const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', user.id)
            .eq('verification_status', 'verified')
            .order('created_at', { ascending: false });
          
          if (businessError) throw businessError;
          data = (businesses || []).map(business => ({
            id: business.id,
            title: business.business_name,
            description: business.description,
            images: business.logo_url ? [business.logo_url] : [],
            location: `${business.city}, ${business.state}`,
            category: business.category,
            created_at: business.created_at,
            type: 'business'
          }));
          break;
      }

      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load your content suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = (selectedContent: SuggestedContent) => {
    onContentSelect({
      contentId: selectedContent.id,
      title: selectedContent.title,
      description: selectedContent.description,
      images: selectedContent.images || [],
      price: selectedContent.price,
      location: selectedContent.location,
      category: selectedContent.category,
      type: selectedContent.type
    });
  };

  const getContentTypeLabel = () => {
    switch (adType) {
      case 'service': return 'Your Services';
      case 'marketplace_item': return 'Your Marketplace Items';
      case 'community_post': return 'Your Community Posts';
      case 'event': return 'Your Events';
      case 'business': return 'Your Businesses';
      default: return 'Your Content';
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'service': return <Star className="h-4 w-4" />;
      case 'marketplace_item': return <Package className="h-4 w-4" />;
      case 'community_post': return <Eye className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'business': return <MapPin className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (!adType) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getContentIcon(adType)}
        <h4 className="font-medium">{getContentTypeLabel()}</h4>
        <Badge variant="outline">{content.length}</Badge>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">Loading your content...</div>
        </div>
      ) : content.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-sm text-muted-foreground">
              No {adType.replace('_', ' ')}s found. Create some first to promote them.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {content.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {item.images && item.images.length > 0 && (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate">{item.title}</h5>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {item.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₦{item.price.toLocaleString()}
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      )}
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {item.rating}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleContentSelect(item)}
                >
                  Select for Advertisement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentSuggestionPanel;