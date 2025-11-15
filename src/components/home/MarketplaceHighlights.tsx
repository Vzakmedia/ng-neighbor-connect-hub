import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBagIcon, ChevronRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useMarketplaceHighlights } from "@/hooks/useDashboardSections";

export const MarketplaceHighlights = () => {
  const navigate = useNavigate();
  const { items, loading } = useMarketplaceHighlights(3);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBagIcon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Marketplace</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/marketplace")}
          className="text-primary"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/marketplace?itemId=${item.id}`)}
            className="bg-background rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
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
            <div className="p-2">
              <h3 className="font-medium text-foreground text-xs line-clamp-1 mb-1">
                {item.title}
              </h3>
              <p className="text-primary font-bold text-sm mb-1">{item.price}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
