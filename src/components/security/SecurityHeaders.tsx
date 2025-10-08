import { useEffect } from 'react';

export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Detect iOS to skip security headers that cause issues
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      console.log('iOS detected: Skipping strict security headers to prevent compatibility issues');
      return;
    }

    // Set basic security headers for non-iOS devices
    const setSecurityHeaders = () => {
      // Remove any existing security headers first
      const existingHeaders = document.querySelectorAll('meta[http-equiv^="Content-Security-Policy"], meta[http-equiv^="X-"], meta[name="referrer"]');
      existingHeaders.forEach(header => header.remove());

      // X-Content-Type-Options - Prevent MIME sniffing
      const xContentType = document.createElement('meta');
      xContentType.httpEquiv = 'X-Content-Type-Options';
      xContentType.content = 'nosniff';
      document.head.appendChild(xContentType);

      // Referrer Policy - Control referrer information
      const referrer = document.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrer);
    };

    setSecurityHeaders();

    // Cleanup function to remove headers when component unmounts
    return () => {
      const metas = document.querySelectorAll('meta[http-equiv^="X-"], meta[name="referrer"]');
      metas.forEach(meta => meta.remove());
    };
  }, []);

  return null;
};