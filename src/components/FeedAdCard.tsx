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
  images?: string[];
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
    <Card role="article" aria-label={`Promoted post: ${ad.title}`} className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-community-yellow bg-gradient-to-r from-community-yellow/5 to-transparent">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="ring-2 ring-community-yellow/20 w-9 h-9 sm:w-10 sm:h-10">
              <AvatarFallback className="bg-community-yellow/10 text-community-yellow font-medium">
                {ad.business.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm sm:text-base">{ad.business.name}</h4>
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
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
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
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 p-4 sm:p-6 cursor-pointer" onClick={handleAdClick}>
        <div className="mb-3">
          <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2 hover:text-primary transition-colors">
            {ad.title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {ad.description}
          </p>
        </div>

        {/* Image Gallery */}
        {(ad.image || (ad.images && ad.images.length > 0)) && (
          <div className="mb-4">
            {ad.images && ad.images.length > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                {ad.images.slice(0, 4).map((img, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-muted h-24 sm:h-32 relative">
                    <img
                      src={img}
                      alt={`${ad.title} image ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && ad.images!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">+{ad.images!.length - 4} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden bg-muted h-40 sm:h-56">
                <img
                  src={ad.image || ad.images?.[0]!}
                  alt={ad.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
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
          className="w-full mb-4 bg-gradient-primary hover:opacity-90 h-10 sm:h-11 text-sm sm:text-base" 
          onClick={handleAdClick}
        >
          {ad.cta}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
        
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" aria-label="Likes" className="h-8 sm:h-9 text-xs sm:text-sm text-muted-foreground hover:text-destructive">
              <Heart className="h-4 w-4 mr-1" />
              {ad.likes}
            </Button>
            <Button variant="ghost" size="sm" aria-label="Comments" className="h-8 sm:h-9 text-xs sm:text-sm text-muted-foreground hover:text-primary">
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