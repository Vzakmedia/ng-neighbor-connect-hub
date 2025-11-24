import { UseFormReturn } from 'react-hook-form';
import { FullRecommendationFormData } from '@/lib/schemas/recommendationSchema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OperatingHoursEditor } from '../OperatingHoursEditor';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface AdditionalInfoStepProps {
  form: UseFormReturn<FullRecommendationFormData>;
}

const PRICE_RANGES = [
  { value: '₦', label: '₦', description: 'Budget-friendly' },
  { value: '₦₦', label: '₦₦', description: 'Moderate' },
  { value: '₦₦₦', label: '₦₦₦', description: 'Upscale' },
  { value: '₦₦₦₦', label: '₦₦₦₦', description: 'Premium' },
] as const;

export const AdditionalInfoStep = ({ form }: AdditionalInfoStepProps) => {
  const { register, formState: { errors }, watch, setValue } = form;
  const priceRange = watch('price_range');
  const operatingHours = watch('operating_hours') || {};

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Price Range (Optional)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRICE_RANGES.map((price) => {
            const isSelected = priceRange === price.value;
            return (
              <Card
                key={price.value}
                onClick={() => setValue('price_range', price.value as any)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <CurrencyDollarIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-bold text-lg ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {price.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{price.description}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Contact Information (Optional)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_phone">Phone Number</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="+234 800 000 0000"
              {...register('contact_info.phone')}
            />
          </div>

          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="contact@example.com"
              {...register('contact_info.email')}
            />
            {errors.contact_info?.email && (
              <p className="text-sm text-destructive mt-1">{errors.contact_info.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_website">Website</Label>
            <Input
              id="contact_website"
              type="url"
              placeholder="https://example.com"
              {...register('contact_info.website')}
            />
            {errors.contact_info?.website && (
              <p className="text-sm text-destructive mt-1">{errors.contact_info.website.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact_whatsapp">WhatsApp</Label>
            <Input
              id="contact_whatsapp"
              type="tel"
              placeholder="+234 800 000 0000"
              {...register('contact_info.whatsapp')}
            />
          </div>

          <div>
            <Label htmlFor="contact_instagram">Instagram</Label>
            <Input
              id="contact_instagram"
              placeholder="@username"
              {...register('contact_info.instagram')}
            />
          </div>

          <div>
            <Label htmlFor="contact_facebook">Facebook</Label>
            <Input
              id="contact_facebook"
              placeholder="facebook.com/page"
              {...register('contact_info.facebook')}
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Operating Hours (Optional)</Label>
        <OperatingHoursEditor
          value={operatingHours}
          onChange={(hours) => setValue('operating_hours', hours as any)}
        />
      </div>
    </div>
  );
};
