import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from '@/lib/icons';
import { isPrivateBrowsing } from '@/utils/iosAuthHelper';
import { Capacitor } from '@capacitor/core';

/**
 * Warning component for iOS Safari private browsing mode
 * Displays when localStorage is unavailable
 */
export const PrivateBrowsingWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Only check on web iOS (not native app)
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const checkPrivateBrowsing = async () => {
      const isPrivate = await isPrivateBrowsing();
      setShowWarning(isPrivate);
    };

    checkPrivateBrowsing();
  }, []);

  if (!showWarning) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Private Browsing Detected</AlertTitle>
      <AlertDescription>
        You're using Safari in Private Browsing mode. Some features may not work properly.
        Please disable Private Browsing for the best experience.
        <div className="mt-2 text-xs">
          Settings → Safari → Private Browsing (turn off)
        </div>
      </AlertDescription>
    </Alert>
  );
};
