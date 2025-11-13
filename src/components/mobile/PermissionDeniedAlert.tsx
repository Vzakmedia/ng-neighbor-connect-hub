import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from '@/lib/icons';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

interface PermissionDeniedAlertProps {
  permissionType: 'location' | 'camera';
  feature: string;
}

const PermissionDeniedAlert = ({ permissionType, feature }: PermissionDeniedAlertProps) => {
  const { openAppSettings, isNative } = useNativePermissions();

  const messages = {
    location: `To use ${feature}, please enable location access in your ${isNative ? 'device' : 'browser'} settings.`,
    camera: `To use ${feature}, please enable camera and photo access in your ${isNative ? 'device' : 'browser'} settings.`
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-orange-800 flex-1">
          {messages[permissionType]}
        </span>
        {isNative && (
          <Button
            onClick={openAppSettings}
            variant="outline"
            size="sm"
            className="ml-3 flex-shrink-0"
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default PermissionDeniedAlert;
