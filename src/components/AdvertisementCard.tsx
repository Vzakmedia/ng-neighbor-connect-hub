import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, ExternalLink } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image?: string;
  location: string;
  category: string;
  price?: string;
  url?: string;
  sponsored: boolean;
  timePosted: string;
}

interface AdvertisementCardProps {
  ad: Advertisement;
}

const AdvertisementCard = ({ ad }: AdvertisementCardProps) => {
  const handleAdClick = () => {
    if (ad.url) {
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card role="article" aria-label={`Promoted post: ${ad.title}`} className="shadow-card hover:shadow-elevated transition-all cursor-pointer border-l-4 border-l-community-yellow">
      <CardContent className="p-3 sm:p-4" onClick={handleAdClick}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-community-yellow/20 text-community-yellow">
              Sponsored
            </Badge>
            <Badge variant="outline" className="text-xs">
              {ad.category}
            </Badge>
          </div>
          {ad.url && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {ad.image && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={ad.image}
              alt={ad.title}
              loading="lazy"
              className="w-full h-28 sm:h-40 object-cover"
            />
          </div>
        )}

        <h4 className="font-semibold mb-2 text-foreground hover:text-primary transition-colors text-base sm:text-lg">
          {ad.title}
        </h4>
        
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
          {ad.description}
        </p>

        {ad.price && (
          <p className="text-base sm:text-lg font-bold text-primary mb-2">{ad.price}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {ad.location}
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {ad.timePosted}
          </div>
        </div>

        {ad.url && (
          <Button variant="outline" className="w-full mt-3 h-10 sm:h-11 text-sm" aria-label={`Learn more about ${ad.title}`} onClick={handleAdClick}>
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvertisementCard;