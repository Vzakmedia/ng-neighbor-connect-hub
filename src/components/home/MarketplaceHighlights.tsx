import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon, ChevronRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useMarketplaceHighlights } from "@/hooks/useDashboardSections";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const MarketplaceHighlights = () => {
  const navigate = useNavigate();
  const { items, loading } = useMarketplaceHighlights(6);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };
    
    api.on('select', onSelect);
    onSelect();
    
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBagIcon className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Marketplace</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/marketplace")}
          className="text-primary hover:bg-primary/10 rounded-lg px-3 py-1"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 7000,
            stopOnInteraction: false,
          }) as any
        ]}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id}>
              <div
                onClick={() => navigate(`/marketplace?itemId=${item.id}`)}
                className="bg-background rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 transform transition-all duration-300"
              >
                <div className="w-full aspect-[4/3] bg-muted relative overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {!item.image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBagIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-lg line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-primary font-bold text-xl">{item.price}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/30 rounded-full px-3 py-1 w-fit">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, index) => (
          <div
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => api?.scrollTo(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                api?.scrollTo(index);
              }
            }}
            className={`h-2 w-2 rounded-full flex-shrink-0 inline-block cursor-pointer transition-colors ${
              index === currentSlide 
                ? "bg-primary" 
                : "bg-muted-foreground/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
