import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique filename using UUID to prevent collisions
 * when multiple users upload files with the same name.
 */
export const generateUniqueFileName = (originalFileName: string, userId?: string): string => {
  const fileExt = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
  const uuid = uuidv4();
  
  // If userId provided, organize by user folder
  if (userId) {
    return `${userId}/${uuid}.${fileExt}`;
  }
  
  return `${uuid}.${fileExt}`;
};

/**
 * Generates a unique filename with category prefix
 */
export const generateCategorizedFileName = (
  originalFileName: string, 
  category: string,
  userId?: string
): string => {
  const fileExt = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
  const uuid = uuidv4();
  
  if (userId) {
    return `${category}/${userId}/${uuid}.${fileExt}`;
  }
  
  return `${category}/${uuid}.${fileExt}`;
};

/**
 * Extract file extension from a filename
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || 'bin';
};
