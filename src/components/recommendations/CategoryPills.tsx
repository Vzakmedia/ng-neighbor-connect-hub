import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronLeft } from "@/lib/icons";
import * as Icons from "@/lib/icons";
import type { RecommendationCategory } from "@/types/recommendations";

interface Props {
  selectedCategories: string[];
  onSelectCategory: (slug: string) => void;
}

export function CategoryPills({ selectedCategories, onSelectCategory }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['recommendation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendation_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as RecommendationCategory[];
    },
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        onScroll={checkScroll}
      >
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.slug);
          // Get the icon component from the icon name
          const IconComponent = category.icon ? (Icons as any)[category.icon] : null;
          
          return (
            <Button
              key={category.slug}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full flex-shrink-0 px-4 h-10 transition-all",
                isSelected 
                  ? "bg-foreground text-background hover:bg-foreground/90" 
                  : "bg-background hover:bg-muted border-border"
              )}
              onClick={() => onSelectCategory(category.slug)}
            >
              {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
              {category.name}
            </Button>
          );
        })}
      </div>
      
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 h-10 w-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-border hover:bg-background transition-all animate-fade-in"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
      )}
      
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 h-10 w-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-border hover:bg-background transition-all animate-fade-in"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      )}
    </div>
  );
}
