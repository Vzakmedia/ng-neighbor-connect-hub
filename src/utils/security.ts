// Security utilities for input validation and sanitization

// Rate limiting for panic button (max 3 per hour)
export const checkPanicButtonRateLimit = async (userId: string): Promise<boolean> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('panic_button_rate_limit')
    .select('panic_count')
    .eq('user_id', userId)
    .gte('last_panic_at', oneHourAgo.toISOString())
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking rate limit:', error);
    return false;
  }
  
  return !data || data.panic_count < 3;
};

export const updatePanicButtonRateLimit = async (userId: string): Promise<void> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const { data: existing, error: selectError } = await supabase
    .from('panic_button_rate_limit')
    .select('id, panic_count')
    .eq('user_id', userId)
    .gte('last_panic_at', oneHourAgo.toISOString())
    .single();
    
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error fetching rate limit:', selectError);
    return;
  }
  
  if (existing) {
    await supabase
      .from('panic_button_rate_limit')
      .update({
        panic_count: existing.panic_count + 1,
        last_panic_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('panic_button_rate_limit')
      .insert({
        user_id: userId,
        panic_count: 1,
        last_panic_at: new Date().toISOString()
      });
  }
};

// Re-export validation functions for backward compatibility
import { validation, sanitization, obfuscatePhoneNumber as obfuscatePhone } from '@/utils/validation';

export { validation, sanitization };
export const obfuscatePhoneNumber = obfuscatePhone;

// Backward compatibility exports
export const validatePhoneNumber = (phone: string): boolean => validation.phoneNumber(phone);
export const validateEmail = (email: string): boolean => validation.email(email);
export const validateLocation = (lat: number, lng: number): boolean => validation.location(lat, lng);
export const validateFileType = (file: File, allowedTypes: string[]): boolean => validation.fileType(file, allowedTypes);
export const validateFileSize = (file: File, maxSizeBytes: number): boolean => validation.fileSize(file, maxSizeBytes);
export const validateImageFile = (file: File) => validation.imageFile(file);
export const validatePasswordStrength = (password: string) => validation.passwordStrength(password);
export const validateEmergencyLocation = (location: any) => validation.emergencyLocation(location);
export const sanitizeText = (text: string): string => sanitization.text(text);
export const sanitizeHtml = (html: string): string => sanitization.html(html);

// Content Security Policy headers (for future implementation)
export const getCSPHeaders = () => ({
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com;
    style-src 'self' 'unsafe-inline' *.googleapis.com;
    img-src 'self' data: blob: *.supabase.co *.googleapis.com *.gstatic.com;
    connect-src 'self' *.supabase.co *.googleapis.com;
    frame-src 'self' *.google.com;
  `.replace(/\s+/g, ' ').trim()
});