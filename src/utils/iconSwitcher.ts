import { ComponentType } from 'react';

/**
 * Utility to conditionally return outlined or solid icon variant.
 * Used for mobile-only filled icon pattern in active states.
 * 
 * @param outlinedIcon - The outlined/default icon component
 * @param solidIcon - The filled/solid icon variant
 * @param isActive - Whether the element is in active state
 * @param shouldUseFilledIcons - Platform flag (mobile/native only)
 * @returns The appropriate icon component to render
 */
export const getActiveIcon = (
  outlinedIcon: ComponentType<any>,
  solidIcon: ComponentType<any>,
  isActive: boolean,
  shouldUseFilledIcons: boolean
): ComponentType<any> => {
  // Only use solid icons on mobile/native when active
  if (isActive && shouldUseFilledIcons) {
    return solidIcon;
  }
  return outlinedIcon;
};
