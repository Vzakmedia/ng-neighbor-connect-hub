// Centralized business categories for the platform
// This is the single source of truth for all business category data

export interface BusinessCategory {
  value: string;
  label: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { value: 'restaurant_food', label: 'Restaurant & Food' },
  { value: 'retail_shopping', label: 'Retail & Shopping' },
  { value: 'health_wellness', label: 'Health & Wellness' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'education', label: 'Education' },
  { value: 'beauty_personal_care', label: 'Beauty & Personal Care' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'technology', label: 'Technology' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' }
];

/**
 * Format a category value to a readable label
 * @param category - The category value (e.g., 'restaurant_food')
 * @returns Formatted category label (e.g., 'Restaurant & Food')
 */
export const formatCategory = (category: string): string => {
  const found = BUSINESS_CATEGORIES.find(cat => cat.value === category);
  if (found) return found.label;
  
  // Fallback: Convert snake_case to Title Case
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get category options formatted for select components
 * @returns Array of category options with value and label
 */
export const getCategoryOptions = () => {
  return BUSINESS_CATEGORIES.map(cat => ({
    value: cat.value,
    label: cat.label
  }));
};
