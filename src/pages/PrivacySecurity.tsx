import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ShieldCheckIcon, KeyIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { BiometricSettings } from "@/components/settings/BiometricSettings";
import { useState } from "react";
import { toast } from "sonner";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const { signOut } = useAuth();
  const { 
    privacySettings, 
    messagingPreferences, 
    isLoading, 
    updatePrivacySettings, 
    updateMessagingPreferences 
  } = usePrivacySettings();
  
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

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
    setIsSigningOutAll(true);
    
    try {
      // Sign out from all sessions using global scope
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      toast.success("Signed out from all devices");
      // The auth state change will handle redirect
    } catch (error) {
      console.error('Error signing out all devices:', error);
      toast.error("Failed to sign out from all devices");
    } finally {
      setIsSigningOutAll(false);
    }
  };

  const handleClearCache = async () => {
    await hapticFeedback();
    
    try {
      // Clear localStorage cache items
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.') || key.startsWith('audio') || key.startsWith('cache')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      toast.success("Cache cleared successfully");
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error("Failed to clear cache");
    }
  };

  const handleDownloadData = async () => {
    await hapticFeedback();
    setIsExporting(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neighborlink-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Your data has been downloaded");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    await hapticFeedback();
    
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      toast.error("Please type DELETE_MY_ACCOUNT to confirm");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteConfirmation },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      
      toast.success("Your account has been deleted");
      await signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  disabled={isSigningOutAll}
                >
                  <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
                  {isSigningOutAll ? "Signing out..." : "Sign Out All Devices"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices including this one. You'll need to sign in again.
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
              <Select 
                value={privacySettings.profileVisibility} 
                onValueChange={(value: 'public' | 'neighbors' | 'verified' | 'private') => 
                  updatePrivacySettings({ profileVisibility: value })
                }
              >
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
                checked={messagingPreferences.show_online_status}
                onCheckedChange={async (checked) => {
                  await hapticFeedback();
                  updateMessagingPreferences({ show_online_status: checked });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Allow Direct Messages From</Label>
              <Select 
                value={privacySettings.allowDMsFrom} 
                onValueChange={(value: 'everyone' | 'neighbors' | 'none') => {
                  updatePrivacySettings({ allowDMsFrom: value });
                  updateMessagingPreferences({ allow_messages: value !== 'none' });
                }}
              >
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
                checked={privacySettings.locationSharing}
                onCheckedChange={async (checked) => {
                  await hapticFeedback();
                  updatePrivacySettings({ locationSharing: checked });
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
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Download Your Data"}
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
                <span>
                  {Math.round(JSON.stringify(localStorage).length / 1024)} KB
                </span>
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
                  <AlertDialogDescription className="space-y-3">
                    <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                    <p className="font-medium">Type <span className="font-mono bg-muted px-1 rounded">DELETE_MY_ACCOUNT</span> to confirm:</p>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE_MY_ACCOUNT"
                      className="mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE_MY_ACCOUNT' || isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
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
