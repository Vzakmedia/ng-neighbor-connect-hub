import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, AlertTriangle } from '@/lib/icons';

interface PermissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionType: 'location' | 'camera' | 'notifications' | 'contacts';
  onAllow: () => void;
  onDeny: () => void;
  showSettingsButton?: boolean;
  isIOSAlwaysLocation?: boolean;
}

const PermissionRequestDialog = ({
  open,
  onOpenChange,
  permissionType,
  onAllow,
  onDeny,
  showSettingsButton = false,
  isIOSAlwaysLocation = false
}: PermissionRequestDialogProps) => {
  const permissionConfig = {
    location: {
      icon: MapPin,
      title: isIOSAlwaysLocation ? 'Background Location Access' : 'Location Access',
      description: isIOSAlwaysLocation 
        ? 'For emergency alerts to work even when the app is closed, please select "Always" when prompted.'
        : 'NeighborLink needs access to your location to show nearby posts, services, and emergency alerts in your area.',
      features: isIOSAlwaysLocation ? [
        'Receive emergency alerts in the background',
        'Get safety notifications when near incidents',
        'Enable panic button with automatic location sharing',
        'Background location is battery-optimized'
      ] : [
        'View posts and events near you',
        'Get emergency alerts in your neighborhood',
        'Find local services and marketplace items',
        'Share your location when needed'
      ],
      iosTip: isIOSAlwaysLocation 
        ? 'On the next screen, tap "Allow While Using App" or "Always" for best experience.'
        : 'On the next screen, tap "Allow While Using App" to enable location features.'
    },
    camera: {
      icon: Camera,
      title: 'Camera & Photos',
      description: 'NeighborLink needs access to your camera and photos to let you share images with your community.',
      features: [
        'Take photos for posts and listings',
        'Upload profile pictures',
        'Share event photos',
        'Add images to marketplace items'
      ],
      iosTip: 'On the next screen, tap "OK" to grant camera access.'
    },
    notifications: {
      icon: AlertTriangle,
      title: 'Notifications',
      description: 'Enable notifications to receive important safety alerts and community updates.',
      features: [
        'Emergency and safety alerts',
        'Message notifications',
        'Community post updates',
        'Service booking reminders'
      ],
      iosTip: 'On the next screen, tap "Allow" to enable notifications.'
    },
    contacts: {
      icon: Camera,
      title: 'Contacts Access',
      description: 'Access your contacts to easily add emergency contacts and connect with neighbors.',
      features: [
        'Add emergency contacts quickly',
        'Find neighbors already on the platform',
        'Share safety information with trusted contacts',
        'Invite friends to join'
      ],
      iosTip: 'On the next screen, tap "OK" to grant contacts access.'
    }
  };

  const config = permissionConfig[permissionType];
  const Icon = config.icon;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleOpenSettings = async () => {
    const { openAppSettings } = await import('@/utils/iosSettingsHelper');
    await openAppSettings();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm font-medium">This allows you to:</p>
          <ul className="space-y-2">
            {config.features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {isIOS && config.iosTip && (
          <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground">
              <strong>iOS Tip:</strong> {config.iosTip}
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            We respect your privacy. Your {permissionType} data is only used for the features above and is never shared without your permission.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {showSettingsButton ? (
            <>
              <Button onClick={handleOpenSettings} className="w-full">
                Open Settings
              </Button>
              <Button onClick={onDeny} variant="outline" className="w-full">
                Maybe Later
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onAllow} className="w-full">
                Allow
              </Button>
              <Button onClick={onDeny} variant="outline" className="w-full">
                Not Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionRequestDialog;
