import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cookie, Shield, BarChart3, Settings, Megaphone, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

interface CookiePreferenceCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreferences: CookiePreferences;
  onSave: (preferences: CookiePreferences) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

interface CookieCategory {
  id: keyof CookiePreferences;
  name: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  examples: string[];
}

const cookieCategories: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to your actions, such as logging in or filling out forms.',
    icon: Lock,
    required: true,
    examples: ['Authentication tokens', 'Session management', 'Security features', 'Language preferences'],
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
    icon: Settings,
    required: false,
    examples: ['Theme preferences', 'Notification settings', 'UI customizations', 'Recently viewed items'],
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    icon: BarChart3,
    required: false,
    examples: ['Page views', 'Feature usage', 'Performance metrics', 'Error tracking'],
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'These cookies may be set by our partners to build a profile of your interests and show you relevant content or advertisements.',
    icon: Megaphone,
    required: false,
    examples: ['Personalized recommendations', 'Social media features', 'Referral tracking'],
  },
];

export const CookiePreferenceCenter = ({
  open,
  onOpenChange,
  currentPreferences,
  onSave,
  onAcceptAll,
  onRejectAll,
}: CookiePreferenceCenterProps) => {
  const [preferences, setPreferences] = useState<CookiePreferences>(currentPreferences);

  useEffect(() => {
    setPreferences(currentPreferences);
  }, [currentPreferences]);

  const handleToggle = (id: keyof CookiePreferences) => {
    if (id === 'essential') return; // Cannot toggle essential
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    onAcceptAll();
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    onRejectAll();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Cookie Preferences</DialogTitle>
              <DialogDescription>
                Manage your cookie settings for NeighborLink
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-6 pb-4">
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
              You can choose which categories of cookies you want to allow. For more information, please 
              read our{' '}
              <Link to="/privacy" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>
                Privacy Policy
              </Link>.
            </p>

            <Separator />

            {cookieCategories.map((category) => {
              const Icon = category.icon;
              const isEnabled = preferences[category.id];
              
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={category.id} className="font-semibold cursor-pointer">
                            {category.name}
                          </Label>
                          {category.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {category.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {category.examples.map((example, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-normal">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Switch
                      id={category.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(category.id)}
                      disabled={category.required}
                      className="flex-shrink-0"
                    />
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 flex-col sm:flex-row gap-2 bg-muted/30">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRejectAll} className="flex-1 sm:flex-none">
              Reject All
            </Button>
            <Button variant="outline" onClick={handleAcceptAll} className="flex-1 sm:flex-none">
              Accept All
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Shield className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
