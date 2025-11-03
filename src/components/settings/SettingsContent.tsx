import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Users,
  HelpCircle,
  Music,
  Lock
} from 'lucide-react';
import { playNotification, playMessagingChime } from '@/utils/audioUtils';
import { testNotificationSound, getAvailableNotificationSounds } from '@/utils/testNotificationSounds';
import type { NotificationSoundType } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';
import EmergencySettings from './EmergencySettings';
import EmergencyContacts from './EmergencyContacts';
import SupportTicketForm from './SupportTicketForm';
import UserSupportTickets from './UserSupportTickets';
import { LocationFilterSettings } from './LocationFilterSettings';
import { TwoFactorSetup } from '@/components/security/TwoFactorSetup';
import { SuperAdminSecurityPanel } from '@/components/security/SuperAdminSecurityPanel';
import { useTutorial } from '@/hooks/useTutorial';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
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
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startTutorial, resetTutorial, hasCompletedTutorial } = useTutorial();
  const { preferences: emailPreferences, updatePreferences: updateEmailPreferences, sendTestEmail } = useEmailNotifications();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(data?.role || null);
      }
    };

    fetchUserRole();
  }, [user]);
  
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
    soundEnabled: true,
    notificationSound: 'generated' as NotificationSoundType,
    messageChimeMode: 'single' as 'single' | 'double',
    messageChimeVolume: [0.7],
  });

  // Load audio settings from native storage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
      const { getItem } = useNativeStorage();
      const savedAudioSettings = await getItem('audioSettings');
      if (savedAudioSettings) {
        try {
          const parsed = JSON.parse(savedAudioSettings);
          setAudioSettings(prev => ({ 
            ...prev, 
            ...parsed,
            notificationSound: parsed.notificationSound || 'generated'
          }));
        } catch (error) {
          console.error('Error loading audio settings:', error);
        }
      }
    };
    loadSettings();
  }, []);

  // Save audio settings to native storage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      const { useNativeStorage } = await import('@/hooks/mobile/useNativeStorage');
      const { setItem } = useNativeStorage();
      await setItem('audioSettings', JSON.stringify(audioSettings));
    };
    saveSettings();
  }, [audioSettings]);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPhone: false,
    showAddress: false,
    shareLocation: true
  });

  // Messaging preferences
  const [messagingPreferences, setMessagingPreferences] = useState({
    allow_messages: true,
    show_read_receipts: true,
    show_online_status: true
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

  const testSound = async (type: 'normal' | 'emergency') => {
    console.log('Test sound button clicked:', type);
    const volume = type === 'emergency' 
      ? audioSettings.emergencyVolume[0] 
      : audioSettings.notificationVolume[0];
    
    if (!audioSettings.soundEnabled) {
      toast({
        title: "Sound Disabled",
        description: "Please enable notification sounds first",
        variant: "destructive"
      });
      return;
    }

    try {
      if (type === 'emergency') {
        console.log('Playing emergency notification test');
        await playNotification('emergency', volume);
      } else {
        console.log('Testing selected notification sound:', audioSettings.notificationSound);
        // Test the user's selected notification sound
        await testNotificationSound(audioSettings.notificationSound, volume);
      }
      
      toast({
        title: "Sound Test",
        description: `${type === 'emergency' ? 'Emergency' : 'Notification'} sound played successfully`,
      });
    } catch (error) {
      console.error('Error testing sound:', error);
      toast({
        title: "Sound Test Failed",
        description: "Unable to play sound. Check your browser settings and try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-2 mb-4 sm:mb-6 px-1">
        <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="notifications" className="w-full max-w-full">
        <div className="w-full overflow-x-auto pb-2 mb-4">
          <TabsList className="inline-flex h-auto min-w-full w-max p-1 gap-1">
            <TabsTrigger value="notifications" className="text-xs px-2 py-2 whitespace-nowrap">
              <Bell className="h-3 w-3 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="emergency" className="text-xs px-2 py-2 whitespace-nowrap">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs px-2 py-2 whitespace-nowrap">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs px-2 py-2 whitespace-nowrap">
              <Shield className="h-3 w-3 mr-1" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs px-2 py-2 whitespace-nowrap">
              <Lock className="h-3 w-3 mr-1" />
              Security
            </TabsTrigger>
            {userRole === 'super_admin' && (
              <TabsTrigger value="admin-security" className="text-xs px-2 py-2 whitespace-nowrap">
                <Shield className="h-3 w-3 mr-1" />
                Admin Security
              </TabsTrigger>
            )}
            <TabsTrigger value="account" className="text-xs px-2 py-2 whitespace-nowrap">
              <User className="h-3 w-3 mr-1" />
              Account
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs px-2 py-2 whitespace-nowrap">
              <Download className="h-3 w-3 mr-1" />
              Data
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs px-2 py-2 whitespace-nowrap">
              <HelpCircle className="h-3 w-3 mr-1" />
              Support
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="w-full max-w-full">
          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-x-hidden">
              <div className="space-y-4">
                <h3 className="font-medium">Safety & Emergency</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="safety-alerts" className="text-sm font-medium">Safety Alerts</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Receive notifications about safety incidents in your area
                      </p>
                    </div>
                    <Switch
                      id="safety-alerts"
                      checked={notificationSettings.safetyAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('safetyAlerts', checked)}
                      className="shrink-0"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="emergency-alerts" className="text-sm font-medium">Emergency Alerts</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Critical emergency notifications and panic button responses
                      </p>
                    </div>
                    <Switch
                      id="emergency-alerts"
                      checked={notificationSettings.emergencyAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emergencyAlerts', checked)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Community & Services</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="marketplace-updates" className="text-sm font-medium">Marketplace Updates</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        New items, price changes, and marketplace activity
                      </p>
                    </div>
                    <Switch
                      id="marketplace-updates"
                      checked={notificationSettings.marketplaceUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('marketplaceUpdates', checked)}
                      className="shrink-0"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="community-posts" className="text-sm font-medium">Community Posts</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        New posts and discussions in your neighborhood
                      </p>
                    </div>
                    <Switch
                      id="community-posts"
                      checked={notificationSettings.communityPosts}
                      onCheckedChange={(checked) => handleNotificationChange('communityPosts', checked)}
                      className="shrink-0"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="service-bookings" className="text-sm font-medium">Service Bookings</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Booking confirmations, updates, and reminders
                      </p>
                    </div>
                    <Switch
                      id="service-bookings"
                      checked={notificationSettings.serviceBookings}
                      onCheckedChange={(checked) => handleNotificationChange('serviceBookings', checked)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Delivery Methods</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                      className="shrink-0"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="push-notifications" className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Receive push notifications on this device
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Email Notification Preferences
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose which notifications you want to receive via email
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Email Notifications</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Master switch for all email notifications
                      </p>
                    </div>
                    <Switch
                      checked={emailPreferences?.email_enabled ?? true}
                      onCheckedChange={(checked) => 
                        updateEmailPreferences.mutate({ email_enabled: checked })
                      }
                    />
                  </div>
                  
                  {emailPreferences?.email_enabled && (
                    <>
                      <Separator />
                      <div className="space-y-3 pl-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Emergency Alerts</Label>
                          <Switch
                            checked={emailPreferences?.emergency_alerts ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ emergency_alerts: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Safety Alerts</Label>
                          <Switch
                            checked={emailPreferences?.safety_alerts ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ safety_alerts: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Panic Alerts</Label>
                          <Switch
                            checked={emailPreferences?.panic_alerts ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ panic_alerts: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Direct Messages</Label>
                          <Switch
                            checked={emailPreferences?.messages ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ messages: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Community Posts</Label>
                          <Switch
                            checked={emailPreferences?.community_posts ?? false}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ community_posts: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Marketplace Updates</Label>
                          <Switch
                            checked={emailPreferences?.marketplace_updates ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ marketplace_updates: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Service Bookings</Label>
                          <Switch
                            checked={emailPreferences?.service_bookings ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ service_bookings: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Contact Requests</Label>
                          <Switch
                            checked={emailPreferences?.contact_requests ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ contact_requests: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Post Comments</Label>
                          <Switch
                            checked={emailPreferences?.post_comments ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ post_comments: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Comment Replies</Label>
                          <Switch
                            checked={emailPreferences?.comment_replies ?? true}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ comment_replies: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Post Likes</Label>
                          <Switch
                            checked={emailPreferences?.post_likes ?? false}
                            onCheckedChange={(checked) => 
                              updateEmailPreferences.mutate({ post_likes: checked })
                            }
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Button
                        variant="outline"
                        onClick={() => sendTestEmail.mutate()}
                        disabled={sendTestEmail.isPending}
                        className="w-full sm:w-auto"
                      >
                        {sendTestEmail.isPending ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Sound Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="sound-enabled" className="text-sm font-medium">Enable Notification Sounds</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Play sounds for notifications and alerts
                      </p>
                    </div>
                    <Switch
                      id="sound-enabled"
                      checked={audioSettings.soundEnabled}
                      onCheckedChange={(checked) => {
                        setAudioSettings(prev => ({ ...prev, soundEnabled: checked }));
                        if (checked) {
                          // Request permissions when enabling
                          if ('Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission().then(permission => {
                              if (permission === 'granted') {
                                toast({
                                  title: "Permissions Granted",
                                  description: "Audio notifications are now enabled!"
                                });
                              }
                            });
                          }
                        }
                      }}
                      className="shrink-0"
                    />
                  </div>

                  {audioSettings.soundEnabled && (
                    <>
                      {('Notification' in window && Notification.permission === 'denied') && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Audio Blocked:</strong> Please enable notifications in your browser settings to hear sounds.
                          </p>
                        </div>
                      )}
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
                        <Label htmlFor="notification-sound" className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Notification Sound
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={audioSettings.notificationSound}
                            onValueChange={(value: NotificationSoundType) => 
                              setAudioSettings(prev => ({ ...prev, notificationSound: value }))
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select notification sound" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableNotificationSounds().map((sound) => (
                                <SelectItem key={sound.id} value={sound.id}>
                                  {sound.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testNotificationSound(audioSettings.notificationSound, audioSettings.notificationVolume[0])}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Choose your preferred notification sound from the available options
                        </p>
                      </div>

                      {/* Message Chime Settings */}
                      <div className="space-y-4">
                        <h3 className="font-medium">Message Chime</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="message-chime-mode" className="text-sm font-medium">Chime Mode</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Choose single or double chime for new messages
                            </p>
                          </div>
                          <Select
                            value={audioSettings.messageChimeMode}
                            onValueChange={(value: 'single' | 'double') =>
                              setAudioSettings(prev => ({ ...prev, messageChimeMode: value }))
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="message-chime-volume">Message Chime Volume</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => playMessagingChime()}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Test
                            </Button>
                          </div>
                          <Slider
                            id="message-chime-volume"
                            value={audioSettings.messageChimeVolume}
                            onValueChange={(value) => setAudioSettings(prev => ({ ...prev, messageChimeVolume: value }))}
                            max={1}
                            min={0}
                            step={0.05}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">
                            Volume: {Math.round((audioSettings.messageChimeVolume?.[0] ?? 0.7) * 100)}%
                          </p>
                        </div>
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
        <TabsContent value="emergency" className="w-full max-w-full">
          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Emergency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-hidden">
              <EmergencySettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="w-full max-w-full">
          <div className="w-full max-w-full overflow-hidden">
            <EmergencyContacts />
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="w-full max-w-full">
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Location Filter Settings */}
            <LocationFilterSettings />
            
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-6 overflow-x-hidden">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Visibility</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-visibility" className="text-sm font-medium">Who can see your profile?</Label>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                    >
                      <SelectTrigger className="w-full">
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
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="show-phone" className="text-sm font-medium">Show Phone Number</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Display your phone number on your profile
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                      className="shrink-0"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="show-address" className="text-sm font-medium">Show Address</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Display your full address on your profile
                      </p>
                    </div>
                    <Switch
                      id="show-address"
                      checked={privacySettings.showAddress}
                      onCheckedChange={(checked) => handlePrivacyChange('showAddress', checked)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Communication</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="allow-messages" className="text-sm font-medium">Allow Direct Messages</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Let other users message you directly
                      </p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={messagingPreferences.allow_messages}
                      onCheckedChange={(checked) => setMessagingPreferences(prev => ({ ...prev, allow_messages: checked }))}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Location Services</h3>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="share-location" className="text-sm font-medium">Share Location</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Allow the app to access your location for neighborhood features
                      </p>
                    </div>
                    <Switch
                      id="share-location"
                      checked={privacySettings.shareLocation}
                      onCheckedChange={(checked) => handlePrivacyChange('shareLocation', checked)}
                      className="shrink-0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="w-full max-w-full">
          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-x-hidden">
              <div className="space-y-4">
                <h3 className="font-medium">Sign Out</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device.
                </p>
                <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  App Tutorial
                </h3>
                <p className="text-sm text-muted-foreground">
                  Take the app tour again to learn about features and navigation.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Start Tutorial button clicked - navigating to home');
                      toast({
                        title: "Starting Tutorial",
                        description: "Navigating to home page to begin the tour...",
                      });
                      
                      // Navigate to home page first
                      navigate('/dashboard');
                      
                      // Start tutorial after a short delay to ensure page is loaded
                      setTimeout(() => {
                        console.log('Starting tutorial now');
                        startTutorial();
                      }, 1000);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Start Tutorial
                  </Button>
                  {hasCompletedTutorial && (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        console.log('Reset Tutorial button clicked');
                        resetTutorial();
                      }}
                      className="w-full sm:w-auto text-muted-foreground"
                      size="sm"
                    >
                      Reset Tutorial Progress
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all your data. This action cannot be undone.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="w-full sm:w-auto">Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="w-full max-w-full">
          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-x-hidden">
              <div className="space-y-4">
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your personal data, including your profile, posts, and activity.
                </p>
                <Button variant="outline" onClick={handleExportData} className="w-full sm:w-auto">
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
                <Button variant="outline" className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="w-full max-w-full">
          <TwoFactorSetup />
        </TabsContent>

        {/* Admin Security Tab */}
        {userRole === 'super_admin' && (
          <TabsContent value="admin-security" className="w-full max-w-full">
            <SuperAdminSecurityPanel />
          </TabsContent>
        )}

        {/* Support Tab */}
        <TabsContent value="support" className="w-full max-w-full">
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            <SupportTicketForm />
            <UserSupportTickets />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsContent;