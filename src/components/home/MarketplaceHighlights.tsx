import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon, ChevronRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useMarketplaceHighlights } from "@/hooks/useDashboardSections";

export const MarketplaceHighlights = () => {
  const navigate = useNavigate();
  const { items, loading } = useMarketplaceHighlights(3);

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
      
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/marketplace?itemId=${item.id}`)}
            className="bg-background rounded-xl overflow-hidden cursor-pointer border border-border/50 hover:shadow-lg hover:scale-105 hover:border-primary/50 transform transition-all duration-300"
          >
            <div className="aspect-square bg-muted relative">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              )}
              {!item.image && (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-3 space-y-1.5">
              <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                {item.title}
              </h3>
              <p className="text-primary font-bold text-base">{item.price}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 rounded-full px-2 py-0.5 w-fit">
                <MapPinIcon className="h-3 w-3" />
                <span className="truncate">{item.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
