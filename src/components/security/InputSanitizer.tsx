import React from 'react';
import { sanitizeText, sanitizeHtml } from '@/utils/security';

interface InputSanitizerProps {
  children: React.ReactNode;
  mode?: 'text' | 'html';
  maxLength?: number;
}

export const InputSanitizer: React.FC<InputSanitizerProps> = ({ 
  children, 
  mode = 'text',
  maxLength = 10000 
}) => {
  const sanitizeContent = (content: string): string => {
    if (mode === 'html') {
      return sanitizeHtml(content);
    }
    return sanitizeText(content);
  };

  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        const truncated = child.length > maxLength ? child.slice(0, maxLength) + '...' : child;
        return sanitizeContent(truncated);
      }
      
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          ...child.props,
          children: processChildren(child.props.children)
        });
      }
      
      return child;
    });
  };

  return <>{processChildren(children)}</>;
};