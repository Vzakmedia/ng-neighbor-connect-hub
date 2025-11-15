import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ShieldCheckIcon, KeyIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { BiometricSettings } from "@/components/settings/BiometricSettings";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";

export default function PrivacySecurity() {
  const navigate = useNavigate();
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowDMsFrom, setAllowDMsFrom] = useState("everyone");
  const [locationSharing, setLocationSharing] = useState(true);

  const hapticFeedback = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  const handleSignOutAll = async () => {
    await hapticFeedback();
    toast.success("Signed out from all devices");
  };

  const handleClearCache = async () => {
    await hapticFeedback();
    toast.success("Cache cleared successfully");
  };

  const handleDownloadData = async () => {
    await hapticFeedback();
    toast.success("Your data export will be sent to your email");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              hapticFeedback();
              navigate('/profile-menu');
            }}
            className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Privacy & Security</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 px-4 pt-4 space-y-4">
        
        {/* Account Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Account Security</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Protect your account with additional security measures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                await hapticFeedback();
                navigate('/settings?tab=account');
              }}
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Change Password
            </Button>

            <div className="pt-2">
              <BiometricSettings />
            </div>

            <div className="pt-2">
              <TwoFactorSetup />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={hapticFeedback}
                >
                  <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                  Sign Out All Devices
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices except this one. You'll need to sign in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOutAll}>
                    Sign Out All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacy Settings</CardTitle>
            <CardDescription className="text-xs">
              Control who can see your information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Profile Visibility</Label>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Everyone can see</SelectItem>
                  <SelectItem value="neighbors">Neighbors Only</SelectItem>
                  <SelectItem value="private">Private - Only me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="online-status" className="text-sm">Show Online Status</Label>
                <p className="text-xs text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch
                id="online-status"
                checked={showOnlineStatus}
                onCheckedChange={async (checked) => {
                  await hapticFeedback();
                  setShowOnlineStatus(checked);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Allow Direct Messages From</Label>
              <Select value={allowDMsFrom} onValueChange={setAllowDMsFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="neighbors">Neighbors Only</SelectItem>
                  <SelectItem value="none">No One</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location-sharing" className="text-sm">Location Sharing</Label>
                <p className="text-xs text-muted-foreground">Share your location for safety features</p>
              </div>
              <Switch
                id="location-sharing"
                checked={locationSharing}
                onCheckedChange={async (checked) => {
                  await hapticFeedback();
                  setLocationSharing(checked);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data & Storage</CardTitle>
            <CardDescription className="text-xs">
              Manage your data and app storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleDownloadData}
            >
              Download Your Data
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleClearCache}
            >
              Clear Cache
            </Button>
            <div className="pt-2 px-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Storage Used</span>
                <span>124 MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocked Users</CardTitle>
            <CardDescription className="text-xs">
              Manage users you've blocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No blocked users
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">App Permissions</CardTitle>
            <CardDescription className="text-xs">
              Manage app access to your device features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Camera</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={async () => {
                await hapticFeedback();
                toast.info("Opening device settings...");
              }}
            >
              Manage in Settings
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            <CardDescription className="text-xs">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={hapticFeedback}
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
