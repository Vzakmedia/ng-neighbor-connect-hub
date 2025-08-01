// Validation utilities extracted from security.ts for better organization

export const validation = {
  // Basic validation functions
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  phoneNumber: (phone: string): boolean => {
    // Allow international formats and Nigerian format
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$|^\+\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  location: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  fileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  fileSize: (file: File, maxSizeBytes: number): boolean => {
    return file.size <= maxSizeBytes;
  },

  // Complex validation functions
  imageFile: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validation.fileType(file, allowedTypes)) {
      return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
    }
    
    if (!validation.fileSize(file, maxSize)) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    return { valid: true };
  },

  emergencyLocation: (location: { lat: number; lng: number; address?: string }) => {
    if (!validation.location(location.lat, location.lng)) {
      throw new Error('Invalid coordinates provided');
    }
    
    if (location.address && location.address.length > 500) {
      throw new Error('Address too long');
    }
    
    return true;
  },

  // Enhanced password strength validation
  passwordStrength: (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    // Minimum 14 characters for enhanced security
    if (password.length >= 14) score += 1;
    else feedback.push('At least 14 characters required for optimal security');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Include special characters (!@#$%^&*)');

    // Comprehensive common password dictionary with Nigerian context
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty', 'letmein', 
      'welcome', 'login', 'abc123', 'password1', '123456789', 'qwerty123',
      'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'user',
      'nigeria', 'lagos', 'abuja', 'naira', 'football', 'soccer'
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

    // Check for personal information patterns
    if (/(?:name|email|phone|birth|date)/i.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid using personal information in passwords');
    }

    // Bonus scoring for exceptional security
    if (password.length >= 16) score += 1; // Very long password
    if (password.length >= 20) score += 1; // Extremely long password
    if (/[^\w\s!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Unicode/extended characters

    return { score: Math.min(score, 6), feedback };
  },
};

// Content sanitization functions
export const sanitization = {
  text: (text: string): string => {
    if (!text) return '';
    
    // Remove script tags and dangerous content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .substring(0, 10000); // Limit length
  },

  html: (html: string): string => {
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
  },
};

// Utility functions
export const obfuscatePhoneNumber = (phone: string): string => {
  if (phone.length < 4) return phone;
  const visible = phone.slice(-4);
  const hidden = '*'.repeat(phone.length - 4);
  return hidden + visible;
};