import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PromotionImageUpload } from '@/components/PromotionImageUpload';

interface CampaignBasicInfoStepProps {
  form: UseFormReturn<any>;
}

export const CampaignBasicInfoStep = ({ form }: CampaignBasicInfoStepProps) => {
  const { register, formState: { errors }, watch, setValue } = form;
  const images = watch('ad_images') || [];

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="campaign_name">Campaign Name *</Label>
        <Input
          id="campaign_name"
          placeholder="My Summer Campaign"
          {...register('campaign_name')}
        />
        {errors.campaign_name && (
          <p className="text-sm text-destructive mt-1">{errors.campaign_name.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ad_title">Ad Title *</Label>
        <Input
          id="ad_title"
          placeholder="Amazing Product or Service"
          {...register('ad_title')}
        />
        {errors.ad_title && (
          <p className="text-sm text-destructive mt-1">{errors.ad_title.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ad_description">Ad Description *</Label>
        <Textarea
          id="ad_description"
          placeholder="Describe what makes your offering special..."
          {...register('ad_description')}
          rows={4}
        />
        {errors.ad_description && (
          <p className="text-sm text-destructive mt-1">{errors.ad_description.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ad_url">Destination URL (Optional)</Label>
        <Input
          id="ad_url"
          placeholder="https://example.com or /services"
          {...register('ad_url')}
        />
        {errors.ad_url && (
          <p className="text-sm text-destructive mt-1">{errors.ad_url.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ad_cta">Call to Action Button Text</Label>
        <Input
          id="ad_cta"
          placeholder="Learn More"
          {...register('ad_call_to_action')}
        />
      </div>

      <div>
        <Label>Ad Images (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Upload up to 5 images for your ad. Recommended size: 1200x675px (16:9 ratio)
        </p>
        <PromotionImageUpload
          images={images}
          onImagesChange={(newImages) => setValue('ad_images', newImages)}
          maxImages={5}
        />
      </div>
    </div>
  );
};