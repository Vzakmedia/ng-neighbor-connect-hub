import { useEffect } from 'react';
import { CSP_DIRECTIVES } from '@/utils/constants';

export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set security headers for the application
    const setSecurityHeaders = () => {
      // Content Security Policy
      const cspContent = Object.entries(CSP_DIRECTIVES)
        .map(([key, value]) => `${key.replace(/_/g, '-').toLowerCase()} ${value}`)
        .join('; ');

      // Create meta tags for security headers
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = cspContent;
      document.head.appendChild(meta);

      // X-Content-Type-Options
      const xContentType = document.createElement('meta');
      xContentType.httpEquiv = 'X-Content-Type-Options';
      xContentType.content = 'nosniff';
      document.head.appendChild(xContentType);

      // X-Frame-Options
      const xFrame = document.createElement('meta');
      xFrame.httpEquiv = 'X-Frame-Options';
      xFrame.content = 'DENY';
      document.head.appendChild(xFrame);

      // X-XSS-Protection
      const xXSS = document.createElement('meta');
      xXSS.httpEquiv = 'X-XSS-Protection';
      xXSS.content = '1; mode=block';
      document.head.appendChild(xXSS);

      // Referrer Policy
      const referrer = document.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrer);
    };

    setSecurityHeaders();

    // Cleanup function to remove headers when component unmounts
    return () => {
      const metas = document.querySelectorAll('meta[http-equiv^="Content-Security-Policy"], meta[http-equiv^="X-"], meta[name="referrer"]');
      metas.forEach(meta => meta.remove());
    };
  }, []);

  return null;
};