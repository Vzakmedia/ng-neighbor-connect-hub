import { UseFormReturn } from 'react-hook-form';
import { FullRecommendationFormData } from '@/lib/schemas/recommendationSchema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { MapPinIcon, GlobeAltIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from '@/data/nigeriaLocationData';

interface LocationStepProps {
  form: UseFormReturn<FullRecommendationFormData>;
}

const LOCATION_TYPES = [
  { value: 'physical', label: 'Physical Location', icon: BuildingOfficeIcon, description: 'Has a physical address' },
  { value: 'online', label: 'Online Only', icon: GlobeAltIcon, description: 'Virtual/online service' },
  { value: 'both', label: 'Both', icon: MapPinIcon, description: 'Physical & online presence' },
] as const;

export const LocationStep = ({ form }: LocationStepProps) => {
  const { register, formState: { errors }, watch, setValue } = form;
  const locationType = watch('location_type');
  const selectedState = watch('state');
  const selectedCity = watch('city');
  
  const showPhysicalFields = locationType === 'physical' || locationType === 'both';
  const cities = selectedState ? STATE_CITIES[selectedState] || [] : [];
  const neighborhoods = selectedCity ? CITY_NEIGHBORHOODS[selectedCity] || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Location Type *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LOCATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = locationType === type.value;
            return (
              <Card
                key={type.value}
                onClick={() => setValue('location_type', type.value)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {errors.location_type && (
          <p className="text-sm text-destructive mt-1">{errors.location_type.message}</p>
        )}
      </div>

      {showPhysicalFields && (
        <>
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="e.g., 123 Victoria Island Road"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={watch('state')}
                onValueChange={(value) => {
                  setValue('state', value);
                  setValue('city', '');
                  setValue('neighborhood', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City/LGA *</Label>
              <Select
                value={watch('city')}
                onValueChange={(value) => {
                  setValue('city', value);
                  setValue('neighborhood', '');
                }}
                disabled={!selectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city/LGA" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="neighborhood">Neighborhood/Ward (Optional)</Label>
            <Select
              value={watch('neighborhood')}
              onValueChange={(value) => setValue('neighborhood', value)}
              disabled={!selectedCity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {!showPhysicalFields && (
        <Card className="p-4 bg-muted">
          <p className="text-sm text-muted-foreground text-center">
            Online-only services don't require a physical address
          </p>
        </Card>
      )}
    </div>
  );
};
