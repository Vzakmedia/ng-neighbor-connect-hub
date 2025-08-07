import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, Shield, TrendingUp, AlertTriangle, Settings, Activity, Search, Filter, BarChart3, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import BusinessVerificationAdmin from "@/components/BusinessVerificationAdmin";
import StaffInvitationManager from "@/components/StaffInvitationManager";
import ContentModerationPanel from '@/components/ContentModerationPanel';
import ContentManagementPanel from '@/components/ContentManagementPanel';
import AdminDashboardStats from '@/components/AdminDashboardStats';
import AdminUserManagement from '@/components/AdminUserManagement';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management and auth checks
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Check admin permissions
  const checkAdminPermissions = async () => {
    if (!user) return false;
    
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !roleData) {
        console.log('No role found for user or error:', error);
        return false;
      }

      const isAdmin = ['admin', 'super_admin'].includes(roleData.role);
      setIsSuperAdmin(roleData.role === 'super_admin');
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin permissions:', error);
      return false;
    }
  };

  // Authentication check effect
  useEffect(() => {
    const initializeAdmin = async () => {
      if (!user) {
        setAdminCheckComplete(true);
        setLoading(false);
        return;
      }

      const hasAdminAccess = await checkAdminPermissions();
      
      if (!hasAdminAccess) {
        setAdminCheckComplete(true);
        setLoading(false);
        return;
      }

      setAdminCheckComplete(true);
      setLoading(false);
    };

    initializeAdmin();
  }, [user]);

  // Redirect if not authenticated or not admin
  if (!user || (!loading && !isSuperAdmin && adminCheckComplete)) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (loading || !adminCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your community platform from this central control panel
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full grid-cols-6 min-w-max">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Emergency</span>
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)] w-full">
            <div className="mt-6">
              <TabsContent value="overview" className="mt-0">
                <AdminDashboardStats isSuperAdmin={isSuperAdmin} />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <AdminUserManagement isSuperAdmin={isSuperAdmin} />
              </TabsContent>

              <TabsContent value="content" className="mt-0">
                <div className="space-y-6">
                  <ContentModerationPanel />
                  <ContentManagementPanel />
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Management
                    </CardTitle>
                    <CardDescription>
                      Monitor and manage emergency alerts and safety reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Emergency management features will be implemented here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="business" className="mt-0">
                <div className="space-y-6">
                  <BusinessVerificationAdmin />
                  <StaffInvitationManager />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      System Settings
                    </CardTitle>
                    <CardDescription>
                      Configure application settings and integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">System configuration options will be available here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;