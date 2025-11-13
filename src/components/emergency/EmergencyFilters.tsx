import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListBulletIcon, MapPinIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EmergencyFilters, EmergencyViewMode, ALERT_TYPES } from '@/types/emergency';

interface EmergencyFiltersProps {
  filters: EmergencyFilters;
  viewMode: EmergencyViewMode['mode'];
  onFilterChange: (filters: EmergencyFilters) => void;
  onViewModeChange: (mode: EmergencyViewMode['mode']) => void;
  onRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
}

const EmergencyFiltersComponent = ({
  filters,
  viewMode,
  onFilterChange,
  onViewModeChange,
  onRefresh,
  autoRefresh,
  onAutoRefreshToggle
}: EmergencyFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start lg:items-center justify-between">
      {/* Desktop/Tablet view buttons */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('list')}
          size="sm"
          className="touch-manipulation"
        >
          <ListBulletIcon className="h-4 w-4 mr-1" />
          List View
        </Button>
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('map')}
          size="sm"
          className="touch-manipulation"
        >
          <MapPinIcon className="h-4 w-4 mr-1" />
          Map View
        </Button>
        <Button
          variant={viewMode === 'feed' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('feed')}
          size="sm"
          className="touch-manipulation"
        >
          <ChartBarIcon className="h-4 w-4 mr-1" />
          Live Feed
        </Button>
      </div>
      
      {/* Mobile view buttons */}
      <div className="md:hidden w-full">
        <div className="flex justify-center gap-2 w-full">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('list')}
            size="sm"
            className="transition-all duration-300 ease-in-out text-xs touch-manipulation flex-1"
          >
            <ListBulletIcon className="h-3 w-3 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('map')}
            size="sm"
            className="transition-all duration-300 ease-in-out text-xs touch-manipulation flex-1"
          >
            <MapPinIcon className="h-3 w-3 mr-1" />
            Map
          </Button>
          <Button
            variant={viewMode === 'feed' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('feed')}
            size="sm"
            className="transition-all duration-300 ease-in-out text-xs touch-manipulation flex-1"
          >
            <ChartBarIcon className="h-3 w-3 mr-1" />
            Feed
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-96">
        <Select
          value={filters.severity}
          onValueChange={(value) => onFilterChange({ ...filters, severity: value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => onFilterChange({ ...filters, type: value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {ALERT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ ...filters, status: value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="false_alarm">False Alarm</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="touch-manipulation"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={onAutoRefreshToggle}
            className="touch-manipulation text-xs px-2"
          >
            Auto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFiltersComponent;