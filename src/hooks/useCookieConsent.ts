import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

export interface CookieConsentState {
  hasConsented: boolean;
  preferences: CookiePreferences;
  consentDate: string | null;
}

const COOKIE_CONSENT_KEY = 'neighborlink_cookie_consent';

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

export const useCookieConsent = () => {
  const [consentState, setConsentState] = useState<CookieConsentState>({
    hasConsented: false,
    preferences: defaultPreferences,
    consentDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookieConsentState;
        setConsentState(parsed);
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error);
    }
    setIsLoading(false);
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((preferences: CookiePreferences) => {
    const newState: CookieConsentState = {
      hasConsented: true,
      preferences: { ...preferences, essential: true }, // Essential always true
      consentDate: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newState));
      setConsentState(newState);
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
  }, [saveConsent]);

  // Reject all non-essential cookies
  const rejectAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  }, [saveConsent]);

  // Save custom preferences
  const savePreferences = useCallback((preferences: Partial<CookiePreferences>) => {
    saveConsent({
      ...consentState.preferences,
      ...preferences,
      essential: true,
    });
  }, [saveConsent, consentState.preferences]);

  // Reset consent (for testing or preference changes)
  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setConsentState({
        hasConsented: false,
        preferences: defaultPreferences,
        consentDate: null,
      });
    } catch (error) {
      console.error('Error resetting cookie consent:', error);
    }
  }, []);

  // Check if a specific cookie type is allowed
  const isAllowed = useCallback((type: keyof CookiePreferences): boolean => {
    if (type === 'essential') return true;
    return consentState.hasConsented && consentState.preferences[type];
  }, [consentState]);

  return {
    ...consentState,
    isLoading,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    isAllowed,
    showBanner: !isLoading && !consentState.hasConsented,
  };
};
