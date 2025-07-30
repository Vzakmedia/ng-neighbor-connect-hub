import { useEffect } from 'react';
import { CSP_DIRECTIVES } from '@/utils/constants';

export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set comprehensive security headers for the application
    const setSecurityHeaders = () => {
      // Remove any existing security headers first
      const existingHeaders = document.querySelectorAll('meta[http-equiv^="Content-Security-Policy"], meta[http-equiv^="X-"], meta[name="referrer"]');
      existingHeaders.forEach(header => header.remove());

      // Content Security Policy - Enhanced
      const cspContent = Object.entries(CSP_DIRECTIVES)
        .map(([key, value]) => `${key.replace(/_/g, '-').toLowerCase()} ${value}`)
        .join('; ');

      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = cspContent;
      document.head.appendChild(meta);

      // X-Content-Type-Options - Prevent MIME sniffing
      const xContentType = document.createElement('meta');
      xContentType.httpEquiv = 'X-Content-Type-Options';
      xContentType.content = 'nosniff';
      document.head.appendChild(xContentType);

      // X-Frame-Options - Prevent clickjacking
      const xFrame = document.createElement('meta');
      xFrame.httpEquiv = 'X-Frame-Options';
      xFrame.content = 'DENY';
      document.head.appendChild(xFrame);

      // X-XSS-Protection - Enable XSS filtering
      const xXSS = document.createElement('meta');
      xXSS.httpEquiv = 'X-XSS-Protection';
      xXSS.content = '1; mode=block';
      document.head.appendChild(xXSS);

      // Referrer Policy - Control referrer information
      const referrer = document.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrer);

      // Permissions Policy - Restrict browser features
      const permissions = document.createElement('meta');
      permissions.httpEquiv = 'Permissions-Policy';
      permissions.content = 'camera=(), microphone=(), geolocation=self, payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()';
      document.head.appendChild(permissions);

      // Strict Transport Security (if served over HTTPS)
      if (window.location.protocol === 'https:') {
        const hsts = document.createElement('meta');
        hsts.httpEquiv = 'Strict-Transport-Security';
        hsts.content = 'max-age=31536000; includeSubDomains; preload';
        document.head.appendChild(hsts);
      }
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