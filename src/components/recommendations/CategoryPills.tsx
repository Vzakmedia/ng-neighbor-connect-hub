import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RecommendationCategory } from "@/types/recommendations";

interface Props {
  selectedCategories: string[];
  onSelectCategory: (slug: string) => void;
}

export function CategoryPills({ selectedCategories, onSelectCategory }: Props) {
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
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.slug);
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
            {category.icon && <span className="mr-2">{category.icon}</span>}
            {category.name}
          </Button>
        );
      })}
    </div>
  );
}
