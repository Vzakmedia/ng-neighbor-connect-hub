import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth'; // Make sure to use the real auth hook
import { 
  Settings, 
  Bell, 
  Shield, 
  User, 
  LogOut,
  Trash2,
  Download,
  Upload,
  Volume2,
  Play,
  AlertTriangle,
  Users
} from 'lucide-react';
import { playNotification } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';
import EmergencySettings from './EmergencySettings';
import EmergencyContacts from './EmergencyContacts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SettingsContent = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    safetyAlerts: true,
    marketplaceUpdates: true,
    communityPosts: false,
    serviceBookings: true,
    emergencyAlerts: true,
    emailNotifications: true,
    pushNotifications: true
  });

  // Audio Settings
  const [audioSettings, setAudioSettings] = useState({
    notificationVolume: [0.5],
    emergencyVolume: [0.8],
    soundEnabled: true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPhone: false,
    showAddress: false,
    allowMessages: true,
    shareLocation: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePrivacyChange = (key: string, value: boolean | string) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    // This would require additional backend logic
    toast({
      title: "Account deletion requested",
      description: "Please contact support to complete account deletion.",
      variant: "destructive",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Data export initiated",
      description: "You will receive an email with your data shortly.",
    });
  };

  const handleVolumeChange = (type: 'notification' | 'emergency', value: number[]) => {
    setAudioSettings(prev => ({
      ...prev,
      [`${type}Volume`]: value
    }));
  };

  const testSound = (type: 'normal' | 'emergency') => {
    const volume = type === 'emergency' 
      ? audioSettings.emergencyVolume[0] 
      : audioSettings.notificationVolume[0];
    
    if (audioSettings.soundEnabled) {
      playNotification(type, volume);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Safety & Emergency</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="safety-alerts">Safety Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about safety incidents in your area
                      </p>
                    </div>
                    <Switch
                      id="safety-alerts"
                      checked={notificationSettings.safetyAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('safetyAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Critical emergency notifications and panic button responses
                      </p>
                    </div>
                    <Switch
                      id="emergency-alerts"
                      checked={notificationSettings.emergencyAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emergencyAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Community & Services</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketplace-updates">Marketplace Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        New items, price changes, and marketplace activity
                      </p>
                    </div>
                    <Switch
                      id="marketplace-updates"
                      checked={notificationSettings.marketplaceUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('marketplaceUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="community-posts">Community Posts</Label>
                      <p className="text-sm text-muted-foreground">
                        New posts and discussions in your neighborhood
                      </p>
                    </div>
                    <Switch
                      id="community-posts"
                      checked={notificationSettings.communityPosts}
                      onCheckedChange={(checked) => handleNotificationChange('communityPosts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="service-bookings">Service Bookings</Label>
                      <p className="text-sm text-muted-foreground">
                        Booking confirmations, updates, and reminders
                      </p>
                    </div>
                    <Switch
                      id="service-bookings"
                      checked={notificationSettings.serviceBookings}
                      onCheckedChange={(checked) => handleNotificationChange('serviceBookings', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Delivery Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on this device
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Sound Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sound-enabled">Enable Notification Sounds</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sounds for notifications and alerts
                      </p>
                    </div>
                    <Switch
                      id="sound-enabled"
                      checked={audioSettings.soundEnabled}
                      onCheckedChange={(checked) => setAudioSettings(prev => ({ ...prev, soundEnabled: checked }))}
                    />
                  </div>

                  {audioSettings.soundEnabled && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notification-volume">Notification Volume</Label>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testSound('normal')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                        <Slider
                          id="notification-volume"
                          value={audioSettings.notificationVolume}
                          onValueChange={(value) => handleVolumeChange('notification', value)}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Volume: {Math.round(audioSettings.notificationVolume[0] * 100)}%
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emergency-volume">Emergency Alert Volume</Label>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testSound('emergency')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                        <Slider
                          id="emergency-volume"
                          value={audioSettings.emergencyVolume}
                          onValueChange={(value) => handleVolumeChange('emergency', value)}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Volume: {Math.round(audioSettings.emergencyVolume[0] * 100)}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emergency Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmergencySettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <EmergencyContacts />
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Visibility</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-visibility">Who can see your profile?</Label>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Everyone</SelectItem>
                        <SelectItem value="neighbors">Neighbors only</SelectItem>
                        <SelectItem value="verified">Verified users only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">Show Phone Number</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your phone number on your profile
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-address">Show Address</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your full address on your profile
                      </p>
                    </div>
                    <Switch
                      id="show-address"
                      checked={privacySettings.showAddress}
                      onCheckedChange={(checked) => handlePrivacyChange('showAddress', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Communication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Let other users message you directly
                      </p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={privacySettings.allowMessages}
                      onCheckedChange={(checked) => handlePrivacyChange('allowMessages', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Location Services</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="share-location">Share Location</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the app to access your location for neighborhood features
                      </p>
                    </div>
                    <Switch
                      id="share-location"
                      checked={privacySettings.shareLocation}
                      onCheckedChange={(checked) => handlePrivacyChange('shareLocation', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Sign Out</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device.
                </p>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all your data. This action cannot be undone.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your personal data, including your profile, posts, and activity.
                </p>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Import Data</h3>
                <p className="text-sm text-muted-foreground">
                  Import data from a file or another service.
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsContent;