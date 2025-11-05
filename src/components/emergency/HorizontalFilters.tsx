import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ALERT_TYPES } from '@/types/emergency';

export type FilterCategory = 'all' | 'break_in' | 'theft' | 'accident' | 'suspicious_activity' | 'harassment' | 'fire' | 'flood' | 'power_outage' | 'road_closure' | 'other';

interface HorizontalFiltersProps {
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
}

const FILTER_CATEGORIES = ALERT_TYPES.map(type => ({
  value: type.value as FilterCategory,
  label: type.label
}));

const HorizontalFilters = ({ selectedCategory, onCategoryChange }: HorizontalFiltersProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div ref={scrollContainerRef} className="w-full overflow-x-auto scrollbar-hide">
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
