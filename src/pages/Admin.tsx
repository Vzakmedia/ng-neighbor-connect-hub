import { useState } from 'react';
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
  Activity,
  BarChart3,
  Shield,
  MessageSquare,
  FileText,
  Mail,
  Zap,
  Lock,
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

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
  { id: 'content', label: 'Content', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const contentSubTabs = [
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'management', label: 'Management', icon: FileText },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
];

const settingsSubTabs = [
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'business', label: 'Business', icon: TrendingUp },
  { id: 'advertising', label: 'Advertising', icon: TrendingUp },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'email', label: 'Email', icon: Mail },
];

const Admin = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin, loading: adminCheckLoading } = useAdminStatus();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeContentTab, setActiveContentTab] = useState('moderation');
  const [activeSettingsTab, setActiveSettingsTab] = useState('security');

  if (!adminCheckLoading && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen admin-portal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <Admin2FAGate>
      <AdminSessionGuard>
        <div className="min-h-screen admin-portal-bg">
          {/* Sticky Header */}
          <div className="admin-portal-header border-b border-white/5">
            <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">NeighboursNG</p>
                  <p className="text-sm font-bold text-white">Admin Console</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <Lock className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-300 font-medium">Super Admin</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300 font-medium">Live</span>
                </div>
              </div>
            </div>

            {/* Page Title */}
            <div className="px-4 sm:px-6 lg:px-8 pb-3 pt-1">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Full platform control and management</p>
            </div>

            {/* Main Tabs - Scrollable on mobile */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex px-4 sm:px-6 lg:px-8 gap-1 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                        isActive
                          ? 'text-emerald-300 border-emerald-500 bg-emerald-500/5'
                          : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {tab.id === 'emergency' && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="admin-panel-wrapper">
                <OverviewTab />
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="admin-panel-wrapper">
                <UsersTab isSuperAdmin={isSuperAdmin} />
              </div>
            )}

            {/* Emergency Tab */}
            {activeTab === 'emergency' && (
              <div className="admin-panel-wrapper">
                <EmergencyAlertsTab />
              </div>
            )}

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
              <div className="admin-portal-card rounded-2xl p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Marketplace Management</h3>
                <p className="text-slate-500">Coming soon — full marketplace management tools</p>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {/* Sub Tabs */}
                <div className="flex gap-1 flex-wrap">
                  {contentSubTabs.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveContentTab(sub.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activeContentTab === sub.id
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
                <div className="admin-panel-wrapper">
                  {activeContentTab === 'moderation' && <ContentModerationPanel />}
                  {activeContentTab === 'management' && <ContentManagementPanel />}
                  {activeContentTab === 'blog' && <BlogManagementPanel />}
                  {activeContentTab === 'newsletter' && <NewsletterSubscribersPanel />}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Sub Tabs */}
                <div className="flex gap-1 flex-wrap">
                  {settingsSubTabs.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSettingsTab(sub.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activeSettingsTab === sub.id
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
                <div className="admin-panel-wrapper">
                  {activeSettingsTab === 'security' && (
                    <div className="space-y-4">
                      <SecuritySettingsPanel />
                      <RateLimitingPanel />
                    </div>
                  )}
                  {activeSettingsTab === 'business' && <BusinessVerificationAdmin />}
                  {activeSettingsTab === 'advertising' && <AdsSettingsPanel />}
                  {activeSettingsTab === 'staff' && <StaffInvitationManager />}
                  {activeSettingsTab === 'performance' && <PerformanceDashboard />}
                  {activeSettingsTab === 'email' && <EmailManagementPanel />}
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminSessionGuard>
    </Admin2FAGate>
  );
};

export default Admin;
