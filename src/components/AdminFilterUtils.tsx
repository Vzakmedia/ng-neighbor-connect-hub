import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: Array<{
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
  }>;
  children?: React.ReactNode;
}

export const AdminFilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  filters,
  children 
}: AdminFilterBarProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative min-w-64">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {filters.map((filter, index) => (
          <Select key={index} value={filter.value} onValueChange={filter.onValueChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {children}
      </div>
    </div>
  );
};

// Utility functions for common filter operations
export const filterBySearchQuery = function<T>(
  items: T[],
  searchQuery: string,
  searchFields: (item: T) => string[]
): T[] {
  if (!searchQuery.trim()) return items;
  
  const query = searchQuery.toLowerCase();
  return items.filter(item => 
    searchFields(item).some(field => 
      field?.toLowerCase().includes(query)
    )
  );
};

export const filterByDateRange = function<T>(
  items: T[],
  dateFilter: string,
  getDate: (item: T) => string
): T[] {
  if (dateFilter === 'all') return items;
  
  const now = new Date();
  const cutoffTime = (() => {
    switch (dateFilter) {
      case 'today':
        return 24 * 60 * 60 * 1000; // 1 day
      case 'week':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'month':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return Infinity;
    }
  })();
  
  return items.filter(item => {
    const itemDate = new Date(getDate(item));
    return now.getTime() - itemDate.getTime() <= cutoffTime;
  });
};