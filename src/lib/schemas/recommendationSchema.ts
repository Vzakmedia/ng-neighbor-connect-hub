import { z } from 'zod';

export const basicInfoSchema = z.object({
  recommendation_type: z.enum(['restaurant', 'service', 'hidden_gem', 'experience']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Category is required'),
  sub_category: z.string().optional(),
});

export const locationSchema = z.object({
  location_type: z.enum(['physical', 'online', 'both']),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  neighborhood: z.string().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const additionalInfoSchema = z.object({
  price_range: z.enum(['₦', '₦₦', '₦₦₦', '₦₦₦₦']).optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
  operating_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().optional(),
  })).optional(),
});

export const mediaTagsSchema = z.object({
  image_urls: z.array(z.string()).min(1, 'At least one image is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

export const fullRecommendationSchema = basicInfoSchema
  .merge(locationSchema)
  .merge(additionalInfoSchema)
  .merge(mediaTagsSchema);

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type AdditionalInfoFormData = z.infer<typeof additionalInfoSchema>;
export type MediaTagsFormData = z.infer<typeof mediaTagsSchema>;
export type FullRecommendationFormData = z.infer<typeof fullRecommendationSchema>;
