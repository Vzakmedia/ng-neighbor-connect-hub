import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, ExternalLink } from 'lucide-react';
import { SponsoredContent } from '@/types/promotional';

interface PromotionalContentDisplayProps {
  content: SponsoredContent[];
  onInteraction?: (promotedPostId: string, type: 'click' | 'conversion') => void;
  className?: string;
}

export const PromotionalContentDisplay = ({ 
  content, 
  onInteraction,
  className = '' 
}: PromotionalContentDisplayProps) => {
  const handleClick = (item: SponsoredContent) => {
    onInteraction?.(item.promoted_post_id, 'click');
  };

  const handleConversion = (item: SponsoredContent) => {
    onInteraction?.(item.promoted_post_id, 'conversion');
  };

  const renderSponsoredItem = (item: SponsoredContent) => {
    const { post_content, post_type } = item;

    return (
      <Card key={item.promoted_post_id} className="relative border-l-4 border-l-yellow-500">
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
              onClick={() => handleClick(item)}
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
                  handleClick(item);
                  handleConversion(item);
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
                handleClick(item);
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

  if (content.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Sponsored Content</h3>
        <Badge variant="outline" className="text-xs">
          AD
        </Badge>
      </div>
      
      {content.map(renderSponsoredItem)}
    </div>
  );
};