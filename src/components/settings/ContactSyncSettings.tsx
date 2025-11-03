import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNativeContacts } from '@/hooks/mobile/useNativeContacts';
import { Users, Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ContactSyncSettings = () => {
  const { 
    isNative, 
    hasPermission, 
    isLoading,
    requestPermission,
    checkPermission,
  } = useNativeContacts();

  if (!isNative) {
    return null;
  }

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleCheckPermission = async () => {
    await checkPermission();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Contact Sync</CardTitle>
        </div>
        <CardDescription>
          Find friends from your contacts who are also on Neighborlink
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-base font-medium">Contact Access</p>
              {hasPermission ? (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Granted
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <X className="h-3 w-3" />
                  Not Granted
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Allow access to find friends faster
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {!hasPermission ? (
            <Button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Grant Contact Access'
              )}
            </Button>
          ) : (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Contact Sync Enabled</p>
              <p className="text-xs text-muted-foreground">
                You can now find friends from your contacts in the User Directory.
                Your contact information is processed securely and never shared.
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Use the "Find Friends from Contacts" button in the User Directory
            to discover which of your contacts are on Neighborlink.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
