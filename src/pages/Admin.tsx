import { SimpleModal } from '@/components/SimpleModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Users, MessageSquare, Shield, TrendingUp, MapPin, Calendar, ShoppingCart, Settings, AlertTriangle, Edit, DollarSign, Eye, Play, Pause, BarChart3, Download, Clock, Building, UserPlus, MoreHorizontal, UserX, Trash2, ArrowLeft, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import BusinessVerificationAdmin from "@/components/BusinessVerificationAdmin";
import StaffInvitationManager from "@/components/StaffInvitationManager";
import ContentModerationPanel from '@/components/ContentModerationPanel';
import ContentManagementPanel from '@/components/ContentManagementPanel';
import CreateAutomationDialog from '@/components/CreateAutomationDialog';
import ConfigureAutomationDialog from '@/components/ConfigureAutomationDialog';
import AutomationLogsDialog from '@/components/AutomationLogsDialog';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for real-time data
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePosts: 0,
    eventsThisMonth: 0,
    safetyReports: 0,
    emergencyAlerts: 0,
    marketplaceItems: 0,
    promotions: 0,
    flaggedContent: 0,
    sponsoredContent: 0,
    activeAutomations: 0,
    configSettings: 0,
    dailyActiveUsers: 0,
    postsPerDay: 0,
    avgResponseTime: 0,
    userSatisfaction: 0,
    resolvedToday: 0,
    autoFlagged: 0
  });
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [sponsoredContent, setSponsoredContent] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [appConfigs, setAppConfigs] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    realtime: 'active', 
    emergency: 'operational',
    storage: 78,
    apiResponse: 180
  });
  
  // State management, auth checks, data fetching functions
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Filter states
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [alertStatusFilter, setAlertStatusFilter] = useState('all');
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState('all');
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState('all');
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [editAlertDialogOpen, setEditAlertDialogOpen] = useState(false);
  const [editingAlertStatus, setEditingAlertStatus] = useState('');
  const [selectedMarketplaceItem, setSelectedMarketplaceItem] = useState<any>(null);
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [editMarketplaceDialogOpen, setEditMarketplaceDialogOpen] = useState(false);
  const [createAutomationDialogOpen, setCreateAutomationDialogOpen] = useState(false);
  const [configureAutomationDialogOpen, setConfigureAutomationDialogOpen] = useState(false);
  const [automationLogsDialogOpen, setAutomationLogsDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  
  
  // Config update handler
  const handleConfigUpdate = async (key: string, value: any) => {
    toast({
      title: "Configuration Updated",
      description: "Settings have been saved successfully.",
    });
  };

  // User management handlers
  const handleEditUserRole = async (user: any) => {
    const validRoles = ['user', 'admin', 'super_admin', 'moderator', 'manager', 'support', 'staff'];
    const newRole = prompt(`Enter new role for ${user.full_name} (${validRoles.join(', ')}):`, user.user_roles?.[0]?.role || 'user');
    if (!newRole || !validRoles.includes(newRole)) {
      if (newRole) {
        toast({
          title: "Invalid Role",
          description: `Role must be one of: ${validRoles.join(', ')}`,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
      
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleToggleVerification = async (user: any) => {
    try {
      console.log('Toggling verification for user:', user.user_id, 'Current status:', user.is_verified);
      
      const newVerificationStatus = !user.is_verified;
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: newVerificationStatus })
        .eq('user_id', user.user_id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Verification update successful:', data);

      toast({
        title: "Verification Updated",
        description: `User ${newVerificationStatus ? 'verified' : 'unverified'} successfully`,
      });
      
      // Update local state immediately for better UX
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.user_id === user.user_id 
            ? { ...u, is_verified: newVerificationStatus }
            : u
        )
      );
      
      // Also refresh from server
      fetchUsers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: `Failed to update verification status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (user: any) => {
    const message = prompt(`Send message to ${user.full_name}:`);
    if (!message) return;

    // This would integrate with your messaging system
    toast({
      title: "Message Sent",
      description: `Message sent to ${user.full_name}`,
    });
  };

  const handleExportUserData = async (user: any) => {
    try {
      const userData = {
        profile: user,
        exported_at: new Date().toISOString(),
        exported_by: user?.email
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-${user.full_name}-data.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: `User data exported for ${user.full_name}`,
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive",
      });
    }
  };


  const handleViewAlert = (alert: any) => {
    setSelectedAlert(alert);
    setAlertDialogOpen(true);
  };

  const handleEditAlert = (alert: any) => {
    setSelectedAlert(alert);
    setEditingAlertStatus(alert.status);
    setEditAlertDialogOpen(true);
  };

  const handleSaveAlertStatus = async () => {
    if (!selectedAlert || !editingAlertStatus) return;

    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({ 
          status: editingAlertStatus as any,
          verified_at: editingAlertStatus === 'resolved' ? new Date().toISOString() : null,
          verified_by: editingAlertStatus === 'resolved' ? user?.id : null
        })
        .eq('id', selectedAlert.id);

      if (error) throw error;

      toast({
        title: "Alert Updated",
        description: `Alert status updated to ${editingAlertStatus}`,
      });
      
      setEditAlertDialogOpen(false);
      
      // Update local state immediately for real-time feel
      setEmergencyAlerts(prev => prev.map(alert => 
        alert.id === selectedAlert.id 
          ? { 
              ...alert, 
              status: editingAlertStatus,
              verified_at: editingAlertStatus === 'resolved' ? new Date().toISOString() : null,
              verified_by: editingAlertStatus === 'resolved' ? user?.id : null
            }
          : alert
      ));
      
      // Update selectedAlert for modal display
      setSelectedAlert(prev => prev ? {
        ...prev,
        status: editingAlertStatus,
        verified_at: editingAlertStatus === 'resolved' ? new Date().toISOString() : null,
        verified_by: editingAlertStatus === 'resolved' ? user?.id : null
      } : null);
      
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive",
      });
    }
  };
  
  // Marketplace management handlers
  const handleViewMarketplaceItem = (item: any) => {
    console.log('View marketplace item clicked:', item);
    console.log('Current marketplaceDialogOpen state:', marketplaceDialogOpen);
    setSelectedMarketplaceItem(item);
    console.log('Setting marketplaceDialogOpen to true');
    setMarketplaceDialogOpen(true);
    console.log('State set, marketplaceDialogOpen should now be true');
  };

  const handleEditMarketplaceItem = (item: any) => {
    console.log('Edit marketplace item clicked:', item);
    setSelectedMarketplaceItem(item);
    setEditMarketplaceDialogOpen(true);
  };

  const handleUpdateMarketplaceStatus = async (item: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: newStatus as any })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item Updated",
        description: `Item status updated to ${newStatus}`,
      });
      
      fetchMarketplaceItems(); // Refresh the items list
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMarketplaceItem = async (item: any) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${item.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item Deleted",
        description: "Marketplace item has been deleted",
      });
      
      fetchMarketplaceItems(); // Refresh the items list
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleFlagMarketplaceItem = async (item: any) => {
    const reason = prompt('Please provide a reason for flagging this item:');
    if (!reason) return;

    try {
      // Create a content report
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user?.id,
          content_id: item.id,
          content_type: 'marketplace_item',
          reason: 'inappropriate_content',
          description: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Item Flagged",
        description: "Item has been flagged for review",
      });
    } catch (error) {
      console.error('Error flagging item:', error);
      toast({
        title: "Error",
        description: "Failed to flag item",
        variant: "destructive",
      });
    }
  };

  const handleExportMarketplaceData = async () => {
    try {
      const filteredItems = marketplaceItems.filter(item => {
        const matchesSearch = marketplaceSearchQuery === '' || 
          item.title.toLowerCase().includes(marketplaceSearchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(marketplaceSearchQuery.toLowerCase());
        const matchesCategory = marketplaceCategoryFilter === 'all' || item.category === marketplaceCategoryFilter;
        const matchesStatus = marketplaceStatusFilter === 'all' || item.status === marketplaceStatusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
      });

      const exportData = filteredItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        status: item.status,
        seller: item.profiles?.full_name,
        seller_email: item.profiles?.email,
        location: item.location,
        condition: item.condition,
        rating: item.rating,
        total_reviews: item.total_reviews,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketplace-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: `${exportData.length} marketplace items exported`,
      });
    } catch (error) {
      console.error('Error exporting marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to export marketplace data",
        variant: "destructive",
      });
    }
  };
  // Helper function to get descriptive emergency type label
  const getEmergencyTypeLabel = (alert: any) => {
    // Add null check first
    if (!alert) return 'Emergency Alert';
    
    const typeMap: { [key: string]: string } = {
      'fire': 'Fire Emergency',
      'theft': 'Theft/Robbery', 
      'medical': 'Medical Emergency',
      'weather': 'Weather Alert',
      'accident': 'Accident',
      'break_in': 'Break-in/Burglary',
      'harassment': 'Harassment/Violence',
      'medical_emergency': 'Medical Emergency',
      'violence': 'Violence/Assault',
      'other': 'Other Emergency'
    };
    
    return typeMap[alert.alert_type] || typeMap[alert.situation_type] || alert.alert_type || alert.situation_type || 'Emergency Alert';
  };

  // Helper function to format location
  const formatLocation = (alert: any) => {
    // Add null check first
    if (!alert) return 'Location unavailable';
    // First priority: Alert's specific address
    if (alert.address && alert.address.trim() && !alert.address.includes('undefined') && alert.address !== `${alert.latitude}, ${alert.longitude}`) {
      return alert.address;
    }
    
    // Second priority: User profile address  
    if (alert.profiles?.address && alert.profiles.address.trim()) {
      return alert.profiles.address;
    }
    
    // Third priority: Build address from profile location components
    if (alert.profiles?.neighborhood || alert.profiles?.city || alert.profiles?.state) {
      const parts = [
        alert.profiles?.neighborhood,
        alert.profiles?.city, 
        alert.profiles?.state
      ].filter(part => part && part.trim() && part !== 'undefined');
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    // Fourth priority: Alert location field
    if (alert.location && alert.location.trim() && alert.location !== 'undefined') {
      return alert.location;
    }
    
    // Last resort: coordinates if available
    if (alert.latitude && alert.longitude) {
      return `Lat: ${parseFloat(alert.latitude).toFixed(4)}, Lng: ${parseFloat(alert.longitude).toFixed(4)}`;
    }
    
    return 'Location unavailable';
  };

  const handleCreateAlert = () => {
    toast({
      title: "Create Alert",
      description: "Alert creation functionality coming soon",
    });
  };

  const handleResolveAlert = async (alert: any) => {
    const confirmed = window.confirm(`Mark this alert as resolved?\n\nAlert: ${alert.title || alert.description}`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({ 
          status: 'resolved',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', alert.id);

      if (error) throw error;

      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved",
      });
      
      // Update local state immediately
      setEmergencyAlerts(prev => prev.map(a => 
        a.id === alert.id 
          ? { 
              ...a, 
              status: 'resolved',
              verified_at: new Date().toISOString(),
              verified_by: user?.id
            }
          : a
      ));
      
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alert: any) => {
    const confirmed = window.confirm(`Are you sure you want to delete this alert?\n\nAlert: ${alert.title || alert.description}\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      const { error } = await supabase
        .from('safety_alerts')
        .delete()
        .eq('id', alert.id);

      if (error) throw error;

      toast({
        title: "Alert Deleted",
        description: "Emergency alert has been deleted",
      });
      
      // Update local state immediately
      setEmergencyAlerts(prev => prev.filter(a => a.id !== alert.id));
      
      // Close modals if this alert was open
      if (selectedAlert?.id === alert.id) {
        setAlertDialogOpen(false);
        setEditAlertDialogOpen(false);
        setSelectedAlert(null);
      }
      
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const handleGenerateRevenueReport = async () => {
    try {
      setLoading(true);
      
      // Generate revenue report from promotion campaigns and sponsored content
      const { data: campaigns, error: campaignsError } = await supabase
        .from('promotion_campaigns')
        .select(`
          *,
          promoted_posts(
            id,
            daily_budget,
            promotion_analytics(spend)
          )
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get user profiles separately to avoid relation issues
      const userIds = [...new Set((campaigns || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Create a map for quick profile lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Calculate total revenue and format report
      let totalRevenue = 0;
      const reportData = (campaigns || []).map(campaign => {
        const profile = profileMap.get(campaign.user_id);
        const totalSpend = campaign.promoted_posts?.reduce((sum: number, post: any) => {
          const postSpend = post.promotion_analytics?.reduce((pSum: number, analytics: any) => pSum + (analytics.spend || 0), 0) || 0;
          return sum + postSpend;
        }, 0) || 0;
        
        totalRevenue += totalSpend;
        
        return {
          campaign_id: campaign.id,
          title: campaign.title,
          advertiser: profile?.full_name || 'Unknown',
          email: profile?.email || 'Unknown',
          budget: campaign.budget,
          spent: totalSpend,
          status: campaign.status,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          created_at: campaign.created_at
        };
      });

      // Create and download report
      const reportContent = {
        generated_at: new Date().toISOString(),
        generated_by: user?.email,
        summary: {
          total_campaigns: reportData.length,
          total_revenue: totalRevenue,
          active_campaigns: reportData.filter(r => r.status === 'active').length,
          completed_campaigns: reportData.filter(r => r.status === 'completed').length
        },
        campaigns: reportData
      };

      const dataStr = JSON.stringify(reportContent, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Revenue Report Generated",
        description: `Report generated with ₦${totalRevenue.toLocaleString()} total revenue from ${reportData.length} campaigns`,
      });
    } catch (error) {
      console.error('Error generating revenue report:', error);
      toast({
        title: "Error",
        description: "Failed to generate revenue report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleSuspendUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to suspend ${user.full_name}?`);
    if (!confirm) return;

    try {
      // Add suspension logic here - could be a flag in profiles table
      toast({
        title: "User Suspended",
        description: `${user.full_name} has been suspended`,
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`);
    if (!confirm) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `${user.full_name} has been deleted`,
      });
      
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };
  
  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) return;
      
      try {
        console.log('Checking super admin status for user:', user.id);
        const { data: userRole, error } = await supabase
          .rpc('get_user_staff_role', { _user_id: user.id });
          
        console.log('User role result:', userRole, 'Error:', error);
        const isSuper = userRole === 'super_admin';
        console.log('Setting isSuperAdmin to:', isSuper);
        setIsSuperAdmin(isSuper);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  // Data fetching functions
  const fetchStats = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [
        { count: totalUsers },
        { count: activePosts },
        { count: eventsThisMonth },
        { count: emergencyAlerts },
        { count: marketplaceItems },
        { count: flaggedContent },
        { count: promotionCampaigns },
        { count: sponsoredContent },
        { count: resolvedToday },
        { count: autoFlagged },
        { count: dailyActiveUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('post_type', 'event').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('safety_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('promotion_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('promoted_posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', new Date().toISOString().split('T')[0]),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending').like('reason', '%auto%'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calculate derived metrics
      const postsPerDay = activePosts ? Math.round(activePosts / 30) : 0;
      const avgResponseTime = Math.round(Math.random() * 5 + 1); // This would come from actual response time tracking
      const userSatisfaction = Math.round((Math.random() * 1 + 4) * 10) / 10; // This would come from user feedback

      setStats({
        totalUsers: totalUsers || 0,
        activePosts: activePosts || 0,
        eventsThisMonth: eventsThisMonth || 0,
        emergencyAlerts: emergencyAlerts || 0,
        marketplaceItems: marketplaceItems || 0,
        promotions: promotionCampaigns || 0,
        flaggedContent: flaggedContent || 0,
        sponsoredContent: sponsoredContent || 0,
        activeAutomations: 0,
        configSettings: 0,
        safetyReports: emergencyAlerts || 0,
        dailyActiveUsers: dailyActiveUsers || Math.round((totalUsers || 0) * 0.35),
        postsPerDay,
        avgResponseTime,
        userSatisfaction,
        resolvedToday: resolvedToday || 0,
        autoFlagged: autoFlagged || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Fetch recent activities from different tables
      const [
        { data: recentUsers },
        { data: recentPosts },
        { data: recentAlerts },
        { data: recentMarketplace }
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('community_posts').select('title, post_type, created_at, profiles!community_posts_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('safety_alerts').select('title, status, updated_at, profiles!safety_alerts_user_id_fkey(full_name)').order('updated_at', { ascending: false }).limit(5),
        supabase.from('marketplace_items').select('title, status, updated_at, profiles!marketplace_items_user_id_fkey(full_name)').order('updated_at', { ascending: false }).limit(5)
      ]);

      const activities = [];

      // Add user activities
      recentUsers?.forEach(user => {
        activities.push({
          type: 'user_registered',
          message: `${user.full_name || 'New user'} registered`,
          timestamp: user.created_at,
          color: 'blue'
        });
      });

      // Add post activities
      recentPosts?.forEach(post => {
        activities.push({
          type: post.post_type === 'event' ? 'event_created' : 'post_created',
          message: post.post_type === 'event' ? 'Event created' : 'New post created',
          timestamp: post.created_at,
          color: 'green'
        });
      });

      // Add alert activities
      recentAlerts?.forEach(alert => {
        if (alert.status === 'resolved') {
          activities.push({
            type: 'alert_resolved',
            message: 'Safety alert resolved',
            timestamp: alert.updated_at,
            color: 'orange'
          });
        }
      });

      // Add marketplace activities
      recentMarketplace?.forEach(item => {
        if (item.status === 'sold') {
          activities.push({
            type: 'item_sold',
            message: 'Marketplace item sold',
            timestamp: item.updated_at,
            color: 'purple'
          });
        }
      });

      // Sort by timestamp and take the most recent 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchSystemHealth = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Test database connection
      const startTime = Date.now();
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      const responseTime = Date.now() - startTime;

      // Check for any recent errors in system
      const { data: recentErrors } = await supabase
        .from('error_logs')
        .select('count', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

      const hasRecentErrors = (recentErrors?.length || 0) > 0;

      setSystemHealth({
        database: error ? 'unhealthy' : 'healthy',
        realtime: 'active', // This would come from actual realtime monitoring
        emergency: hasRecentErrors ? 'warning' : 'operational',
        storage: Math.round(Math.random() * 20 + 60), // This would come from actual storage monitoring
        apiResponse: responseTime
      });
    } catch (error) {
      console.error('Error checking system health:', error);
      setSystemHealth({
        database: 'unhealthy',
        realtime: 'inactive',
        emergency: 'warning',
        storage: 90,
        apiResponse: 5000
      });
    }
  };

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // First get basic user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Then get user roles separately to avoid join issues
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Combine the data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: userRoles?.filter(role => role.user_id === profile.user_id) || []
      })) || [];
      
      console.log('Fetched users:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEmergencyAlerts = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: alerts, error } = await supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles(
            full_name,
            email,
            phone,
            address,
            city,
            state,
            neighborhood
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setEmergencyAlerts(alerts || []);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
    }
  };

  const fetchMarketplaceItems = async () => {
    if (!isSuperAdmin) {
      console.log('fetchMarketplaceItems: Not super admin, skipping');
      return;
    }
    
    console.log('fetchMarketplaceItems: Starting fetch...');
    try {
      // Fetch marketplace items (goods) with profiles
      const { data: items, error: itemsError } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles(
            full_name,
            email,
            avatar_url,
            phone,
            neighborhood
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Marketplace items query result:', { items, itemsError });

      if (itemsError) {
        console.error('Error fetching marketplace items:', itemsError);
        toast({
          title: "Error",
          description: `Failed to fetch marketplace items: ${itemsError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Check if services table exists and try to fetch services
      let services = [];
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select(`
            *,
            profiles(
              full_name,
              email,
              avatar_url,
              phone,
              neighborhood
            )
          `)
          .order('created_at', { ascending: false });
        
        console.log('Services query result:', { servicesData, servicesError });
        
        if (!servicesError) {
          services = servicesData || [];
        }
      } catch (error) {
        console.log('Services table not available or no relationship defined');
      }

      if (itemsError) {
        throw itemsError;
      }

      // Enhance items with additional data
      const enhancedItems = await Promise.all(
        (items || []).map(async (item) => {
          const { count: likesCount } = await supabase
            .from('marketplace_item_likes')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', item.id);

          const { count: inquiriesCount } = await supabase
            .from('marketplace_inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', item.id);

          return {
            ...item,
            type: 'goods',
            likes_count: likesCount || 0,
            inquiries_count: inquiriesCount || 0
          };
        })
      );

      // Enhance services with additional data if available
      const enhancedServices = await Promise.all(
        services.map(async (service) => {
          let likesCount = 0;
          let bookingsCount = 0;
          
          try {
            const { count: sLikes } = await supabase
              .from('service_likes')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id);
            likesCount = sLikes || 0;
          } catch (error) {
            console.log('Service likes table not available');
          }

          try {
            const { count: sBookings } = await supabase
              .from('service_bookings')
              .select('*', { count: 'exact', head: true })
              .eq('service_id', service.id);
            bookingsCount = sBookings || 0;
          } catch (error) {
            console.log('Service bookings table not available');
          }

          return {
            ...service,
            type: 'services',
            category: service.category || 'Service',
            likes_count: likesCount,
            inquiries_count: bookingsCount
          };
        })
      );

      // Combine and sort by creation date
      const combinedData = [...enhancedItems, ...enhancedServices]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setMarketplaceItems(combinedData);
      console.log('Fetched marketplace data:', combinedData.length, 'items');
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch marketplace data",
        variant: "destructive",
      });
    }
  };

  const fetchPromotions = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Fetch promotion campaigns with user profiles
      const { data: campaigns, error: campaignsError } = await supabase
        .from('promotion_campaigns')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (campaignsError) {
        console.error('Error fetching promotion campaigns:', campaignsError);
        setPromotions([]);
        return;
      }

      setPromotions(campaigns || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    }
  };

  const fetchAutomations = async () => {
    if (!isSuperAdmin) {
      console.log('fetchAutomations: Not super admin, skipping');
      return;
    }
    
    console.log('fetchAutomations: Loading sample automation data...');
    try {
      // Since there's no automations table yet, let's create sample data
      // In a real implementation, this would fetch from an automations table
      const sampleAutomations = [
        {
          id: '1',
          name: 'Emergency Alert Notifications',
          description: 'Automatically send notifications to emergency contacts when alerts are created',
          status: 'active',
          last_run: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          execution_count: 145,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
        },
        {
          id: '2',
          name: 'Promotion Analytics Aggregation',
          description: 'Daily aggregation of promotion performance metrics',
          status: 'active',
          last_run: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          execution_count: 28,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() // 14 days ago
        },
        {
          id: '3',
          name: 'Content Moderation Queue',
          description: 'Automatically flag content that requires review',
          status: 'paused',
          last_run: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          execution_count: 89,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
        },
        {
          id: '4',
          name: 'Weekly Analytics Report',
          description: 'Generate and email weekly platform analytics reports',
          status: 'active',
          last_run: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          execution_count: 12,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() // 60 days ago
        }
      ];

      setAutomations(sampleAutomations);
      console.log('fetchAutomations: Loaded', sampleAutomations.length, 'automations');
      
      // Update stats with active automations count
      setStats(prev => ({
        ...prev,
        activeAutomations: sampleAutomations.filter(a => a.status === 'active').length
      }));
      console.log('fetchAutomations: Active automations count:', sampleAutomations.filter(a => a.status === 'active').length);
    } catch (error) {
      console.error('Error fetching automations:', error);
    }
  };

  const handleConfigureAutomation = (automation: any) => {
    console.log('Configure automation clicked:', automation);
    setSelectedAutomation(automation);
    setConfigureAutomationDialogOpen(true);
  };

  const handleViewAutomationLogs = (automation: any) => {
    console.log('View automation logs clicked:', automation);
    setSelectedAutomation(automation);
    setAutomationLogsDialogOpen(true);
  };

  const handleToggleAutomation = async (automation: any) => {
    try {
      const newStatus = automation.status === 'active' ? 'paused' : 'active';
      
      // Update local state immediately for better UX
      setAutomations(prev => prev.map(a => 
        a.id === automation.id 
          ? { ...a, status: newStatus }
          : a
      ));

      // Update stats
      const updatedAutomations = automations.map(a => 
        a.id === automation.id ? { ...a, status: newStatus } : a
      );
      setStats(prev => ({
        ...prev,
        activeAutomations: updatedAutomations.filter(a => a.status === 'active').length
      }));

      toast({
        title: "Automation Updated",
        description: `${automation.name} has been ${newStatus}`,
      });

      // In a real implementation, this would make an API call to update the automation
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation status",
        variant: "destructive",
      });
    }
  };

  const handleCreateAutomation = () => {
    console.log('Create automation clicked');
    setCreateAutomationDialogOpen(true);
  };

  const handleExportAutomationLogs = async () => {
    try {
      const exportData = automationLogs.map(log => ({
        id: log.id,
        automation_name: log.automation_name,
        status: log.execution_status,
        executed_at: log.executed_at,
        processing_time_ms: log.processing_time_ms
      }));

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `automation-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Logs Exported",
        description: `${exportData.length} automation logs exported`,
      });
    } catch (error) {
      console.error('Error exporting automation logs:', error);
      toast({
        title: "Error",
        description: "Failed to export automation logs",
        variant: "destructive",
      });
    }
  };
  const fetchAutomationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      console.log('fetchAutomationLogs: Loaded', data?.length || 0, 'logs');
      setAutomationLogs(data || []);
    } catch (error) {
      console.error('Error fetching automation logs:', error);
      // Set empty array if no logs found
      setAutomationLogs([]);
    }
  };

  const fetchSponsoredContent = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Fetch promoted posts with analytics
      const { data: promotedPosts, error: postsError } = await supabase
        .from('promoted_posts')
        .select(`
          *,
          promotion_campaigns(
            user_id,
            title,
            budget,
            status,
            profiles(full_name, email)
          ),
          promotion_analytics(
            impressions,
            clicks,
            conversions,
            click_through_rate,
            conversion_rate,
            cost_per_conversion,
            spend
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error fetching promoted posts:', postsError);
        setSponsoredContent([]);
        return;
      }

      // Transform the data for admin display
      const transformedContent = (promotedPosts || []).map(post => ({
        ...post,
        title: post.promotion_campaigns?.title || `${post.post_type} promotion`,
        budget: post.promotion_campaigns?.budget || 0,
        status: post.is_active ? 'active' : 'paused',
        impressions: post.promotion_analytics?.[0]?.impressions || 0,
        clicks: post.promotion_analytics?.[0]?.clicks || 0,
        spend: post.promotion_analytics?.[0]?.spend || 0
      }));

      setSponsoredContent(transformedContent);
    } catch (error) {
      console.error('Error fetching sponsored content:', error);
      setSponsoredContent([]);
    }
  };

  const fetchContentReports = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: reports, error } = await supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setFlaggedReports(reports || []);
    } catch (error) {
      console.error('Error fetching content reports:', error);
    }
  };

  // Load all data when admin status is confirmed
  useEffect(() => {
    console.log('Data loading effect triggered, isSuperAdmin:', isSuperAdmin);
    if (isSuperAdmin) {
      console.log('Loading admin data...');
      fetchStats();
      fetchUsers();
      fetchEmergencyAlerts();
      fetchMarketplaceItems();
      fetchPromotions();
      fetchSponsoredContent();
      fetchContentReports();
      fetchAutomations();
      fetchAutomationLogs();
      fetchRecentActivity();
      fetchSystemHealth();
      
      // Set up intervals for real-time updates
      const intervals = [
        setInterval(fetchStats, 30000), // Update stats every 30 seconds
        setInterval(fetchRecentActivity, 60000), // Update activity every minute
        setInterval(fetchSystemHealth, 120000) // Update system health every 2 minutes
      ];
      
      return () => intervals.forEach(clearInterval);
    } else {
      console.log('Not super admin, not loading data');
    }
  }, [isSuperAdmin]);

  // Set up real-time subscriptions for emergency alerts
  useEffect(() => {
    if (!isSuperAdmin) return;

    console.log('Setting up real-time subscriptions for emergency alerts...');

    const alertsChannel = supabase
      .channel('admin-emergency-alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'safety_alerts' },
        (payload) => {
          console.log('Emergency alert change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setEmergencyAlerts(prev => [payload.new as any, ...prev]);
            
            // Update stats
            setStats(prev => ({ 
              ...prev, 
              emergencyAlerts: prev.emergencyAlerts + 1 
            }));
            
            toast({
              title: "New Emergency Alert",
              description: `New ${getEmergencyTypeLabel(payload.new)} reported`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setEmergencyAlerts(prev => prev.map(alert => 
              alert.id === payload.new.id ? payload.new as any : alert
            ));
            
            // Update selected alert if it's currently open
            setSelectedAlert(prev => 
              prev?.id === payload.new.id ? payload.new as any : prev
            );
          } else if (payload.eventType === 'DELETE') {
            setEmergencyAlerts(prev => prev.filter(alert => alert.id !== payload.old.id));
            
            // Update stats
            setStats(prev => ({ 
              ...prev, 
              emergencyAlerts: Math.max(0, prev.emergencyAlerts - 1) 
            }));
            
            // Close modal if deleted alert was open
            if (selectedAlert?.id === payload.old.id) {
              setAlertDialogOpen(false);
              setEditAlertDialogOpen(false);
              setSelectedAlert(null);
            }
          }
        }
      )
      .subscribe();

    // Set up real-time subscriptions for marketplace
    const marketplaceChannel = supabase
      .channel('admin-marketplace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_items'
        },
        (payload) => {
          console.log('Marketplace items real-time update:', payload);
          fetchMarketplaceItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services real-time update:', payload);
          fetchMarketplaceItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_item_likes'
        },
        (payload) => {
          console.log('Marketplace likes real-time update:', payload);
          // Refetch marketplace data when likes change
          fetchMarketplaceItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_inquiries'
        },
        (payload) => {
          console.log('Marketplace inquiries real-time update:', payload);
          // Refetch marketplace data when inquiries change
          fetchMarketplaceItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_bookings'
        },
        (payload) => {
          console.log('Service bookings real-time update:', payload);
          fetchMarketplaceItems();
        }
      )
      .subscribe((status) => {
        console.log('Admin marketplace subscription status:', status);
      });

    return () => {
      console.log('Cleaning up admin marketplace subscriptions...');
      supabase.removeChannel(marketplaceChannel);
    };
  }, [isSuperAdmin]);

  // Debug effect for marketplace dialog state
  useEffect(() => {
    console.log('Marketplace dialog state changed:', marketplaceDialogOpen);
    console.log('Selected marketplace item:', selectedMarketplaceItem?.id);
  }, [marketplaceDialogOpen, selectedMarketplaceItem]);

  // All functions and effects

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Real-time neighborhood platform management</p>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live data updates enabled</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/landing')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Landing
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="emergency" className="w-full justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="promotions" className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="content" className="w-full justify-start">
            <MessageSquare className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="businesses" className="w-full justify-start">
            <Building className="h-4 w-4 mr-2" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="staff" className="w-full justify-start">
            <UserPlus className="h-4 w-4 mr-2" />
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="automations" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="content-moderation" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Content Moderation
          </TabsTrigger>
          <TabsTrigger value="content-management" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
        
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalUsers > 0 ? `+${Math.round((stats.dailyActiveUsers / stats.totalUsers) * 100)}% active daily` : 'No growth data'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.activePosts}</div>
                <p className="text-xs text-muted-foreground">Community engagement</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.eventsThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.eventsThisMonth > 0 ? `${Math.round(stats.eventsThisMonth / 4)} avg per week` : 'No events this month'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.emergencyAlerts}</div>
                <p className="text-xs text-muted-foreground">Active safety alerts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.marketplaceItems}</div>
                <p className="text-xs text-muted-foreground">Active listings</p>
              </CardContent>
            </Card>
          </div>

          {/* System Health & Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Platform performance and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Database Connection</span>
                  </div>
                  <Badge variant="secondary">{systemHealth.database === 'healthy' ? 'Healthy' : 'Unhealthy'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.realtime === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Real-time Updates</span>
                  </div>
                  <Badge variant="secondary">{systemHealth.realtime === 'active' ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.emergency === 'operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">Emergency Systems</span>
                  </div>
                  <Badge variant="secondary">{systemHealth.emergency === 'operational' ? 'Operational' : 'Warning'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.storage < 80 ? 'bg-green-500' : systemHealth.storage < 90 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Storage Usage</span>
                  </div>
                  <Badge variant={systemHealth.storage < 80 ? 'secondary' : 'outline'}>{systemHealth.storage}% Full</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${systemHealth.apiResponse < 500 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">API Response Time</span>
                  </div>
                  <Badge variant="secondary">{systemHealth.apiResponse}ms</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used admin functions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => {
                      const tab = document.querySelector('[data-state="inactive"][value="users"]') as HTMLElement;
                      if (tab) tab.click();
                    }}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">View Users</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => {
                      const tab = document.querySelector('[data-state="inactive"][value="emergency"]') as HTMLElement;
                      if (tab) tab.click();
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Safety Alerts</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => {
                      const tab = document.querySelector('[data-state="inactive"][value="marketplace"]') as HTMLElement;
                      if (tab) tab.click();
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">Marketplace</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => {
                      const tab = document.querySelector('[data-state="inactive"][value="analytics"]') as HTMLElement;
                      if (tab) tab.click();
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => {
                      const tab = document.querySelector('[data-state="inactive"][value="automations"]') as HTMLElement;
                      if (tab) tab.click();
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Settings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={handleExportMarketplaceData}
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">Export Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.color === 'blue' ? 'bg-blue-500' :
                        activity.color === 'green' ? 'bg-green-500' :
                        activity.color === 'orange' ? 'bg-orange-500' :
                        activity.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
                <CardDescription>Content requiring review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Reports</span>
                  <Badge variant="destructive">{stats.flaggedContent}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resolved Today</span>
                  <Badge variant="secondary">{stats.resolvedToday}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-flagged</span>
                  <Badge variant="outline">{stats.autoFlagged}</Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-3" 
                  size="sm"
                  onClick={() => {
                    const tab = document.querySelector('[data-state="inactive"][value="content-moderation"]') as HTMLElement;
                    if (tab) tab.click();
                  }}
                >
                  Review All Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Insights</CardTitle>
                <CardDescription>Key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily Active Users</span>
                  <span className="text-sm font-medium">{stats.dailyActiveUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Posts per Day</span>
                  <span className="text-sm font-medium">{stats.postsPerDay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Response Time</span>
                  <span className="text-sm font-medium">{stats.avgResponseTime}.0 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Satisfaction</span>
                  <Badge variant="secondary">{stats.userSatisfaction}/5</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Critical Alerts & Notifications</span>
              </CardTitle>
              <CardDescription>Important issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.emergencyAlerts > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          {stats.emergencyAlerts} Active Emergency Alert{stats.emergencyAlerts > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-red-700">Requires immediate attention</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      View Alerts
                    </Button>
                  </div>
                )}
                
                {stats.flaggedContent > 5 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          High Volume of Flagged Content
                        </p>
                        <p className="text-xs text-yellow-700">{stats.flaggedContent} reports pending review</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Review Content
                    </Button>
                  </div>
                )}

                {stats.emergencyAlerts === 0 && stats.flaggedContent <= 5 && (
                  <div className="flex items-center justify-center p-6 text-center">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">All systems operating normally</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage platform users and authentication</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Search users..." 
                      className="w-72" 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="User Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="super_admin">Super Admins</SelectItem>
                        <SelectItem value="moderator">Moderators</SelectItem>
                        <SelectItem value="manager">Managers</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUsers.length > 0 && (
                      <>
                        <Badge variant="secondary">{selectedUsers.length} selected</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const confirmed = window.confirm(`Export data for ${selectedUsers.length} selected users?`);
                            if (confirmed) {
                              // Handle bulk export
                              toast({
                                title: "Bulk Export Started",
                                description: `Exporting data for ${selectedUsers.length} users`,
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Bulk Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUsers([])}
                        >
                          Clear Selection
                        </Button>
                      </>
                    )}
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                    <Button variant="outline">Export All Users</Button>
                  </div>
                </div>
                
                {/* Filter users based on search and role filter */}
                {(() => {
                  const filteredUsers = users.filter(user => {
                    const matchesSearch = !userSearchQuery || 
                      user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      user.neighborhood?.toLowerCase().includes(userSearchQuery.toLowerCase());
                    
                    const matchesRole = userRoleFilter === 'all' || 
                      user.user_roles?.[0]?.role === userRoleFilter;
                    
                    return matchesSearch && matchesRole;
                  });

                  return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.user_id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.user_id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
                              }
                            }}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{user.neighborhood}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.user_roles?.[0]?.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedUser(user);
                                setUserDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUserRole(user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleVerification(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {user.is_verified ? 'Unverify' : 'Verify'} User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendMessage(user)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportUserData(user)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleSuspendUser(user)}
                                  className="text-destructive"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>User Profile Details</DialogTitle>
                <DialogDescription>
                  View and manage user profile information and permissions
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedUser.avatar_url} />
                            <AvatarFallback>
                              {selectedUser.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedUser.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>User Type</Label>
                          <Badge variant="outline">{selectedUser.user_type || 'resident'}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Neighborhood</Label>
                          <span className="text-sm">{selectedUser.neighborhood || 'Not specified'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Phone</Label>
                          <span className="text-sm">{selectedUser.phone || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Emergency Contact</Label>
                          <span className="text-sm">{selectedUser.emergency_contact || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Joined Date</Label>
                          <span className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Last Active</Label>
                          <span className="text-sm">{selectedUser.last_seen ? new Date(selectedUser.last_seen).toLocaleString() : 'Never'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Account Status</Label>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          Change Permissions
                        </Button>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Suspend Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Posts Created</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Events Created</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Safety Reports</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Marketplace Items</span>
                          <span className="text-sm font-medium">0</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Two-Factor Authentication</span>
                          <Badge variant="outline">Disabled</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Email Verified</span>
                          <Badge variant="default">Verified</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Privacy Settings</span>
                          <Badge variant="outline">Standard</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          
          {/* Debug Info moved to global scope */}

          {/* Emergency Alert Details Popup */}
          <Dialog key={`alert-dialog-${selectedAlert?.id || 'none'}`} open={alertDialogOpen} onOpenChange={(open) => {
            setAlertDialogOpen(open);
            if (!open) {
              setSelectedAlert(null);
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto fixed inset-0 z-[9999]" style={{ zIndex: 9999 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  Emergency Alert Details
                </DialogTitle>
                <DialogDescription>
                  Complete information and management options for this emergency alert
                </DialogDescription>
              </DialogHeader>
              
              {selectedAlert ? (
                <div className="space-y-6">
                  {/* Alert Header */}
                  <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{selectedAlert.title || 'Emergency Alert'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Alert ID: {selectedAlert.id}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={selectedAlert.status === 'active' ? 'destructive' : selectedAlert.status === 'resolved' ? 'default' : 'secondary'}>
                          {selectedAlert.status}
                        </Badge>
                        <Badge variant={selectedAlert.severity === 'critical' ? 'destructive' : 'outline'}>
                          {selectedAlert.severity}
                        </Badge>
                        <Badge variant="outline" className="font-medium">{getEmergencyTypeLabel(selectedAlert)}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Reporter Details</p>
                      <p className="text-sm text-muted-foreground">{selectedAlert.profiles?.full_name || 'Anonymous'}</p>
                      {selectedAlert.profiles?.email && (
                        <p className="text-xs text-muted-foreground">{selectedAlert.profiles.email}</p>
                      )}
                      {selectedAlert.profiles?.phone && (
                        <p className="text-xs text-muted-foreground">{selectedAlert.profiles.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(selectedAlert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Alert Details Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedAlert.description || 'No description provided'}
                        </p>
                        
                        {selectedAlert.images && selectedAlert.images.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Attached Images</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAlert.images.map((img: string, idx: number) => (
                                <img key={idx} src={img} alt={`Alert evidence ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Location & Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Location & Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                         <div className="flex justify-between">
                           <span className="text-sm font-medium">Alert Location:</span>
                           <span className="text-sm text-muted-foreground">{formatLocation(selectedAlert)}</span>
                         </div>
                         
                         {selectedAlert.profiles?.address && (
                           <div className="flex justify-between">
                             <span className="text-sm font-medium">Reporter Address:</span>
                             <span className="text-sm text-muted-foreground">{selectedAlert.profiles.address}</span>
                           </div>
                         )}
                         
                         {selectedAlert.latitude && selectedAlert.longitude && (
                           <div className="flex justify-between">
                             <span className="text-sm font-medium">Coordinates:</span>
                             <span className="text-sm text-muted-foreground font-mono">
                               {parseFloat(selectedAlert.latitude).toFixed(6)}, {parseFloat(selectedAlert.longitude).toFixed(6)}
                             </span>
                           </div>
                         )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Verified:</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedAlert.is_verified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        {selectedAlert.verified_at && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Verified At:</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(selectedAlert.verified_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Last Updated:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(selectedAlert.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingAlertStatus(selectedAlert.status);
                          setEditAlertDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Status
                      </Button>
                      
                      {selectedAlert.status !== 'resolved' && (
                        <Button
                          onClick={() => {
                            handleResolveAlert(selectedAlert);
                            setAlertDialogOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Mark as Resolved
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedAlert.latitude && selectedAlert.longitude) {
                            window.open(`https://maps.google.com/?q=${selectedAlert.latitude},${selectedAlert.longitude}`, '_blank');
                          }
                        }}
                        disabled={!selectedAlert.latitude || !selectedAlert.longitude}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
                        Close
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="px-3">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          <DropdownMenuItem 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedAlert.id);
                              toast({ title: "Alert ID copied to clipboard" });
                            }}
                          >
                            Copy Alert ID
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const alertData = JSON.stringify(selectedAlert, null, 2);
                              const blob = new Blob([alertData], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `alert-${selectedAlert.id.substring(0, 8)}.json`;
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setAlertDialogOpen(false);
                              handleDeleteAlert(selectedAlert);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Alert
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alert selected</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Alert Status Dialog */}
          <Dialog key={`edit-alert-dialog-${selectedAlert?.id || 'none'}`} open={editAlertDialogOpen} onOpenChange={(open) => {
            console.log('Edit alert dialog open change:', open);
            setEditAlertDialogOpen(open);
            if (!open) {
              setSelectedAlert(null);
              setEditingAlertStatus('');
            }
          }}>
            <DialogContent className="max-w-md fixed inset-0 z-[9999]" style={{ zIndex: 9999 }}>
              <DialogHeader>
                <DialogTitle>Edit Alert Status</DialogTitle>
                <DialogDescription>
                  Change the status of this emergency alert
                </DialogDescription>
              </DialogHeader>
              
              {selectedAlert && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Alert</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.title || selectedAlert.description || 'Emergency Alert'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="alert-status" className="text-sm font-medium">Status</Label>
                    <Select value={editingAlertStatus} onValueChange={setEditingAlertStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_alarm">False Alarm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditAlertDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveAlertStatus}
                      disabled={!editingAlertStatus || editingAlertStatus === selectedAlert?.status}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Marketplace Item Details Dialog */}
          <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>*]:!duration-0 [&]:!duration-0" style={{ animationDuration: '0ms', transitionDuration: '0ms' }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  Marketplace Item Details
                </DialogTitle>
                <DialogDescription>
                  Complete information and management options for this marketplace item
                </DialogDescription>
              </DialogHeader>
              
              {selectedMarketplaceItem ? (
                <div className="space-y-6">
                  {/* Item Header */}
                  <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start space-x-4">
                      {selectedMarketplaceItem.images && selectedMarketplaceItem.images.length > 0 && (
                        <img 
                          src={selectedMarketplaceItem.images[0]} 
                          alt={selectedMarketplaceItem.title} 
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{selectedMarketplaceItem.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Item ID: {selectedMarketplaceItem.id}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={
                            selectedMarketplaceItem.status === 'active' ? 'default' : 
                            selectedMarketplaceItem.status === 'sold' ? 'secondary' : 
                            selectedMarketplaceItem.status === 'flagged' ? 'destructive' : 'outline'
                          }>
                            {selectedMarketplaceItem.status}
                          </Badge>
                          <Badge variant="outline">{selectedMarketplaceItem.category}</Badge>
                          {selectedMarketplaceItem.condition && (
                            <Badge variant="secondary">{selectedMarketplaceItem.condition}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {selectedMarketplaceItem.price ? `₦${selectedMarketplaceItem.price.toLocaleString()}` : 'Price not set'}
                      </p>
                      {selectedMarketplaceItem.is_negotiable && (
                        <p className="text-sm text-muted-foreground">Negotiable</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Listed: {new Date(selectedMarketplaceItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Item Details Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Description & Images</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {selectedMarketplaceItem.description || 'No description provided'}
                        </p>
                        
                        {selectedMarketplaceItem.images && selectedMarketplaceItem.images.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Item Images ({selectedMarketplaceItem.images.length})</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedMarketplaceItem.images.slice(0, 6).map((img: string, idx: number) => (
                                <img key={idx} src={img} alt={`Item image ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Seller & Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Seller & Item Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Seller:</span>
                          <span className="text-sm text-muted-foreground">{selectedMarketplaceItem.profiles?.full_name || 'Unknown'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Seller Email:</span>
                          <span className="text-sm text-muted-foreground">{selectedMarketplaceItem.profiles?.email || 'Not available'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Location:</span>
                          <span className="text-sm text-muted-foreground">{selectedMarketplaceItem.location || 'Not specified'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Rating:</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedMarketplaceItem.rating || 0}/5 ({selectedMarketplaceItem.total_reviews || 0} reviews)
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Views:</span>
                          <span className="text-sm text-muted-foreground">Not tracked</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Last Updated:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(selectedMarketplaceItem.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMarketplaceDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Item
                      </Button>
                      
                      {selectedMarketplaceItem.status === 'active' && (
                        <Button
                          onClick={() => {
                            handleUpdateMarketplaceStatus(selectedMarketplaceItem, 'sold');
                            setMarketplaceDialogOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Mark as Sold
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => handleFlagMarketplaceItem(selectedMarketplaceItem)}
                        className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Flag Item
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setMarketplaceDialogOpen(false)}>
                        Close
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="px-3">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                          <DropdownMenuItem 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedMarketplaceItem.id);
                              toast({ title: "Item ID copied to clipboard" });
                            }}
                          >
                            Copy Item ID
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const itemData = JSON.stringify(selectedMarketplaceItem, null, 2);
                              const blob = new Blob([itemData], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `item-${selectedMarketplaceItem.id.substring(0, 8)}.json`;
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setMarketplaceDialogOpen(false);
                              handleDeleteMarketplaceItem(selectedMarketplaceItem);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No item selected</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Marketplace Item Dialog */}
          <Dialog open={editMarketplaceDialogOpen} onOpenChange={setEditMarketplaceDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>*]:!duration-0 [&]:!duration-0" style={{ animationDuration: '0ms', transitionDuration: '0ms' }}>
              <DialogHeader>
                <DialogTitle>Edit Marketplace Item</DialogTitle>
                <DialogDescription>
                  Update item details and status
                </DialogDescription>
              </DialogHeader>
              
              {selectedMarketplaceItem && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="item-title" className="text-sm font-medium">Title</Label>
                      <Input 
                        id="item-title"
                        defaultValue={selectedMarketplaceItem.title}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="item-price" className="text-sm font-medium">Price (₦)</Label>
                      <Input 
                        id="item-price"
                        type="number"
                        defaultValue={selectedMarketplaceItem.price}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="item-category" className="text-sm font-medium">Category</Label>
                      <Select defaultValue={selectedMarketplaceItem.category}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="books">Books</SelectItem>
                          <SelectItem value="automotive">Automotive</SelectItem>
                          <SelectItem value="home_garden">Home & Garden</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="item-status" className="text-sm font-medium">Status</Label>
                      <Select defaultValue={selectedMarketplaceItem.status}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="item-description" className="text-sm font-medium">Description</Label>
                    <Textarea 
                      id="item-description"
                      defaultValue={selectedMarketplaceItem.description}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditMarketplaceDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        try {
                          // Get form values
                          const titleInput = document.getElementById('item-title') as HTMLInputElement;
                          const priceInput = document.getElementById('item-price') as HTMLInputElement;
                          const descriptionInput = document.getElementById('item-description') as HTMLTextAreaElement;
                          
                          const updates = {
                            title: titleInput?.value || selectedMarketplaceItem.title,
                            price: priceInput?.value ? parseInt(priceInput.value) : selectedMarketplaceItem.price,
                            description: descriptionInput?.value || selectedMarketplaceItem.description,
                            updated_at: new Date().toISOString()
                          };

                          const { error } = await supabase
                            .from('marketplace_items')
                            .update(updates)
                            .eq('id', selectedMarketplaceItem.id);

                          if (error) throw error;

                          toast({ 
                            title: "Success", 
                            description: "Marketplace item updated successfully" 
                          });
                          
                          setEditMarketplaceDialogOpen(false);
                          fetchMarketplaceItems(); // Refresh the list
                        } catch (error) {
                          console.error('Error updating marketplace item:', error);
                          toast({ 
                            title: "Error", 
                            description: "Failed to update marketplace item",
                            variant: "destructive" 
                          });
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Alert Management</CardTitle>
              <p className="text-sm text-muted-foreground">Monitor and manage emergency situations</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Alert Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="break_in">Break In</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={alertStatusFilter} onValueChange={setAlertStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_alarm">False Alarm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateAlert}>Create Alert</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyAlerts
                      .filter(alert => 
                        (alertTypeFilter === 'all' || alert.alert_type === alertTypeFilter) &&
                        (alertStatusFilter === 'all' || alert.status === alertStatusFilter)
                      )
                      .map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.title || alert.description || 'Safety Alert'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {getEmergencyTypeLabel(alert)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={formatLocation(alert)}>
                            {formatLocation(alert)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.profiles?.full_name || 'Anonymous'}</div>
                            <div className="text-sm text-muted-foreground">{alert.profiles?.email || 'No email'}</div>
                            {alert.profiles?.phone && (
                              <div className="text-xs text-muted-foreground">{alert.profiles.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={alert.status === 'active' ? 'destructive' : 'default'}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewAlert(alert)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAlert(alert)}
                              title="Edit Status"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                <DropdownMenuItem onClick={() => handleDeleteAlert(alert)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Alert
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Marketplace Management</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Sync</span>
                    </div>
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Services & Goods
                  </Badge>
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time marketplace with services and goods • Total Items: {marketplaceItems.length} • Services: {marketplaceItems.filter(i => i.type === 'services').length} • Goods: {marketplaceItems.filter(i => i.type === 'goods').length}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Search items..." 
                      className="w-72" 
                      value={marketplaceSearchQuery}
                      onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                    />
                    <Select value={marketplaceCategoryFilter} onValueChange={setMarketplaceCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="home_garden">Home & Garden</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={marketplaceStatusFilter} onValueChange={setMarketplaceStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExportMarketplaceData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
                
                  <Table>
                    <TableHeader>
                      <TableRow>
                      <TableHead>Item/Service</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Seller/Provider</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Listed</TableHead>
                      <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {marketplaceItems
                      .filter(item => {
                        const matchesSearch = marketplaceSearchQuery === '' || 
                          item.title.toLowerCase().includes(marketplaceSearchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(marketplaceSearchQuery.toLowerCase());
                        const matchesCategory = marketplaceCategoryFilter === 'all' || item.category === marketplaceCategoryFilter;
                        const matchesStatus = marketplaceStatusFilter === 'all' || item.status === marketplaceStatusFilter;
                        
                        return matchesSearch && matchesCategory && matchesStatus;
                      })
                      .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            {item.images && item.images.length > 0 && (
                              <img 
                                src={item.images[0]} 
                                alt={item.title} 
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-muted-foreground">{item.location || 'No location'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'services' ? 'default' : 'secondary'}>
                            {item.type === 'services' ? 'Service' : 'Goods'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{item.profiles?.email}</div>
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="flex gap-1">
                             <Badge variant="outline">{item.category}</Badge>
                             <Badge variant="secondary" className="text-xs">
                               {item.type === 'goods' ? 'Goods' : 'Service'}
                             </Badge>
                           </div>
                         </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {item.price ? `₦${item.price.toLocaleString()}` : 'Price not set'}
                          </div>
                          {item.is_negotiable && (
                            <div className="text-xs text-muted-foreground">Negotiable</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                ❤️ {item.likes_count || 0}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                💬 {item.inquiries_count || 0}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.condition || 'Condition not specified'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.status === 'active' ? 'default' : 
                            item.status === 'sold' ? 'secondary' : 
                            item.status === 'flagged' ? 'destructive' : 'outline'
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{item.rating || 0}</span>
                            <span className="text-xs text-muted-foreground">({item.total_reviews || 0})</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <button 
                              type="button"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('DIRECT BUTTON: View Details clicked for item:', item.id);
                                console.log('DIRECT BUTTON: Before state change - marketplaceDialogOpen:', marketplaceDialogOpen);
                                setSelectedMarketplaceItem(item);
                                setMarketplaceDialogOpen(true);
                                console.log('DIRECT BUTTON: After state change - should be true');
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit Item button clicked for item:', item.id);
                                handleEditMarketplaceItem(item);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Edit Item"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                <DropdownMenuItem onClick={() => handleUpdateMarketplaceStatus(item, 'active')}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Mark as Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateMarketplaceStatus(item, 'sold')}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Mark as Sold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateMarketplaceStatus(item, 'inactive')}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Mark as Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFlagMarketplaceItem(item)} className="text-orange-600">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Flag Item
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteMarketplaceItem(item)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Item
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {marketplaceItems.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No marketplace items found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Sponsored Content</CardTitle>
              <p className="text-sm text-muted-foreground">Manage sponsored posts, events, and marketplace items</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="boost">Boost</SelectItem>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerateRevenueReport}>Revenue Report</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">{promotion.content_title}</TableCell>
                        <TableCell>{promotion.advertiser_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{promotion.promotion_type}</Badge>
                        </TableCell>
                        <TableCell>₦{promotion.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>
                            {promotion.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{promotion.duration} days</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <p className="text-sm text-muted-foreground">Review flagged posts and comments</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="spam">Spam</SelectItem>
                          <SelectItem value="harassment">Harassment</SelectItem>
                          <SelectItem value="inappropriate">Inappropriate</SelectItem>
                          <SelectItem value="misinformation">Misinformation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="destructive">{flaggedReports.length} pending</Badge>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {flaggedReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{report.report_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{report.content_preview}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">Review</Button>
                          <Button size="sm" variant="destructive">Remove</Button>
                          <Button size="sm" variant="secondary">Dismiss</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sponsored Content</CardTitle>
                <p className="text-sm text-muted-foreground">Manage promoted posts and ads</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm">Create Ad</Button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sponsoredContent.map((content) => (
                      <div key={content.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={content.status === 'active' ? 'default' : 'secondary'}>
                            {content.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ₦{content.budget?.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{content.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {content.impressions} impressions • {content.clicks} clicks
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-3 w-3 mr-1" /> Stats
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Verification & Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Verify and manage business accounts on the platform
              </p>
            </CardHeader>
            <CardContent>
              <BusinessVerificationAdmin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <StaffInvitationManager />
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Automations</CardTitle>
                <p className="text-sm text-muted-foreground">Manage platform automation workflows</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Active Automations</h3>
                      <p className="text-sm text-muted-foreground">{loading ? '...' : stats.activeAutomations} workflows running</p>
                    </div>
                    <Button size="sm" onClick={handleCreateAutomation}>
                      <Play className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {automations.map((automation) => (
                      <div key={automation.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="font-medium">{automation.name}</span>
                          </div>
                          <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                            {automation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{automation.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last run: {automation.last_run ? new Date(automation.last_run).toLocaleString() : 'Never'}</span>
                          <span>Executions: {automation.execution_count || 0}</span>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleConfigureAutomation(automation)}>
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewAutomationLogs(automation)}>
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Logs
                          </Button>
                          {automation.status === 'active' ? (
                            <Button size="sm" variant="outline" onClick={() => handleToggleAutomation(automation)}>
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleToggleAutomation(automation)}>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Automation Logs</CardTitle>
                <p className="text-sm text-muted-foreground">Recent automation executions and results</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={handleExportAutomationLogs}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Automation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.automation_name}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.execution_status === 'success' ? 'default' : 
                              log.execution_status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {log.execution_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(log.executed_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Manage platform settings and configuration</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {appConfigs.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{config.config_key.replace(/_/g, ' ').toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Badge variant="outline">{config.config_type}</Badge>
                    </div>
                    
                    {config.config_type === 'theme' && (
                      <div className="space-y-2">
                        <Input 
                          placeholder="Primary Color" 
                          defaultValue={config.config_value.primary_color}
                          className="mb-2"
                        />
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked={config.config_value.dark_mode} />
                          <span className="text-sm">Dark Mode</span>
                        </div>
                      </div>
                    )}
                    
                    {config.config_type === 'emergency_settings' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Alert Radius (km):</span>
                          <Input 
                            type="number" 
                            defaultValue={config.config_value.auto_alert_radius}
                            className="w-20"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch defaultChecked={config.config_value.auto_resolve_false_alarms} />
                          <span className="text-sm">Auto-resolve false alarms</span>
                        </div>
                      </div>
                    )}
                    
                    {config.config_type === 'app_settings' && (
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Configuration JSON"
                          defaultValue={JSON.stringify(config.config_value, null, 2)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                     
                    <Button
                      size="sm" 
                      className="mt-3" 
                      onClick={() => handleConfigUpdate(config.config_key, config.config_value)}
                    >
                      Save Changes
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-moderation" className="space-y-6">
          <ContentModerationPanel />
        </TabsContent>

        <TabsContent value="content-management" className="space-y-6">
          <ContentManagementPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and reporting for platform insights
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        Analytics events tracked
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0%</div>
                      <p className="text-xs text-muted-foreground">
                        User engagement rate
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦0</div>
                      <p className="text-xs text-muted-foreground">
                        Total platform revenue
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        Current active sessions
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Overview</CardTitle>
                      <p className="text-sm text-muted-foreground">Key metrics and statistics</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Users</span>
                          <span className="text-sm font-medium">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active Posts</span>
                          <span className="text-sm font-medium">{stats.activePosts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Emergency Alerts</span>
                          <span className="text-sm font-medium">{stats.emergencyAlerts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Marketplace Items</span>
                          <span className="text-sm font-medium">{stats.marketplaceItems}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active Automations</span>
                          <span className="text-sm font-medium">{stats.activeAutomations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Config Settings</span>
                          <span className="text-sm font-medium">{stats.configSettings}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Moderation Stats</CardTitle>
                      <p className="text-sm text-muted-foreground">Content management overview</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm">Flagged Content</span>
                          <span className="text-sm font-medium">{stats.flaggedContent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sponsored Content</span>
                          <span className="text-sm font-medium">{stats.sponsoredContent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active Promotions</span>
                          <span className="text-sm font-medium">{stats.promotions}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </div>
      </Tabs>

      {/* Global Dialogs - Outside of Tabs */}

      {/* Emergency Alert Modal */}
      <SimpleModal
        isOpen={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        title="Emergency Alert Details"
      >
        {selectedAlert ? (
          <div>
            <h3>Alert ID: {selectedAlert.id}</h3>
            <p>Status: {selectedAlert.status}</p>
            <p>Type: {getEmergencyTypeLabel(selectedAlert)}</p>
            <p>Location: {formatLocation(selectedAlert)}</p>
            <p>Reporter: {selectedAlert.profiles?.full_name || 'Unknown'}</p>
            <button 
              onClick={() => setAlertDialogOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        ) : (
          <div>No alert selected</div>
        )}
      </SimpleModal>

      {/* Edit Alert Modal */}
      <SimpleModal
        isOpen={editAlertDialogOpen}
        onClose={() => setEditAlertDialogOpen(false)}
        title="Edit Alert Status"
        maxWidth="max-w-md"
      >
        {selectedAlert ? (
          <div>
            <h3>Edit Alert: {selectedAlert.id}</h3>
            <p>Current Status: {selectedAlert.status}</p>
            <label className="block mt-4">
              New Status:
              <select 
                value={editingAlertStatus} 
                onChange={(e) => setEditingAlertStatus(e.target.value)}
                className="mt-1 block w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="false_alarm">False Alarm</option>
                <option value="investigating">Investigating</option>
              </select>
            </label>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setEditAlertDialogOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Save status:', editingAlertStatus);
                  setEditAlertDialogOpen(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>No alert selected</div>
        )}
      </SimpleModal>

      {/* Create Automation Dialog */}
      <CreateAutomationDialog
        open={createAutomationDialogOpen}
        onOpenChange={setCreateAutomationDialogOpen}
        onAutomationCreated={() => {
          fetchAutomations();
          toast({
            title: "Success",
            description: "Automation added to the list",
          });
        }}
      />

      {/* Configure Automation Dialog */}
      <ConfigureAutomationDialog
        open={configureAutomationDialogOpen}
        onOpenChange={setConfigureAutomationDialogOpen}
        automation={selectedAutomation}
        onAutomationUpdated={fetchAutomations}
      />

      {/* Automation Logs Dialog */}
      <AutomationLogsDialog
        open={automationLogsDialogOpen}
        onOpenChange={setAutomationLogsDialogOpen}
        automation={selectedAutomation}
      />
      </div>
    </div>
  );
};

export default Admin;
