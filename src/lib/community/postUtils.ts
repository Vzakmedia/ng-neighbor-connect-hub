import { PostType } from '@/types/community';
import { AlertTriangle, ShoppingCart, Users, Calendar } from 'lucide-react';

/**
 * Get icon component for post type
 */
export function getPostTypeIcon(type: PostType | string) {
  switch (type) {
    case 'safety':
      return AlertTriangle;
    case 'marketplace':
      return ShoppingCart;
    case 'help':
      return Users;
    case 'event':
      return Calendar;
    default:
      return Users;
  }
}

/**
 * Get badge configuration for post type
 */
export function getPostTypeBadge(type: PostType | string) {
  const badges = {
    safety: { label: 'Safety Alert', variant: 'destructive' as const, color: 'text-destructive' },
    marketplace: { label: 'For Sale', variant: 'secondary' as const, color: 'text-community-green' },
    help: { label: 'Need Help', variant: 'outline' as const, color: 'text-community-blue' },
    event: { label: 'Event', variant: 'default' as const, color: 'text-community-yellow' },
    general: { label: 'General', variant: 'outline' as const, color: 'text-muted-foreground' },
  };
  
  return badges[type as keyof typeof badges] || badges.general;
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, maxLength: number): { text: string; isTruncated: boolean } {
  if (text.length <= maxLength) {
    return { text, isTruncated: false };
  }
  
  return {
    text: text.substring(0, maxLength),
    isTruncated: true,
  };
}
