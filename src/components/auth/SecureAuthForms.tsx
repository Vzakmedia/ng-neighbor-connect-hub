import React, { useState } from 'react';
import { validateEmail, validatePhoneNumber, sanitizeText } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface SecureInputProps {
  type: 'email' | 'phone' | 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  maxLength = 255,
  className = ''
}) => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setError(null);

    // Length validation
    if (inputValue.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`);
      return;
    }

    // Type-specific validation
    if (type === 'email' && inputValue && !validateEmail(inputValue)) {
      setError('Please enter a valid email address');
    } else if (type === 'phone' && inputValue && !validatePhoneNumber(inputValue)) {
      setError('Please enter a valid phone number');
    }

    // Sanitize text inputs
    const sanitizedValue = type === 'text' ? sanitizeText(inputValue) : inputValue;
    onChange(sanitizedValue);
  };

  return (
    <div className="space-y-1">
      <input
        type={type === 'phone' ? 'tel' : type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className} ${
          error ? 'border-destructive' : ''
        }`}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

// Enhanced password strength validation with stronger requirements
export const validatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  // Minimum 12 characters (increased from 8)
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

  // Enhanced common password check
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty', 'letmein', 'welcome', 'login', 'abc123'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Check for repeating characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeating characters');
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|123|234|345|456|789)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters');
  }

  // Bonus for very long passwords
  if (password.length >= 16) score += 1;

  return { score: Math.min(score, 5), feedback };
};