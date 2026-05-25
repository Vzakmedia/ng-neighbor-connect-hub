import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;
import { useState, useEffect } from "react";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { toast } from "sonner";
import { playNotification } from "@/utils/audioUtils";
import { handleApiError } from "@/utils/errorHandling";

export default function Notifications() {
  const navigate = useNavigate();
  const { preferences, isLoading, updatePreferences, sendTestEmail } = useEmailNotifications();

  const [notificationVolume, setNotificationVolume] = useState([80]);
  const [emergencyVolume, setEmergencyVolume] = useState([100]);
  const [messageVolume, setMessageVolume] = useState([70]);

  const hapticFeedback = async () => {
    if (isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    await hapticFeedback();
    updatePreferences.mutate({ [field]: value });
  };

  const testSound = async (type: 'notification' | 'emergency' | 'message') => {
    await hapticFeedback();
    try {
      // WR-20: map type to correct sound function
      if (type === 'emergency') {
        await playNotification('emergency');
      } else {
        await playNotification('normal');
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sound played`);
    } catch (error) {
      handleApiError(error, { route: '/profile/notifications' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between py-1.5">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            title="Go back"
            onClick={() => {
              hapticFeedback();
              navigate('/profile-menu');
            }}
            className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 px-4 pt-4 space-y-4">

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="safety-alerts" className="text-sm">Safety Alerts</Label>
              <Switch
                id="safety-alerts"
                checked={preferences?.safety_alerts ?? true}
                onCheckedChange={(checked) => handleToggle('safety_alerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emergency-alerts" className="text-sm">Emergency Alerts</Label>
              <Switch
                id="emergency-alerts"
                checked={preferences?.emergency_alerts ?? true}
                onCheckedChange={(checked) => handleToggle('emergency_alerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="community-posts" className="text-sm">Community Posts</Label>
              <Switch
                id="community-posts"
                checked={preferences?.community_posts ?? true}
                onCheckedChange={(checked) => handleToggle('community_posts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketplace" className="text-sm">Marketplace Updates</Label>
              <Switch
                id="marketplace"
                checked={preferences?.marketplace_updates ?? true}
                onCheckedChange={(checked) => handleToggle('marketplace_updates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="messages" className="text-sm">Messages</Label>
              <Switch
                id="messages"
                checked={preferences?.messages ?? true}
                onCheckedChange={(checked) => handleToggle('messages', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push" className="text-sm">Push Notifications</Label>
              <Switch id="push" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-sm">Email Notifications</Label>
              <Switch
                id="email"
                checked={preferences?.email_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              />
            </div>
            {preferences?.email_enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestEmail.mutate()}
                disabled={sendTestEmail.isPending}
                className="w-full"
              >
                {sendTestEmail.isPending ? 'Sending...' : 'Send Test Email'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audio Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Notification Volume</Label>
                <span className="text-sm text-muted-foreground">{notificationVolume[0]}%</span>
              </div>
              <Slider
                value={notificationVolume}
                onValueChange={setNotificationVolume}
                max={100}
                step={1}
                className="w-full"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('notification')}
                className="w-full"
              >
                Test Notification Sound
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Emergency Alert Volume</Label>
                <span className="text-sm text-muted-foreground">{emergencyVolume[0]}%</span>
              </div>
              <Slider
                value={emergencyVolume}
                onValueChange={setEmergencyVolume}
                max={100}
                step={1}
                className="w-full"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('emergency')}
                className="w-full"
              >
                Test Emergency Sound
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Message Chime Volume</Label>
                <span className="text-sm text-muted-foreground">{messageVolume[0]}%</span>
              </div>
              <Slider
                value={messageVolume}
                onValueChange={setMessageVolume}
                max={100}
                step={1}
                className="w-full"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('message')}
                className="w-full"
              >
                Test Message Sound
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiet Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours" className="text-sm">Enable Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                defaultChecked={false}
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
