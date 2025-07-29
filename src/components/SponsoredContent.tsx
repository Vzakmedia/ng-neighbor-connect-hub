import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ExternalLink } from 'lucide-react';

interface PromotedContent {
  promoted_post_id: string;
  campaign_id: string;
  post_type: string;
  post_content: any;
  priority: number;
  cost_per_click: number;
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
  const [promotedContent, setPromotedContent] = useState<PromotedContent[]>([]);
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
      setPromotedContent(data || []);

      // Log impressions for fetched content
      if (data && data.length > 0) {
        for (const content of data) {
          await logImpression(content.promoted_post_id, 'view');
          onImpression?.(content.promoted_post_id);
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

  const handleClick = async (content: PromotedContent) => {
    await logImpression(content.promoted_post_id, 'click');
    onClick?.(content.promoted_post_id);
  };

  const handleConversion = async (promotedPostId: string) => {
    await logImpression(promotedPostId, 'conversion');
  };

  const renderPromotedPost = (content: PromotedContent) => {
    const { post_content, post_type } = content;

    return (
      <Card key={content.promoted_post_id} className="relative border-l-4 border-l-yellow-500">
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            Sponsored
          </Badge>
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {post_content.title}
            {post_type === 'service' && <Star className="h-4 w-4 text-yellow-500" />}
          </CardTitle>
          <CardDescription className="text-sm">
            {post_content.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {post_type === 'marketplace_item' && (
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                ₦{post_content.price?.toLocaleString()}
              </span>
              {post_content.condition && (
                <Badge variant="outline">{post_content.condition}</Badge>
              )}
            </div>
          )}

          {post_type === 'service' && (
            <div className="space-y-2">
              {post_content.category && (
                <Badge variant="outline">{post_content.category}</Badge>
              )}
              {post_content.price && (
                <p className="text-lg font-semibold text-green-600">
                  From ₦{post_content.price?.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {post_type === 'event' && (
            <div className="space-y-2">
              {post_content.date && (
                <p className="text-sm text-gray-600">
                  📅 {new Date(post_content.date).toLocaleDateString()}
                </p>
              )}
              {post_content.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  {post_content.location}
                </div>
              )}
            </div>
          )}

          {post_content.location && post_type !== 'event' && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              {post_content.location}
            </div>
          )}

          {post_content.contact && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Phone className="h-3 w-3" />
              {post_content.contact}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => handleClick(content)}
              className="flex-1"
            >
              {post_type === 'marketplace_item' && 'View Item'}
              {post_type === 'service' && 'Book Service'}
              {post_type === 'event' && 'Learn More'}
              {post_type === 'community_post' && 'Read More'}
            </Button>
            
            {(post_type === 'marketplace_item' || post_type === 'service') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  handleClick(content);
                  handleConversion(content.promoted_post_id);
                }}
              >
                Contact
              </Button>
            )}
          </div>

          {post_content.website && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                handleClick(content);
                window.open(post_content.website, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Visit Website
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (promotedContent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Sponsored Content</h3>
        <Badge variant="outline" className="text-xs">
          AD
        </Badge>
      </div>
      
      {promotedContent.map(renderPromotedPost)}
    </div>
  );
};