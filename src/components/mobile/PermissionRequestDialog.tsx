import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, AlertTriangle } from 'lucide-react';

interface PermissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionType: 'location' | 'camera';
  onAllow: () => void;
  onDeny: () => void;
}

const PermissionRequestDialog = ({
  open,
  onOpenChange,
  permissionType,
  onAllow,
  onDeny
}: PermissionRequestDialogProps) => {
  const permissionConfig = {
    location: {
      icon: MapPin,
      title: 'Location Access',
      description: 'NeighborLink needs access to your location to show nearby posts, services, and emergency alerts in your area.',
      features: [
        'View posts and events near you',
        'Get emergency alerts in your neighborhood',
        'Find local services and marketplace items',
        'Share your location when needed'
      ]
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
      ]
    }
  };

  const config = permissionConfig[permissionType];
  const Icon = config.icon;

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

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            We respect your privacy. Your {permissionType} data is only used for the features above and is never shared without your permission.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onAllow} className="w-full">
            Allow
          </Button>
          <Button onClick={onDeny} variant="outline" className="w-full">
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionRequestDialog;
