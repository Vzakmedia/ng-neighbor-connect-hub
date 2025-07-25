import React, { ReactNode } from 'react';
import { sanitizeText } from '@/utils/security';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({ children, onSubmit, className }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize all form inputs
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Sanitize text inputs
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
        if (input && input.type === 'text' || input?.type === 'textarea') {
          input.value = sanitizeText(value);
        }
      }
    }
    
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
};