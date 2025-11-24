// Security-related constants

export const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB for videos
  MAX_VIDEO_SIZE: 200 * 1024 * 1024, // 200MB
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB for images
  MAX_TEXT_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TITLE_LENGTH: 200,
  MAX_ADDRESS_LENGTH: 500,
  PANIC_BUTTON_RATE_LIMIT: 3, // per hour
  RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEOS: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  DOCUMENTS: ['application/pdf', 'text/plain'],
} as const;

export const CSP_DIRECTIVES = {
  DEFAULT_SRC: "'self'",
  SCRIPT_SRC: "'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com",
  STYLE_SRC: "'self' 'unsafe-inline' *.googleapis.com",
  IMG_SRC: "'self' data: blob: *.supabase.co *.cloudinary.com *.googleapis.com *.gstatic.com",
  MEDIA_SRC: "'self' blob: *.cloudinary.com",
  CONNECT_SRC: "'self' *.supabase.co *.cloudinary.com *.googleapis.com",
  FRAME_SRC: "'self' *.google.com",
} as const;
