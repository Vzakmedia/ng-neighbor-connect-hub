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
    onInteraction?.(item.id, 'click');
  };

  const handleConversion = (item: SponsoredContent) => {
    onInteraction?.(item.id, 'conversion');
  };

  const renderSponsoredItem = (item: SponsoredContent) => {
    return (
      <Card key={item.id} className="relative border-l-4 border-l-yellow-500">
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            Sponsored
          </Badge>
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {item.title}
            <Star className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-sm">
            {item.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {item.price && (
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                {item.price}
              </span>
              <Badge variant="outline">{item.category}</Badge>
            </div>
          )}

          {item.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              {item.location}
            </div>
          )}

          {item.business && (
            <div className="flex items-center gap-2 text-sm">
              {item.business.logo && (
                <img src={item.business.logo} alt={item.business.name} className="w-6 h-6 rounded-full" />
              )}
              <span className="font-medium">{item.business.name}</span>
              {item.business.verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => handleClick(item)}
              className="flex-1"
            >
              {item.cta}
            </Button>
            
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
          </div>

          {item.url && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                handleClick(item);
                if (item.url) {
                  window.open(item.url, '_blank');
                }
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