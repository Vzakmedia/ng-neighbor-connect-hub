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

// Input validation functions
export const validatePhoneNumber = (phone: string): boolean => {
  // Allow international formats and Nigerian format
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$|^\+\d{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateLocation = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Content sanitization
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove script tags and dangerous content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 10000); // Limit length
};

export const sanitizeHtml = (html: string): string => {
  const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br'];
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove all script elements
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove dangerous attributes
  const allElements = div.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
    
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(...el.childNodes);
    }
  });
  
  return div.innerHTML;
};

// File validation
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validateFileType(file, allowedTypes)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }
  
  if (!validateFileSize(file, maxSize)) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
};

// Emergency contact encryption (simple obfuscation for demo - use proper encryption in production)
export const obfuscatePhoneNumber = (phone: string): string => {
  if (phone.length < 4) return phone;
  const visible = phone.slice(-4);
  const hidden = '*'.repeat(phone.length - 4);
  return hidden + visible;
};

// Location data validation
export const validateEmergencyLocation = (location: { lat: number; lng: number; address?: string }) => {
  if (!validateLocation(location.lat, location.lng)) {
    throw new Error('Invalid coordinates provided');
  }
  
  if (location.address && location.address.length > 500) {
    throw new Error('Address too long');
  }
  
  return true;
};

// Enhanced password strength validation with enterprise-grade security
export const validatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  // Minimum 12 characters for better security
  if (password.length >= 12) score += 1;
  else feedback.push('At least 12 characters required');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Include special characters (!@#$%^&*)');

  // Comprehensive common password dictionary
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty', 'letmein', 
    'welcome', 'login', 'abc123', 'password1', '123456789', 'qwerty123',
    'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'user'
  ];
  
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords and dictionary words');
  }

  // Check for character repetition (security weakness)
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeating characters (aaa, 111, etc.)');
  }

  // Check for sequential patterns (security weakness)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|123|234|345|456|567|678|789|890)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters (abc, 123, etc.)');
  }

  // Check for keyboard patterns
  if (/(?:qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid keyboard patterns (qwerty, asdf, etc.)');
  }

  // Bonus scoring for exceptional security
  if (password.length >= 16) score += 1; // Very long password
  if (password.length >= 20) score += 1; // Extremely long password
  if (/[^\w\s!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Unicode/extended characters

  return { score: Math.min(score, 5), feedback };
};

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