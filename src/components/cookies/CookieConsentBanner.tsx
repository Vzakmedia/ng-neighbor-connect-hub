import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CookiePreferenceCenter } from './CookiePreferenceCenter';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const CookieConsentBanner = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const { 
    showBanner, 
    preferences, 
    acceptAll, 
    rejectAll, 
    savePreferences,
    hasConsented 
  } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <Card className="max-w-4xl mx-auto shadow-2xl border-border/50 bg-background/95 backdrop-blur-lg">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Icon and Text */}
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">We Value Your Privacy</h3>
                      <p className="text-sm text-muted-foreground">
                        We use cookies to enhance your browsing experience, provide personalized content, 
                        and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                        You can manage your preferences or learn more in our{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 md:flex-col lg:flex-row md:items-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreferences(true)}
                      className="w-full sm:w-auto"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rejectAll}
                      className="w-full sm:w-auto"
                    >
                      Reject All
                    </Button>
                    <Button
                      size="sm"
                      onClick={acceptAll}
                      className="w-full sm:w-auto"
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <CookiePreferenceCenter
        open={showPreferences}
        onOpenChange={setShowPreferences}
        currentPreferences={preferences}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    </>
  );
};

// Floating button to access cookie settings (shown after consent)
export const CookieSettingsButton = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const { hasConsented, preferences, acceptAll, rejectAll, savePreferences } = useCookieConsent();

  if (!hasConsented) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPreferences(true)}
        className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-muted hover:bg-muted/80 border shadow-lg flex items-center justify-center transition-colors"
        aria-label="Cookie Settings"
      >
        <Cookie className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      <CookiePreferenceCenter
        open={showPreferences}
        onOpenChange={setShowPreferences}
        currentPreferences={preferences}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    </>
  );
};
