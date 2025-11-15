import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [hasStaffRole, setHasStaffRole] = useState(false);

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'moderator', 'manager', 'support', 'staff'])
          .maybeSingle();
        
        setHasStaffRole(!!data?.role);
      } catch (error) {
        setHasStaffRole(false);
      }
    };
    
    checkStaffRole();
  }, [user]);

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getLocation = () => {
    if (profile?.neighborhood && profile?.city) {
      return `${profile.neighborhood}, ${profile.city}`;
    } else if (profile?.city && profile?.state) {
      return `${profile.city}, ${profile.state}`;
    } else if (profile?.state) {
      return profile.state;
    }
    return 'No location set';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const menuItems = [
    {
      icon: UserIcon,
      label: "View Full Profile",
      description: "See your complete profile",
      action: () => navigate("/profile"),
      color: "text-foreground",
    },
    {
      icon: Cog6ToothIcon,
      label: "Account Settings",
      description: "Manage your account preferences",
      action: () => navigate("/settings"),
      color: "text-foreground",
    },
    {
      icon: BellIcon,
      label: "Notifications",
      description: "Manage notification preferences",
      action: () => navigate("/settings?tab=notifications"),
      color: "text-foreground",
    },
    {
      icon: ShieldCheckIcon,
      label: "Privacy & Security",
      description: "Control your privacy settings",
      action: () => navigate("/settings?tab=privacy"),
      color: "text-foreground",
    },
    {
      icon: QuestionMarkCircleIcon,
      label: "Help Center",
      description: "Get help and support",
      action: () => navigate("/help"),
      color: "text-foreground",
    },
  ];

  if (hasStaffRole) {
    menuItems.splice(5, 0, {
      icon: BuildingOffice2Icon,
      label: "Admin Panel",
      description: "Access admin features",
      action: () => navigate("/admin"),
      color: "text-primary",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-20 md:pb-4">
        <div className="container max-w-2xl py-6 px-4">
          {/* Back button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 md:hidden"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Profile Header Card */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              <h1 className="text-2xl font-bold mb-1">
                {profile?.full_name || 'User'}
              </h1>
              
              <p className="text-sm text-muted-foreground mb-2">
                {user?.email}
              </p>
              
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>📍</span>
                {getLocation()}
              </p>
            </div>
          </Card>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.label}
                  className="p-4 hover:bg-accent transition-colors cursor-pointer"
                  onClick={item.action}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-primary/10 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${item.color}`}>
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Separator className="my-6" />

          {/* Sign Out Button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
