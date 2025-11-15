import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  UserIcon,
  Cog6ToothIcon as SettingsIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function ProfileMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdminStatus();
  }, [user?.id]);

  const hapticFeedback = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  const handleSignOut = async () => {
    await hapticFeedback();
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const handleNavigation = async (path: string) => {
    await hapticFeedback();
    navigate(path);
  };

  const menuItems = [
    { icon: UserIcon, label: "View Profile", action: () => handleNavigation("/profile") },
    { icon: SettingsIcon, label: "Account Settings", action: () => handleNavigation("/settings") },
    { icon: BellIcon, label: "Notifications", action: () => handleNavigation("/settings?tab=notifications") },
    { icon: ShieldCheckIcon, label: "Privacy & Security", action: () => handleNavigation("/settings?tab=privacy") },
    { icon: QuestionMarkCircleIcon, label: "Help Center", action: () => handleNavigation("/help") },
  ];

  // Add Admin Panel if user is admin
  if (isAdmin) {
    menuItems.push({
      icon: ShieldCheckIcon,
      label: "Admin Panel",
      action: () => handleNavigation("/admin")
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              hapticFeedback();
              navigate(-1);
            }}
            className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* User Info Section */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-border">
        <Avatar className="h-24 w-24 border-4 border-primary/20 mb-4">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {profile?.full_name || 'User'}
        </h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-foreground" />
                <span className="text-base text-foreground">{item.label}</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="px-4 py-6 border-t border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
