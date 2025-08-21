import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocationPreferences, LocationFilterScope } from '@/hooks/useLocationPreferences';

export const LocationFilterSettings = () => {
  const { toast } = useToast();
  const { preferences, loading, updateLocationFilter } = useLocationPreferences();
  const [saving, setSaving] = useState(false);

  const locationOptions = [
    {
      value: 'neighborhood' as LocationFilterScope,
      label: 'Neighborhood Only',
      description: 'Show posts from your neighborhood'
    },
    {
      value: 'city' as LocationFilterScope,
      label: 'City Wide',
      description: 'Show posts from your entire city'
    },
    {
      value: 'state' as LocationFilterScope,
      label: 'State Wide',
      description: 'Show posts from your entire state'
    },
    {
      value: 'all' as LocationFilterScope,
      label: 'All Areas',
      description: 'Show posts from all locations'
    }
  ];

  const handleLocationFilterUpdate = async (filterScope: LocationFilterScope) => {
    try {
      setSaving(true);
      
      const success = await updateLocationFilter(filterScope);
      
      if (success) {
        toast({
          title: "Settings Updated",
          description: `Default location filter set to ${locationOptions.find(opt => opt.value === filterScope)?.label}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update location filter preference.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating location filter:', error);
      toast({
        title: "Error",
        description: "Failed to update location filter preference.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Filter Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Filter Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-location-filter">Default Location Filter</Label>
          <Select
            value={preferences.default_location_filter}
            onValueChange={handleLocationFilterUpdate}
            disabled={saving}
          >
            <SelectTrigger id="default-location-filter">
              <SelectValue placeholder="Select default location filter" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This setting determines which posts are shown by default in your community feed.
            You can always change the filter manually when viewing the feed.
          </p>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <strong>Current setting:</strong> {locationOptions.find(opt => opt.value === preferences.default_location_filter)?.label}
              <br />
              {locationOptions.find(opt => opt.value === preferences.default_location_filter)?.description}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};