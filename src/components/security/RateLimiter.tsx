import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from '@/lib/icons';

interface RateLimiterProps {
  action: string;
  maxAttempts: number;
  timeWindow: number; // in minutes
  children: (isLimited: boolean, attemptsLeft: number, timeLeft: number) => React.ReactNode;
}

interface AttemptRecord {
  count: number;
  lastAttempt: number;
}

export const RateLimiter: React.FC<RateLimiterProps> = ({
  action,
  maxAttempts,
  timeWindow,
  children
}) => {
  const [attempts, setAttempts] = useState<AttemptRecord>({ count: 0, lastAttempt: 0 });
  const [isLimited, setIsLimited] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const storageKey = `rateLimit_${action}`;

  useEffect(() => {
    // Load attempts from native storage
    const loadData = async () => {
      const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
      const { getItem, removeItem } = useNativeStorage();
      const stored = await getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AttemptRecord;
          const now = Date.now();
          const windowMs = timeWindow * 60 * 1000;
          
          if (now - parsed.lastAttempt < windowMs) {
            setAttempts(parsed);
            if (parsed.count >= maxAttempts) {
              setIsLimited(true);
              setTimeLeft(Math.ceil((windowMs - (now - parsed.lastAttempt)) / 1000));
            }
          } else {
            // Reset if time window has passed
            await removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error parsing rate limit data:', error);
          await removeItem(storageKey);
        }
      }
    };
    loadData();
  }, [action, maxAttempts, timeWindow, storageKey]);

  useEffect(() => {
    // Countdown timer
    if (isLimited && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
      if (prev <= 1) {
        setIsLimited(false);
        setAttempts({ count: 0, lastAttempt: 0 });
        (async () => {
          const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
          const { removeItem } = useNativeStorage();
          await removeItem(storageKey);
        })();
        return 0;
      }
      return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLimited, timeLeft, storageKey]);

  const recordAttempt = async () => {
    const now = Date.now();
    const windowMs = timeWindow * 60 * 1000;
    
    const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
    const { setItem } = useNativeStorage();
    
    // Reset if time window has passed
    if (now - attempts.lastAttempt > windowMs) {
      const newAttempts = { count: 1, lastAttempt: now };
      setAttempts(newAttempts);
      await setItem(storageKey, JSON.stringify(newAttempts));
      return;
    }

    // Increment attempts
    const newAttempts = { count: attempts.count + 1, lastAttempt: now };
    setAttempts(newAttempts);
    await setItem(storageKey, JSON.stringify(newAttempts));

    // Check if limit exceeded
    if (newAttempts.count >= maxAttempts) {
      setIsLimited(true);
      setTimeLeft(Math.ceil(windowMs / 1000));
    }
  };

  const attemptsLeft = Math.max(0, maxAttempts - attempts.count);

  // Create context to expose recordAttempt function
  const contextValue = React.useMemo(() => ({ recordAttempt }), []);
  
  return (
    <div>
      {isLimited && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Too many failed attempts. Please try again in {Math.ceil(timeLeft / 60)} minutes.
          </AlertDescription>
        </Alert>
      )}
      
      {children(isLimited, attemptsLeft, timeLeft)}
    </div>
  );
};