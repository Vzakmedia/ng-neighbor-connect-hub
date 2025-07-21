import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, MapPin } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  business: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  sponsored: boolean;
  ctaText: string;
  ctaUrl: string;
}

interface AdvertisementCardProps {
  ad: Advertisement;
  size?: 'small' | 'medium' | 'large';
}

const AdvertisementCard = ({ ad, size = 'medium' }: AdvertisementCardProps) => {
  const handleClick = () => {
    window.open(ad.ctaUrl, '_blank');
  };

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  return (
    <Card className={`shadow-card hover:shadow-elevated transition-all cursor-pointer bg-gradient-card ${sizeClasses[size]}`} onClick={handleClick}>
      <CardContent className="p-0">
        {ad.sponsored && (
          <Badge variant="secondary" className="text-xs mb-2">
            Sponsored
          </Badge>
        )}
        
        <div className="flex items-start space-x-3">
          <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src={ad.image} 
              alt={ad.business}
              className="h-full w-full rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm truncate">{ad.business}</h4>
              {ad.rating > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                  {ad.rating} ({ad.reviews})
                </div>
              )}
            </div>
            
            <h5 className="font-medium text-sm mb-1 text-primary">{ad.title}</h5>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {ad.location}
              </div>
              <Button size="sm" variant="outline" className="h-6 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                {ad.ctaText}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvertisementCard;