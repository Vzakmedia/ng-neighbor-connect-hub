import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Settings, Smartphone } from '@/lib/icons';
import { detectIOSDevice, getSafeStorage } from '@/utils/iosCompatibility';
import { openAppSettings, isIOS } from '@/utils/iosSettingsHelper';
import { useToast } from '@/hooks/use-toast';
import { testNotificationSound } from '@/utils/testNotificationSounds';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

interface PermissionStatus {
  name: string;
  status: 'granted' | 'denied' | 'prompt' | 'unavailable';
  details?: string;
}

const IOSDiagnostics = () => {
  const { toast } = useToast();
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [iosInfo, setIosInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<PermissionStatus[]>([]);
  const [storageStatus, setStorageStatus] = useState<string>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setIsRefreshing(true);

    // Get device info
    try {
      if (isNativePlatform()) {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        setDeviceInfo(info);
      }
    } catch (error) {
      console.error('Error getting device info:', error);
    }

    // Get iOS-specific info
    const iosDetection = detectIOSDevice();
    setIosInfo(iosDetection);

    // Check storage
    checkStorage();

    // Check permissions
    await checkPermissions();

    setIsRefreshing(false);
  };

  const checkStorage = () => {
    try {
      const storage = getSafeStorage();
      const testKey = '__test_storage__';
      storage.setItem(testKey, 'test');
      const value = storage.getItem(testKey);
      storage.removeItem(testKey);
      
      if (value === 'test') {
        setStorageStatus(iosInfo?.isPrivateBrowsing ? 'private' : 'available');
      } else {
        setStorageStatus('limited');
      }
    } catch (error) {
      setStorageStatus('unavailable');
    }
  };

  const checkPermissions = async () => {
    const permissionList: PermissionStatus[] = [];

    // Check camera permission
    try {
      const { Camera } = await import('@capacitor/camera');
      const result = await Camera.checkPermissions();
      permissionList.push({
        name: 'Camera',
        status: result.camera === 'granted' ? 'granted' : 
                result.camera === 'denied' ? 'denied' : 'prompt',
        details: result.camera
      });
    } catch (error) {
      permissionList.push({ name: 'Camera', status: 'unavailable' });
    }

    // Check location permission
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const result = await Geolocation.checkPermissions();
      permissionList.push({
        name: 'Location',
        status: result.location === 'granted' ? 'granted' :
                result.location === 'denied' ? 'denied' : 'prompt',
        details: result.location
      });
    } catch (error) {
      permissionList.push({ name: 'Location', status: 'unavailable' });
    }

    // Check notification permission
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.checkPermissions();
      permissionList.push({
        name: 'Notifications',
        status: result.display === 'granted' ? 'granted' :
                result.display === 'denied' ? 'denied' : 'prompt',
        details: result.display
      });
    } catch (error) {
      permissionList.push({ name: 'Notifications', status: 'unavailable' });
    }

    setPermissions(permissionList);
  };

  const handleClearStorage = async () => {
    try {
      const storage = getSafeStorage();
      storage.clear();
      
      toast({
        title: "Storage cleared",
        description: "All local storage has been cleared. The app will refresh.",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear storage",
        variant: "destructive"
      });
    }
  };

  const handleTestSound = async () => {
    try {
      await testNotificationSound('generated', 0.5);
      toast({
        title: "Sound test",
        description: "Notification sound played successfully"
      });
    } catch (error) {
      toast({
        title: "Sound test failed",
        description: "Unable to play notification sound",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
      case 'available':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'denied':
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'granted' || status === 'available' ? 'default' :
                    status === 'denied' || status === 'unavailable' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (!isNativePlatform() && !isIOS()) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            iOS diagnostics are only available on iOS devices
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Information
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDiagnostics}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deviceInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{deviceInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{deviceInfo.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS Version</span>
                <span className="font-medium">{deviceInfo.osVersion}</span>
              </div>
              {iosInfo?.iosVersion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">iOS Version</span>
                  <span className="font-medium">{iosInfo.iosVersion}</span>
                </div>
              )}
            </>
          )}
          {iosInfo?.isSafari && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Browser</span>
              <span className="font-medium">Safari</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(storageStatus)}
              <span>Local Storage</span>
            </div>
            {getStatusBadge(storageStatus)}
          </div>
          {storageStatus === 'private' && (
            <p className="text-sm text-warning bg-warning/10 p-3 rounded-lg">
              Private browsing detected. Some features may be limited.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearStorage}
            className="w-full"
          >
            Clear App Storage
          </Button>
        </CardContent>
      </Card>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {permissions.map((permission, index) => (
            <div key={index}>
              {index > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(permission.status)}
                  <span>{permission.name}</span>
                </div>
                {getStatusBadge(permission.status)}
              </div>
              {permission.details && permission.status !== 'granted' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {permission.details}
                </p>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={openAppSettings}
            className="w-full mt-3"
          >
            <Settings className="h-4 w-4 mr-2" />
            Open System Settings
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSound}
            className="w-full"
          >
            Test Notification Sound
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IOSDiagnostics;
