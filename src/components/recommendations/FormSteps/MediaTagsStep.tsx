import { UseFormReturn } from 'react-hook-form';
import { FullRecommendationFormData } from '@/lib/schemas/recommendationSchema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '../ImageUploader';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface MediaTagsStepProps {
  form: UseFormReturn<FullRecommendationFormData>;
}

const SUGGESTED_TAGS = [
  'Family-Friendly',
  'Date Night',
  'Group Hangout',
  'Solo-Friendly',
  'Instagram-Worthy',
  'Hidden Gem',
  'Local Favorite',
  'Tourist Attraction',
  'Budget-Friendly',
  'Luxury',
  'Traditional',
  'Modern',
  'Outdoor',
  'Indoor',
  'Pet-Friendly',
  'Wheelchair Accessible',
];

export const MediaTagsStep = ({ form }: MediaTagsStepProps) => {
  const { formState: { errors }, watch, setValue } = form;
  const [tagInput, setTagInput] = useState('');
  const images = watch('image_urls') || [];
  const tags = watch('tags') || [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue('tags', [...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Images * (At least 1 required)</Label>
        <ImageUploader
          images={images}
          onChange={(newImages) => setValue('image_urls', newImages)}
          maxImages={5}
        />
        {errors.image_urls && (
          <p className="text-sm text-destructive mt-2">{errors.image_urls.message}</p>
        )}
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Tags * (At least 1 required)</Label>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {errors.tags && (
          <p className="text-sm text-destructive mt-2">{errors.tags.message}</p>
        )}
      </div>
    </div>
  );
};
