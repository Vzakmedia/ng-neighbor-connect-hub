import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Admin2FAGate } from '@/components/security/Admin2FAGate';
import { AdminSessionGuard } from '@/components/security/AdminSessionGuard';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import {
  Users,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Settings,
  Plug,
  Activity,
  BarChart3,
  Shield,
  MessageSquare,
  FileText,
  Mail,
} from '@/lib/icons';

// Import tab components
import { OverviewTab } from '@/components/admin/tabs/OverviewTab';
import { UsersTab } from '@/components/admin/tabs/UsersTab';
import { EmergencyAlertsTab } from '@/components/admin/tabs/EmergencyAlertsTab';

// Import existing panels
import BusinessVerificationAdmin from '@/components/BusinessVerificationAdmin';
import StaffInvitationManager from '@/components/StaffInvitationManager';
import ContentModerationPanel from '@/components/ContentModerationPanel';
import ContentManagementPanel from '@/components/ContentManagementPanel';
import { AdCampaignCard } from '@/components/advertising/AdCampaignCard';
import AdsSettingsPanel from '@/components/advertising/AdsSettingsPanel';
import NewsletterSubscribersPanel from '@/components/admin/NewsletterSubscribersPanel';
import { BlogManagementPanel } from '@/components/admin/BlogManagementPanel';
import EmailManagementPanel from '@/components/admin/EmailManagementPanel';
import SecuritySettingsPanel from '@/components/admin/SecuritySettingsPanel';
import RateLimitingPanel from '@/components/admin/RateLimitingPanel';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

const Admin = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin, loading: adminCheckLoading } = useAdminStatus();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not admin
  if (!adminCheckLoading && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Admin2FAGate>
      <AdminSessionGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-6 px-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your community platform
              </p>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="emergency" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Emergency</span>
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Marketplace</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <OverviewTab />
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <UsersTab isSuperAdmin={isSuperAdmin} />
              </TabsContent>

              {/* Emergency Alerts Tab */}
              <TabsContent value="emergency">
                <EmergencyAlertsTab />
              </TabsContent>

              {/* Marketplace Tab */}
              <TabsContent value="marketplace">
                <div className="text-center py-12 text-muted-foreground">
                  Marketplace management coming soon...
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content">
                <Tabs defaultValue="moderation" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="moderation">
                      <Shield className="h-4 w-4 mr-2" />
                      Moderation
                    </TabsTrigger>
                    <TabsTrigger value="management">
                      <FileText className="h-4 w-4 mr-2" />
                      Management
                    </TabsTrigger>
                    <TabsTrigger value="blog">
                      <FileText className="h-4 w-4 mr-2" />
                      Blog
                    </TabsTrigger>
                    <TabsTrigger value="newsletter">
                      <Mail className="h-4 w-4 mr-2" />
                      Newsletter
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="moderation">
                    <ContentModerationPanel />
                  </TabsContent>

                  <TabsContent value="management">
                    <ContentManagementPanel />
                  </TabsContent>

                  <TabsContent value="blog">
                    <BlogManagementPanel />
                  </TabsContent>

                  <TabsContent value="newsletter">
                    <NewsletterSubscribersPanel />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Tabs defaultValue="security" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="security">
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="business">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Business
                    </TabsTrigger>
                    <TabsTrigger value="advertising">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Advertising
                    </TabsTrigger>
                    <TabsTrigger value="staff">
                      <Users className="h-4 w-4 mr-2" />
                      Staff
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                      <Activity className="h-4 w-4 mr-2" />
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="security">
                    <div className="space-y-6">
                      <SecuritySettingsPanel />
                      <RateLimitingPanel />
                    </div>
                  </TabsContent>

                  <TabsContent value="business">
                    <BusinessVerificationAdmin />
                  </TabsContent>

                  <TabsContent value="advertising">
                    <AdsSettingsPanel />
                  </TabsContent>

                  <TabsContent value="staff">
                    <StaffInvitationManager />
                  </TabsContent>

                  <TabsContent value="performance">
                    <PerformanceDashboard />
                  </TabsContent>

                  <TabsContent value="email">
                    <EmailManagementPanel />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AdminSessionGuard>
    </Admin2FAGate>
  );
};

export default Admin;
