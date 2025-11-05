import { Button } from '@/components/ui/button';

export type FilterCategory = 'all' | 'safety' | 'outages' | 'weather' | 'fires' | 'traffic';

interface HorizontalFiltersProps {
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
}

const FILTER_CATEGORIES = [
  { value: 'all' as FilterCategory, label: 'All' },
  { value: 'safety' as FilterCategory, label: 'Safety' },
  { value: 'outages' as FilterCategory, label: 'Outages' },
  { value: 'weather' as FilterCategory, label: 'Weather' },
  { value: 'fires' as FilterCategory, label: 'Fires' },
  { value: 'traffic' as FilterCategory, label: 'Traffic' },
];

const HorizontalFilters = ({ selectedCategory, onCategoryChange }: HorizontalFiltersProps) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2 min-w-min">
        {FILTER_CATEGORIES.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.value)}
            className="rounded-full px-4 flex-shrink-0"
          >
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default HorizontalFilters;
