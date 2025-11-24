import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RecommendationCategory } from "@/types/recommendations";
import { cn } from "@/lib/utils";

interface Props {
  selectedType?: string;
  onSelectType: (type: string | undefined) => void;
  onSelectCategory: (category: string) => void;
}

export function CategoryGrid({ selectedType, onSelectType, onSelectCategory }: Props) {
  const { data: categories = [] } = useQuery({
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

  const types = [
    { value: undefined, label: 'All', icon: '🌟' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { value: 'service', label: 'Services', icon: '🛠️' },
    { value: 'hidden_gem', label: 'Hidden Gems', icon: '💎' },
    { value: 'experience', label: 'Experiences', icon: '🎯' },
  ];

  const filteredCategories = selectedType
    ? categories.filter(c => c.recommendation_type === selectedType)
    : categories.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {types.map((type) => (
          <Card
            key={type.value || 'all'}
            className={cn(
              "flex-shrink-0 px-4 py-3 cursor-pointer transition-all hover:shadow-md",
              selectedType === type.value && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onSelectType(type.value)}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{type.icon}</span>
              <span className="font-medium whitespace-nowrap">{type.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-all group text-center"
            onClick={() => onSelectCategory(category.slug)}
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              {category.icon || '📍'}
            </div>
            <h3 className="font-medium text-sm line-clamp-2">{category.name}</h3>
          </Card>
        ))}
      </div>
    </div>
  );
}
