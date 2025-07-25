// Security-related constants

export const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TEXT_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TITLE_LENGTH: 200,
  MAX_ADDRESS_LENGTH: 500,
  PANIC_BUTTON_RATE_LIMIT: 3, // per hour
  RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'text/plain'],
} as const;

export const CSP_DIRECTIVES = {
  DEFAULT_SRC: "'self'",
  SCRIPT_SRC: "'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com",
  STYLE_SRC: "'self' 'unsafe-inline' *.googleapis.com",
  IMG_SRC: "'self' data: blob: *.supabase.co *.googleapis.com *.gstatic.com",
  CONNECT_SRC: "'self' *.supabase.co *.googleapis.com",
  FRAME_SRC: "'self' *.google.com",
} as const;