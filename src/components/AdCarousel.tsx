import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  MapPin, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PromotionalAd {
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
  promotion_type: string;
  contact_info?: string;
}

interface AdCarouselProps {
  ads: PromotionalAd[];
  autoSlideInterval?: number;
}

const AdCarousel = ({ ads, autoSlideInterval = 5000 }: AdCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-slide functionality
  useEffect(() => {
    if (!isPlaying || ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [isPlaying, ads.length, autoSlideInterval]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAdClick = (ad: PromotionalAd) => {
    if (ad.url) {
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (ads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No ads available</p>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="relative">
      <Card className="border-l-4 border-l-community-yellow bg-gradient-to-r from-community-yellow/5 to-transparent">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="ring-2 ring-community-yellow/20 h-8 w-8">
              <AvatarFallback className="bg-community-yellow/10 text-community-yellow font-medium text-xs">
                {currentAd.location.split(' ')[0]?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm truncate">{currentAd.location.split(',')[0] || 'Local Business'}</span>
                <Badge variant="outline" className="text-xs bg-gradient-primary text-white">
                  Sponsored
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{currentAd.location}</span>
                <Clock className="h-3 w-3 ml-1" />
                <span>{currentAd.timePosted}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div 
            className="cursor-pointer"
            onClick={() => handleAdClick(currentAd)}
          >
            <h3 className="font-semibold text-sm mb-2 hover:text-primary transition-colors line-clamp-2">
              {currentAd.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
              {currentAd.description}
            </p>

            {currentAd.image && (
              <div 
                className="mb-3 rounded-lg overflow-hidden bg-muted h-32 bg-cover bg-center" 
                style={{ backgroundImage: `url(${currentAd.image})` }} 
              />
            )}

            {currentAd.price && (
              <div className="mb-3">
                <span className="text-sm font-bold text-primary">{currentAd.price}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-3">
              <Badge variant="outline" className="text-xs">{currentAd.category}</Badge>
              <Badge variant="secondary" className="text-xs bg-community-green/20 text-community-green">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>

            <Button 
              size="sm"
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                handleAdClick(currentAd);
              }}
            >
              Learn More
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>

          {/* Carousel Controls */}
          {ads.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Dots Indicator */}
              <div className="flex space-x-1">
                {ads.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                {currentIndex + 1} / {ads.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdCarousel;