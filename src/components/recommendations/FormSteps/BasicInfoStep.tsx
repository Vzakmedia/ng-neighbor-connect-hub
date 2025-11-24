import { UseFormReturn } from 'react-hook-form';
import { FullRecommendationFormData } from '@/lib/schemas/recommendationSchema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { CakeIcon, BriefcaseIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface BasicInfoStepProps {
  form: UseFormReturn<FullRecommendationFormData>;
}

const RECOMMENDATION_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: CakeIcon, description: 'Dining establishments' },
  { value: 'service', label: 'Service', icon: BriefcaseIcon, description: 'Professional services' },
  { value: 'hidden_gem', label: 'Hidden Gem', icon: MapPinIcon, description: 'Secret spots & places' },
  { value: 'experience', label: 'Experience', icon: SparklesIcon, description: 'Activities & events' },
] as const;

const CATEGORIES = [
  'Fine Dining', 'Casual Dining', 'Fast Food', 'Cafe', 'Bakery',
  'Healthcare', 'Beauty & Wellness', 'Education', 'Tech Services',
  'Entertainment', 'Nature & Parks', 'Cultural Sites', 'Shopping',
  'Adventure', 'Arts & Crafts', 'Sports & Fitness', 'Nightlife'
];

export const BasicInfoStep = ({ form }: BasicInfoStepProps) => {
  const { register, formState: { errors }, watch, setValue } = form;
  const selectedType = watch('recommendation_type');

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Recommendation Type *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RECOMMENDATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;
            return (
              <Card
                key={type.value}
                onClick={() => setValue('recommendation_type', type.value)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {errors.recommendation_type && (
          <p className="text-sm text-destructive mt-1">{errors.recommendation_type.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g., The Best Jollof in Lagos"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {watch('title')?.length || 0}/100 characters
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Tell us what makes this place special..."
          rows={5}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {watch('description')?.length || 0}/1000 characters
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watch('category')}
            onValueChange={(value) => setValue('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sub_category">Sub-Category (Optional)</Label>
          <Input
            id="sub_category"
            placeholder="e.g., Nigerian Cuisine"
            {...register('sub_category')}
          />
        </div>
      </div>
    </div>
  );
};
