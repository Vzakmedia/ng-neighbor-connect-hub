import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ExternalLink, 
  MapPin, 
  Clock, 
  Star,
  ShoppingBag,
  Heart,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';

interface FeedAdvertisement {
  id: string;
  business: {
    name: string;
    logo?: string;
    location: string;
    verified: boolean;
  };
  title: string;
  description: string;
  category: string;
  image?: string;
  cta: string;
  url?: string;
  promoted: boolean;
  timePosted: string;
  likes: number;
  comments: number;
  rating?: number;
  price?: string;
  type: 'general' | 'safety' | 'marketplace' | 'event';
}

interface FeedAdProps {
  ad: FeedAdvertisement;
}

const FeedAdCard = ({ ad }: FeedAdProps) => {
  const handleAdClick = () => {
    if (ad.url) {
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-community-yellow bg-gradient-to-r from-community-yellow/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="ring-2 ring-community-yellow/20">
              <AvatarFallback className="bg-community-yellow/10 text-community-yellow font-medium">
                {ad.business.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{ad.business.name}</h4>
                {ad.business.verified && (
                  <Badge variant="secondary" className="text-xs bg-community-yellow/20 text-community-yellow">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs bg-gradient-primary text-white">
                  Sponsored
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{ad.business.location}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{ad.timePosted}</span>
                {ad.rating && (
                  <>
                    <Star className="h-3 w-3 ml-2 fill-current text-community-yellow" />
                    <span>{ad.rating}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 cursor-pointer" onClick={handleAdClick}>
        <div className="mb-3">
          <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors">
            {ad.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {ad.description}
          </p>
        </div>

        {ad.image && (
          <div className="mb-4 rounded-lg overflow-hidden bg-muted h-48 bg-cover bg-center" 
               style={{ backgroundImage: `url(${ad.image})` }} />
        )}

        {ad.price && (
          <div className="mb-3">
            <span className="text-lg font-bold text-primary">{ad.price}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 mb-4">
          <Badge variant="outline" className="text-xs">{ad.category}</Badge>
          {ad.promoted && (
            <Badge variant="secondary" className="text-xs bg-community-green/20 text-community-green">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Special Offer
            </Badge>
          )}
        </div>

        <Button 
          className="w-full mb-4 bg-gradient-primary hover:opacity-90" 
          onClick={handleAdClick}
        >
          {ad.cta}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <Heart className="h-4 w-4 mr-1" />
              {ad.likes}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <MessageCircle className="h-4 w-4 mr-1" />
              {ad.comments}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Promoted post</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedAdCard;