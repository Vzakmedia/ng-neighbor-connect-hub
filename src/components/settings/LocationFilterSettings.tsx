import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Settings, ExternalLink } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { useLocationPreferences, LocationFilterScope } from '@/hooks/useLocationPreferences';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

export const LocationFilterSettings = () => {
  const { toast } = useToast();
  const { preferences, loading, updateLocationFilter } = useLocationPreferences();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const locationOptions = [
    {
      value: 'neighborhood' as LocationFilterScope,
      label: 'My Ward Only',
      description: 'Show posts from people in your ward'
    },
    {
      value: 'city' as LocationFilterScope,
      label: 'My LGA',
      description: 'Show posts from people in your LGA'
    },
    {
      value: 'state' as LocationFilterScope,
      label: 'My State',
      description: 'Show posts from people in your state'
    },
    {
      value: 'all' as LocationFilterScope,
      label: 'All Areas',
      description: 'Show posts from everywhere'
    }
  ];

  const handleLocationFilterUpdate = async (filterScope: LocationFilterScope) => {
    try {
      setSaving(true);
      
      const success = await updateLocationFilter(filterScope);
      
      if (success) {
        toast({
          title: "Settings Updated",
          description: `Default viewing scope set to ${locationOptions.find(opt => opt.value === filterScope)?.label}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update viewing scope preference.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating viewing scope:', error);
      toast({
        title: "Error",
        description: "Failed to update viewing scope preference.",
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
            Default Viewing Scope
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
          Default Viewing Scope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Profile Location */}
        {profile && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Your Location</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="h-7 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Update Profile
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {profile.neighborhood && profile.city && profile.state ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.neighborhood}, {profile.city}, {profile.state}
                </div>
              ) : (
                <div className="text-destructive text-xs">
                  ⚠️ Incomplete location - please update your profile
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="default-location-filter">Default Viewing Scope</Label>
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
            Controls how broad your feed is by default. You're always seeing posts from people in your area.
            You can change this anytime when viewing the feed.
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