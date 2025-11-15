import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  UserIcon,
  Cog6ToothIcon as SettingsIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

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

  const menuItems = [
    { icon: UserIcon, label: "View Profile", action: () => navigate("/profile") },
    { icon: SettingsIcon, label: "Account Settings", action: () => navigate("/settings") },
    { icon: BellIcon, label: "Notifications", action: () => navigate("/settings?tab=notifications") },
    { icon: ShieldCheckIcon, label: "Privacy & Security", action: () => navigate("/settings?tab=privacy") },
    { icon: QuestionMarkCircleIcon, label: "Help Center", action: () => navigate("/help") },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex flex-col items-center gap-1 focus:outline-none"
          onClick={hapticFeedback}
        >
          <Avatar className="h-6 w-6 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground">You</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mb-2">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{profile?.full_name || 'User'}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.label}
              onClick={async () => {
                await hapticFeedback();
                setOpen(false);
                item.action();
              }}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
