import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ExternalLink } from 'lucide-react';

interface PromotedContentLocal {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  location: string;
  price: string;
  url: string;
  sponsored: boolean;
  time_posted: string;
  business: {
    name: string;
    logo?: string;
    location: string;
    verified: boolean;
  };
  cta: string;
  likes: number;
  comments: number;
  type: string;
}

interface SponsoredContentProps {
  userLocation?: string;
  limit?: number;
  onImpression?: (promotedPostId: string) => void;
  onClick?: (promotedPostId: string) => void;
}

export const SponsoredContent = ({ 
  userLocation, 
  limit = 3, 
  onImpression, 
  onClick 
}: SponsoredContentProps) => {
  const { user } = useAuth();
  const [promotedContent, setPromotedContent] = useState<PromotedContentLocal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotedContent();
  }, [userLocation]);

  const fetchPromotedContent = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_promoted_content', {
        user_location: userLocation || null,
        content_limit: limit
      });

      if (error) throw error;
      setPromotedContent((data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: Array.isArray(item.images) ? item.images : [],
        category: item.category,
        location: item.location,
        price: item.price,
        url: item.url,
        sponsored: item.sponsored,
        time_posted: item.time_posted,
        business: typeof item.business === 'object' ? item.business : {
          name: 'Business',
          location: 'Local Area',
          verified: false
        },
        cta: item.cta,
        likes: item.likes || 0,
        comments: item.comments || 0,
        type: item.type
      })));

      // Log impressions for fetched content
      if (data && data.length > 0) {
        for (const content of data) {
          await logImpression(content.id, 'view');
          onImpression?.(content.id);
        }
      }
    } catch (error) {
      console.error('Error fetching promoted content:', error);
    } finally {
      setLoading(false);
    }
  };

  const logImpression = async (promotedPostId: string, impressionType: string) => {
    try {
      await supabase.rpc('log_promotion_impression', {
        _promoted_post_id: promotedPostId,
        _user_id: user?.id || null,
        _user_location: userLocation || null,
        _impression_type: impressionType
      });
    } catch (error) {
      console.error('Error logging impression:', error);
    }
  };

  if (promotedContent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Sponsored Content</h3>
        <Badge variant="outline" className="text-xs">AD</Badge>
      </div>
      {promotedContent.map(content => (
        <Card key={content.id} className="border-l-4 border-l-primary/50">
          <CardContent className="p-4">
            <h4 className="font-semibold">{content.title}</h4>
            <p className="text-sm text-muted-foreground mb-2">{content.description}</p>
            <Button size="sm" onClick={() => onClick?.(content.id)}>
              {content.cta}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};