import React from 'react';
import { sanitizeText, validateEmail, validatePhoneNumber } from '@/utils/security';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecureInputValidatorProps {
  value: string;
  type: 'text' | 'email' | 'phone' | 'textarea';
  maxLength?: number;
  onValidationChange?: (isValid: boolean, sanitizedValue?: string) => void;
  children?: React.ReactNode;
}

export const SecureInputValidator: React.FC<SecureInputValidatorProps> = ({
  value,
  type,
  maxLength = 10000,
  onValidationChange,
  children
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [sanitizedValue, setSanitizedValue] = React.useState<string>('');

  React.useEffect(() => {
    const validationErrors: string[] = [];
    let sanitized = value;

    // Sanitize input
    if (type === 'text' || type === 'textarea') {
      sanitized = sanitizeText(value);
    }

    // Length validation
    if (value.length > maxLength) {
      validationErrors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Type-specific validation
    if (type === 'email' && value.length > 0 && !validateEmail(value)) {
      validationErrors.push('Please enter a valid email address');
    }

    if (type === 'phone' && value.length > 0 && !validatePhoneNumber(value)) {
      validationErrors.push('Please enter a valid phone number');
    }

    // Check for malicious patterns
    if (/<script|javascript:|on\w+\s*=/i.test(value)) {
      validationErrors.push('Input contains potentially malicious content');
    }

    setErrors(validationErrors);
    setSanitizedValue(sanitized);
    
    const isValid = validationErrors.length === 0;
    onValidationChange?.(isValid, isValid ? sanitized : undefined);
  }, [value, type, maxLength, onValidationChange]);

  return (
    <div className="space-y-2">
      {children}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};