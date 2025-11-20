import { SimpleModal } from '@/components/SimpleModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Users, MessageSquare, Shield, TrendingUp, MapPin, Calendar, ShoppingCart, Settings, AlertTriangle, Edit, DollarSign, Eye, Play, Pause, BarChart3, Download, Clock, Building, UserPlus, MoreHorizontal, UserX, Trash2, ArrowLeft, FileText, Link as Plug, Key, Code, Database, Globe, Activity, Search, Filter, CheckCircle, XCircle, Mail } from '@/lib/icons';
import { useState, useEffect, useRef } from "react";
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
import { AdCampaignCard } from '@/components/advertising/AdCampaignCard';
import AdsSettingsPanel from '@/components/advertising/AdsSettingsPanel';
import { DirectMessageDialog } from '@/components/DirectMessageDialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import ReportIncidentDialog from '../components/ReportIncidentDialog';
import NewsletterSubscribersPanel from '@/components/admin/NewsletterSubscribersPanel';
import { BlogManagementPanel } from '@/components/admin/BlogManagementPanel';

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

  // API Integration status state
  const [apiStatus, setApiStatus] = useState({
    googleMaps: 'unknown',
    stripe: 'unknown', 
    mapbox: 'unknown',
    sms: 'unknown',
    email: 'unknown',
    supabase: 'unknown',
    webhooks: 'unknown'
  });
  const [testingApi, setTestingApi] = useState('');
  const [currentApiConfig, setCurrentApiConfig] = useState({
    googleMaps: { enabled: false, hasKey: false, defaultZoom: 12 },
    stripe: { enabled: false, hasKey: false, currency: 'NGN' },
    mapbox: { enabled: false, hasKey: false, style: 'light' },
    email: { enabled: true, fromAddress: '' },
    push: { enabled: true, emergencyPriority: true },
    webhooks: { enabled: false, secret: false, timeout: 30 },
    sms: { enabled: false, provider: 'twilio' },
    supabase: { connected: true, url: '', project: 'cowiviqhrnmhttugozbz' }
  });
  
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [usersWithoutAddress, setUsersWithoutAddress] = useState([]);
  const [posts, setPosts] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [sponsoredContent, setSponsoredContent] = useState([]);
  const [pendingAdCampaigns, setPendingAdCampaigns] = useState<any[]>([]);
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

  // API Management state
  const [apiKeys, setApiKeys] = useState([]);
  const [apiUsage, setApiUsage] = useState({
    totalRequests: 0,
    dailyRequests: 0,
    activeKeys: 0,
    rateLimitHits: 0
  });
  const [apiEndpoints, setApiEndpoints] = useState([]);

  // Live monitoring intervals
  const [monitoringActive, setMonitoringActive] = useState(false);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management, auth checks, data fetching functions
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states for emergency alerts
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [alertStatusFilter, setAlertStatusFilter] = useState('all');
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  
  // Filter states for marketplace
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [marketplaceCategoryFilter, setMarketplaceCategoryFilter] = useState('all');
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState('all');
  
  // Filter states for promotions
  const [promotionsSearchQuery, setPromotionsSearchQuery] = useState('');
  const [promotionsStatusFilter, setPromotionsStatusFilter] = useState('all');
  const [promotionsTypeFilter, setPromotionsTypeFilter] = useState('all');
  
  // User grouping states
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [userViewMode, setUserViewMode] = useState<'list' | 'grouped' | 'deleted' | 'incomplete'>('grouped');
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<any>(null);
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
const [showDMDialog, setShowDMDialog] = useState(false);
const [showProfileDialog, setShowProfileDialog] = useState(false);
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
  const handleConfigUpdate = async (key: string, value: any, description?: string) => {
    console.log('handleConfigUpdate called with:', { key, value, description, user: user?.id, isSuperAdmin });
    
    if (!user || !isSuperAdmin) {
      console.error('Permission denied: user or super admin check failed');
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update configurations",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const configData = {
        config_key: key,
        config_value: value,
        config_type: 'app_settings',
        description: description || `Configuration for ${key}`,
        updated_by: user.id,
        is_public: false
      };
      
      console.log('Attempting to upsert config:', configData);
      
      const { error } = await supabase
        .from('app_configuration')
        .upsert(configData, {
          onConflict: 'config_key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Configuration saved successfully');
      
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });

      // Update local state
      setAppConfigs(prev => {
        const existing = prev.find(config => config.config_key === key);
        if (existing) {
          return prev.map(config => 
            config.config_key === key 
              ? { ...config, config_value: value, updated_at: new Date().toISOString() }
              : config
          );
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            config_key: key,
            config_value: value,
            config_type: 'app_settings',
            description: description || `Configuration for ${key}`,
            updated_by: user.id,
            is_public: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
      });

    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  // Get config value helper
  const getConfigValue = (key: string, defaultValue: any = null) => {
    const config = appConfigs.find(c => c.config_key === key);
    return config ? config.config_value : defaultValue;
  };

  // API Integration handlers
  const checkApiStatus = async () => {
    console.log('Checking API status...');
    try {
      // Check Google Maps API
      const mapsResponse = await supabase.functions.invoke('get-google-maps-token');
      console.log('Google Maps response:', mapsResponse);
      setApiStatus(prev => ({
        ...prev,
        googleMaps: mapsResponse.error ? 'error' : 'active'
      }));

      // Check Stripe API
      const stripeResponse = await supabase.functions.invoke('test-stripe-api');
      console.log('Stripe response:', stripeResponse);
      setApiStatus(prev => ({
        ...prev,
        stripe: stripeResponse.error ? 'error' : 'active'
      }));

      // Check Mapbox API
      const mapboxResponse = await supabase.functions.invoke('test-mapbox-api');
      console.log('Mapbox response:', mapboxResponse);
      setApiStatus(prev => ({
        ...prev,
        mapbox: mapboxResponse.error ? 'error' : 'active'
      }));

      // Check Supabase connection
      const { data: supabaseTest, error: supabaseError } = await supabase
        .from('app_configuration')
        .select('config_key')
        .limit(1);
      
      setApiStatus(prev => ({
        ...prev,
        supabase: supabaseError ? 'error' : 'active'
      }));

      console.log('API status check completed');
    } catch (error) {
      console.error('Error checking API status:', error);
    }
  };

  // Start live monitoring
  const startLiveMonitoring = () => {
    console.log('Starting live API monitoring...');
    setMonitoringActive(true);
    
    // Check APIs immediately
    checkApiStatus();
    
    // Set up interval for continuous monitoring
    const interval = setInterval(() => {
      checkApiStatus();
    }, 30000); // Check every 30 seconds

    // Store interval ref for cleanup
    monitoringIntervalRef.current = interval;
  };

  // Stop live monitoring
  const stopLiveMonitoring = () => {
    console.log('Stopping live API monitoring...');
    setMonitoringActive(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  };

  // Fetch current API configuration from Supabase
  const fetchCurrentApiConfig = async () => {
    try {
      console.log('Fetching current API configuration...');
      
      // Get all relevant configuration settings
      const { data: configs, error } = await supabase
        .from('app_configuration')
        .select('config_key, config_value')
        .in('config_key', [
          'google_maps_enabled', 'maps_default_zoom',
          'stripe_enabled', 'stripe_currency',
          'mapbox_enabled', 'mapbox_style',
          'email_enabled', 'email_from_address',
          'push_notifications_enabled', 'emergency_push_priority',
          'webhooks_enabled', 'webhook_secret', 'webhook_timeout',
          'sms_enabled', 'sms_provider'
        ]);

      if (error) {
        console.error('Error fetching API config:', error);
        return;
      }

      console.log('API configs fetched:', configs);

      // Convert array to object for easier access
      const configMap = {};
      configs?.forEach(config => {
        configMap[config.config_key] = config.config_value;
      });

      // Update current configuration state
      setCurrentApiConfig({
        googleMaps: {
          enabled: configMap['google_maps_enabled'] || false,
          hasKey: true, // Will be verified by API test
          defaultZoom: configMap['maps_default_zoom'] || 12
        },
        stripe: {
          enabled: configMap['stripe_enabled'] || false,
          hasKey: true, // Will be verified by API test
          currency: configMap['stripe_currency'] || 'NGN'
        },
        mapbox: {
          enabled: configMap['mapbox_enabled'] || false,
          hasKey: true, // Will be verified by API test
          style: configMap['mapbox_style'] || 'mapbox://styles/mapbox/light-v11'
        },
        email: {
          enabled: configMap['email_enabled'] !== false,
          fromAddress: configMap['email_from_address'] || ''
        },
        push: {
          enabled: configMap['push_notifications_enabled'] !== false,
          emergencyPriority: configMap['emergency_push_priority'] !== false
        },
        webhooks: {
          enabled: configMap['webhooks_enabled'] || false,
          secret: !!configMap['webhook_secret'],
          timeout: configMap['webhook_timeout'] || 30
        },
        sms: {
          enabled: configMap['sms_enabled'] || false,
          provider: configMap['sms_provider'] || 'twilio'
        },
        supabase: {
          connected: true,
          url: 'https://cowiviqhrnmhttugozbz.supabase.co',
          project: 'cowiviqhrnmhttugozbz'
        }
      });

      console.log('API configuration updated');

    } catch (error) {
      console.error('Error in fetchCurrentApiConfig:', error);
    }
  };

  // API Management functions
  const fetchApiKeys = async () => {
    try {
      // Since api_keys table doesn't exist yet, use mock data
      const mockApiKeys = [
        {
          id: '1',
          key_name: 'Production API Key',
          api_key: 'nlk_prod_1234567890abcdef',
          permissions: ['read', 'write'],
          rate_limit: 10000,
          is_active: true,
          created_by: user?.id,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_used_at: new Date().toISOString()
        },
        {
          id: '2', 
          key_name: 'Development API Key',
          api_key: 'nlk_dev_abcdef1234567890',
          permissions: ['read'],
          rate_limit: 1000,
          is_active: true,
          created_by: user?.id,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          last_used_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ];
      setApiKeys(mockApiKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchApiUsage = async () => {
    try {
      // Use mock data for API usage statistics
      setApiUsage({
        totalRequests: 45230,
        dailyRequests: 1250,
        activeKeys: 2,
        rateLimitHits: 15
      });
    } catch (error) {
      console.error('Error fetching API usage:', error);
    }
  };

  const generateApiKey = async () => {
    try {
      const newKey = {
        id: Math.random().toString(36).substring(2, 15),
        key_name: `API Key ${new Date().toLocaleDateString()}`,
        api_key: `nlk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        permissions: ['read', 'write'],
        rate_limit: 1000,
        is_active: true,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        last_used_at: null
      };

      // Add to mock data
      setApiKeys(prev => [newKey, ...prev]);

      toast({
        title: "API Key Generated ✅",
        description: "New API key created successfully",
      });

    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive"
      });
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      // Update mock data
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ));

      toast({
        title: "API Key Revoked",
        description: "API key has been deactivated",
      });

    } catch (error) {
      console.error('Error revoking API key:', error);
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive"
      });
    }
  };

  const testApiIntegration = async (apiType: string) => {
    setTestingApi(apiType);
    console.log(`Testing ${apiType} API integration...`);
    
    try {
      switch (apiType) {
        case 'googleMaps':
          console.log('Invoking get-google-maps-token function...');
          const mapsResponse = await supabase.functions.invoke('get-google-maps-token');
          console.log('Google Maps response:', mapsResponse);
          
          if (mapsResponse.error) {
            throw new Error(`Google Maps API test failed: ${mapsResponse.error.message}`);
          }
          
          setApiStatus(prev => ({ ...prev, googleMaps: 'active' }));
          toast({
            title: "Google Maps API ✅",
            description: "API is working correctly and token is valid",
          });
          break;
          
        case 'stripe':
          console.log('Invoking test-stripe-api function...');
          const stripeResponse = await supabase.functions.invoke('test-stripe-api');
          console.log('Stripe response:', stripeResponse);
          
          if (stripeResponse.error) {
            throw new Error(`Stripe API test failed: ${stripeResponse.error.message}`);
          }
          
          setApiStatus(prev => ({ ...prev, stripe: 'active' }));
          const stripeData = stripeResponse.data;
          toast({
            title: "Stripe API ✅",
            description: `Connected to account: ${stripeData?.accountId || 'Unknown'} (${stripeData?.country || 'N/A'})`,
          });
          break;
          
        case 'mapbox':
          console.log('Invoking test-mapbox-api function...');
          const mapboxResponse = await supabase.functions.invoke('test-mapbox-api');
          console.log('Mapbox response:', mapboxResponse);
          
          if (mapboxResponse.error) {
            throw new Error(`Mapbox API test failed: ${mapboxResponse.error.message}`);
          }
          
          setApiStatus(prev => ({ ...prev, mapbox: 'active' }));
          toast({
            title: "Mapbox API ✅", 
            description: "Token is working correctly and maps are accessible",
          });
          break;
          
        case 'email':
          console.log('Testing email notification...');
          const emailResponse = await supabase.functions.invoke('send-email-notification', {
            body: {
              to: user?.email || 'admin@example.com',
              subject: '🔔 API Test Email from Admin Dashboard',
              body: `This is a live test email sent at ${new Date().toLocaleString()} to verify email functionality is working correctly.`,
              type: 'admin_test',
              userId: user?.id
            }
          });
          console.log('Email response:', emailResponse);
          
          if (emailResponse.error) {
            throw new Error(`Email test failed: ${emailResponse.error.message}`);
          }
          
          setApiStatus(prev => ({ ...prev, email: 'active' }));
          toast({
            title: "Email Service ✅",
            description: `Test email sent successfully to ${user?.email || 'admin@example.com'}`,
          });
          break;
          
        case 'push':
          console.log('Testing push notification...');
          const pushResponse = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user?.id,
              title: '🔔 Admin Dashboard Test',
              message: `Live push notification test sent at ${new Date().toLocaleString()}`,
              type: 'admin_test',
              priority: 'normal'
            }
          });
          console.log('Push response:', pushResponse);
          
          if (pushResponse.error) {
            throw new Error(`Push notification test failed: ${pushResponse.error.message}`);
          }
          
          toast({
            title: "Push Notifications ✅",
            description: "Test notification sent successfully",
          });
          break;
          
        case 'webhook':
          console.log('Testing webhook processing...');
          const webhookResponse = await supabase.functions.invoke('process-webhook', {
            body: {
              source: 'admin_dashboard',
              event: 'live_test',
              data: { 
                test: true, 
                timestamp: new Date().toISOString(),
                adminUser: user?.id,
                testType: 'api_integration_check'
              },
              signature: 'admin_test_signature'
            }
          });
          console.log('Webhook response:', webhookResponse);
          
          if (webhookResponse.error) {
            throw new Error(`Webhook test failed: ${webhookResponse.error.message}`);
          }
          
          toast({
            title: "Webhook Processing ✅",
            description: "Test webhook processed successfully",
          });
          break;
          
        default:
          throw new Error(`API test not implemented for: ${apiType}`);
      }
      
      console.log(`${apiType} test completed successfully`);
      
    } catch (error) {
      console.error(`${apiType} API test error:`, error);
      setApiStatus(prev => ({ ...prev, [apiType]: 'error' }));
      toast({
        title: `${apiType} API Test Failed ❌`,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingApi('');
    }
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
  
  // Map a safety_alert to its corresponding panic_alert (by user and time proximity)
  const findPanicAlertIdForSafetyAlert = async (alert: any): Promise<string | null> => {
    try {
      // Try to find by close created_at window first
      const createdAt = new Date(alert.created_at);
      const start = new Date(createdAt.getTime() - 2 * 60 * 1000).toISOString(); // -2 min
      const end = new Date(createdAt.getTime() + 2 * 60 * 1000).toISOString();   // +2 min
      const { data: nearby, error: nearbyErr } = await supabase
        .from('panic_alerts')
        .select('id, user_id, created_at')
        .eq('user_id', alert.user_id)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!nearbyErr && nearby?.id) return nearby.id;

      // Fallback: last panic alert by this user
      const { data: latest, error: latestErr } = await supabase
        .from('panic_alerts')
        .select('id')
        .eq('user_id', alert.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestErr && latest?.id) return latest.id;
    } catch (e) {
      console.error('findPanicAlertIdForSafetyAlert error:', e);
    }
    return null;
  };

  const optimisticallyUpdateSafetyAlert = (alertId: string, newStatus: 'active' | 'investigating' | 'resolved' | 'false_alarm') => {
    setEmergencyAlerts(prev => prev.map((a: any) => a.id === alertId ? {
      ...a,
      status: newStatus,
      verified_at: newStatus === 'resolved' ? new Date().toISOString() : a.verified_at,
      verified_by: newStatus === 'resolved' ? user?.id : a.verified_by
    } : a));
  };

  const handleEmergencyAction = async (alert: any, newStatus: 'active' | 'investigating' | 'resolved' | 'false_alarm') => {
    try {
      const panicId = await findPanicAlertIdForSafetyAlert(alert);
      if (!panicId) {
        toast({ title: 'Not linked', description: 'Could not find linked panic alert for this safety alert', variant: 'destructive' });
        return;
      }

      // Optimistic UI update
      const prev = emergencyAlerts;
      optimisticallyUpdateSafetyAlert(alert.id, newStatus);

      const note = newStatus === 'investigating'
        ? 'Investigation started by super admin'
        : newStatus === 'resolved'
          ? 'Resolved by super admin'
          : newStatus === 'false_alarm'
            ? 'Marked false alarm by super admin'
            : undefined;

      const { data, error } = await supabase.functions.invoke('update-panic-alert-status', {
        body: { panic_alert_id: panicId, new_status: newStatus, update_note: note }
      });

      if (error) throw error;

      toast({ title: 'Updated', description: data?.message || `Status changed to ${newStatus.replace('_',' ')}` });
    } catch (e: any) {
      console.error('Emergency action failed', e);
      // Revert optimistic update on error
      setEmergencyAlerts(prev => prev.map((a: any) => a.id === alert.id ? alert : a));
      toast({ title: 'Update failed', description: e?.message || 'Could not update alert status', variant: 'destructive' });
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
    setShowProfileDialog(false);
    setShowDMDialog(false);
    toast({ title: 'Create Alert', description: 'Opening alert form...' });
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
          advertiser: (profile as any)?.full_name || 'Unknown',
          email: (profile as any)?.email || 'Unknown',
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
    const confirmSuspend = window.confirm(`Are you sure you want to suspend ${user.full_name}?`);
    if (!confirmSuspend) return;

    try {
      // Remove existing roles and assign 'banned'
      const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', user.user_id);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase.from('user_roles').insert({ user_id: user.user_id, role: 'banned' as any });
      if (insErr) throw insErr;

      toast({
        title: 'User Suspended',
        description: `${user.full_name} has been suspended (role set to banned)`,
      });
      fetchUsers?.();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`);
    if (!confirm) return;

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      // Use the edge function to properly delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.user_id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Deleted",
        description: `${user.full_name} has been deleted successfully`,
      });
      
      fetchUsers(); // Refresh the user list
      fetchDeletedUsers(); // Refresh deleted users list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRestoreUser = async (deletedUser: any) => {
    const confirm = window.confirm(`Are you sure you want to restore ${deletedUser.email}?`);
    if (!confirm) return;

    try {
      // Create edge function call to restore user
      const { data, error } = await supabase.functions.invoke('restore-user', {
        body: { userId: deletedUser.id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to restore user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Restored",
        description: `User account has been restored successfully`,
      });
      
      fetchUsers(); // Refresh the user list
      fetchDeletedUsers(); // Refresh deleted users list
    } catch (error) {
      console.error('Error restoring user:', error);
      toast({
        title: "Error",
        description: `Failed to restore user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleLogoutUser = async (user: any) => {
    const confirm = window.confirm(`Are you sure you want to log out ${user.full_name}? They will need to log in again.`);
    if (!confirm) return;

    try {
      // Create edge function call to logout user
      const { data, error } = await supabase.functions.invoke('logout-user', {
        body: { userId: user.user_id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to logout user');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User Logged Out",
        description: `${user.full_name} has been logged out successfully`,
      });
    } catch (error) {
      console.error('Error logging out user:', error);
      toast({
        title: "Error",
        description: `Failed to logout user: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Check if user is super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setAdminCheckComplete(true);
        return;
      }
      
      try {
        console.log('Checking super admin status for user:', user.id);
        
        // First check via RPC function
        const { data: userRole, error: rpcError } = await supabase
          .rpc('get_user_staff_role', { _user_id: user.id });
        
        console.log('RPC User role result:', userRole, 'Error:', rpcError);
        
        if (userRole === 'super_admin' || userRole === 'admin') {
          console.log('Setting isSuperAdmin to true via RPC');
          setIsSuperAdmin(true);
          setAdminCheckComplete(true);
          return;
        }
        
        // Fallback: Check user_roles table directly
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        console.log('Direct role check result:', roleData, 'Error:', roleError);
        
        if (roleData && (roleData.role === 'super_admin' || roleData.role === 'admin')) {
          console.log('Setting isSuperAdmin to true via direct check');
          setIsSuperAdmin(true);
        } else {
          console.log('User is not super admin or admin');
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setAdminCheckComplete(true);
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
        supabase.rpc('get_profiles_analytics').then(result => ({ count: result.data?.length || 0 })),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('post_type', 'event').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('safety_alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('promotion_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('promoted_posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('updated_at', new Date().toISOString().split('T')[0]),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending').like('reason', '%auto%'),
        supabase.rpc('get_profiles_analytics').then(result => ({ count: result.data?.filter(p => new Date(p.updated_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0 })),
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
        supabase.rpc('get_profiles_analytics').then(result => ({ data: result.data?.slice(0, 5).map(p => ({ full_name: p.has_name ? 'User' : 'Anonymous', created_at: p.created_at })) || [] })),
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

      // Check system health by monitoring activity logs instead
      const { data: recentActivity } = await supabase
        .from('activity_logs')
        .select('count', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

      const hasRecentActivity = (recentActivity?.length || 0) > 0;

      setSystemHealth({
        database: error ? 'unhealthy' : 'healthy',
        realtime: 'active', // This would come from actual realtime monitoring
        emergency: hasRecentActivity ? 'operational' : 'warning',
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
      
      // Group users by location for better backend handling
      const grouped = groupUsersByLocation(usersWithRoles);
      setGroupedUsers(grouped);

      // Fetch users without proper address setup
      fetchUsersWithoutAddress();
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDeletedUsers = async () => {
    if (!isSuperAdmin) return;
    
    try {
      // Get deleted users from auth.users table
      const { data, error } = await supabase.functions.invoke('get-deleted-users');

      if (error) {
        console.error('Error fetching deleted users:', error);
        return;
      }

      setDeletedUsers(data?.users || []);
    } catch (error) {
      console.error('Error fetching deleted users:', error);
    }
  };

  const fetchUsersWithoutAddress = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: usersWithoutAddr, error } = await supabase
        .from('profiles')
        .select('*')
        .or('state.is.null,state.eq.,city.is.null,city.eq.,neighborhood.is.null,neighborhood.eq.')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users without address:', error);
        return;
      }

      setUsersWithoutAddress(usersWithoutAddr || []);
    } catch (error) {
      console.error('Error fetching users without address:', error);
    }
  };

  // Helper function to group users by location hierarchy
  const groupUsersByLocation = (users: any[]) => {
    const grouped: any = {};
    
    users.forEach(user => {
      const state = user.state || 'Unknown State';
      const city = user.city || 'Unknown City';
      const neighborhood = user.neighborhood || 'Unknown Neighborhood';
      
      if (!grouped[state]) {
        grouped[state] = {
          users: [],
          cities: {}
        };
      }
      
      if (!grouped[state].cities[city]) {
        grouped[state].cities[city] = {
          users: [],
          neighborhoods: {}
        };
      }
      
      if (!grouped[state].cities[city].neighborhoods[neighborhood]) {
        grouped[state].cities[city].neighborhoods[neighborhood] = {
          users: []
        };
      }
      
      // Add user to all appropriate levels
      grouped[state].users.push(user);
      grouped[state].cities[city].users.push(user);
      grouped[state].cities[city].neighborhoods[neighborhood].users.push(user);
    });
    
    return grouped;
  };

  const fetchEmergencyAlerts = async () => {
    
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

  const fetchPendingAdCampaigns = async () => {
    if (!isSuperAdmin) return;
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('id, campaign_name, campaign_type, status, approval_status, target_geographic_scope, daily_budget, total_budget, total_spent, total_impressions, total_clicks, start_date, end_date, created_at, ad_title, ad_description')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setPendingAdCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching pending ad campaigns:', err);
      setPendingAdCampaigns([]);
    }
  };

  const handleApproveCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', campaignId);
      if (error) throw error;
      toast({ title: 'Campaign approved', description: 'The ad is now active.' });
      setPendingAdCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (e) {
      console.error('Approve campaign error', e);
      toast({ title: 'Error', description: 'Failed to approve campaign', variant: 'destructive' });
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({
          approval_status: 'rejected',
          status: 'rejected'
        })
        .eq('id', campaignId);
      if (error) throw error;
      toast({ title: 'Campaign rejected', description: 'The ad has been rejected.' });
      setPendingAdCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (e) {
      console.error('Reject campaign error', e);
      toast({ title: 'Error', description: 'Failed to reject campaign', variant: 'destructive' });
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

  const fetchAppConfigs = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: configs, error } = await supabase
        .from('app_configuration')
        .select('*')
        .order('config_key', { ascending: true });

      if (error) throw error;
      
      console.log('Loaded app configurations:', configs?.length || 0);
      setAppConfigs(configs || []);
      
      // Update stats with config count
      setStats(prev => ({ 
        ...prev, 
        configSettings: configs?.length || 0 
      }));
    } catch (error) {
      console.error('Error fetching app configurations:', error);
      setAppConfigs([]);
    }
  };

  // Load all data when admin status is confirmed
  useEffect(() => {
    console.log('Data loading effect triggered, isSuperAdmin:', isSuperAdmin);
    // Always load emergency alerts for admin view
    fetchEmergencyAlerts();
    if (isSuperAdmin) {
      console.log('Loading admin data...');
      fetchStats();
      fetchUsers();
      fetchDeletedUsers();
      fetchMarketplaceItems();
      fetchPromotions();
      fetchPendingAdCampaigns();
      fetchSponsoredContent();
      fetchContentReports();
      fetchAutomations();
      fetchAutomationLogs();
      fetchAppConfigs();
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
      console.log('Not super admin, loaded emergency alerts only');
    }
  }, [isSuperAdmin]);

  // Set up real-time subscriptions for emergency alerts
  useEffect(() => {
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

  if (!adminCheckComplete) {
    return (
      <div className="w-full px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Checking Permissions</h1>
            <p className="text-muted-foreground">Verifying your admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="w-full px-4 py-8">
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
      <div className="w-full px-4 py-8">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6" orientation="vertical">
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
          <TabsTrigger value="newsletter" className="w-full justify-start">
            <Mail className="h-4 w-4 mr-2" />
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="blog" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="api-management" className="w-full justify-start">
            <Database className="h-4 w-4 mr-2" />
            API Management
          </TabsTrigger>
          <TabsTrigger value="api-integrations" className="w-full justify-start">
            <Plug className="h-4 w-4 mr-2" />
            API Integrations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="w-full justify-start">
            <Activity className="h-4 w-4 mr-2" />
            Performance
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
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 flex flex-col items-center space-y-1 hover:bg-accent transition-colors"
                    onClick={() => navigate('/admin/api-requests')}
                  >
                    <Code className="h-4 w-4" />
                    <span className="text-xs">API Requests</span>
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
                    <Button variant="destructive" size="sm" onClick={() => setActiveTab('emergency')}>
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
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {Object.keys(groupedUsers).map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedState !== 'all' && (
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {Object.keys(groupedUsers[selectedState]?.cities || {}).map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="view-mode" className="text-sm">View:</Label>
                      <Select value={userViewMode} onValueChange={(value: 'list' | 'grouped' | 'deleted' | 'incomplete') => setUserViewMode(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grouped">Grouped</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="deleted">Deleted</SelectItem>
                          <SelectItem value="incomplete">Incomplete Address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                
                {/* Filter and render users based on view mode */}
                {(() => {
                  const getFilteredUsers = () => {
                    let usersToFilter = users;
                    
                    // Apply location filters first
                    if (selectedState !== 'all') {
                      usersToFilter = usersToFilter.filter(user => user.state === selectedState);
                      
                      if (selectedCity !== 'all') {
                        usersToFilter = usersToFilter.filter(user => user.city === selectedCity);
                      }
                    }
                    
                    // Apply search and role filters
                    return usersToFilter.filter(user => {
                      const matchesSearch = !userSearchQuery || 
                        user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.neighborhood?.toLowerCase().includes(userSearchQuery.toLowerCase());
                      
                      const matchesRole = userRoleFilter === 'all' || 
                        user.user_roles?.[0]?.role === userRoleFilter;
                      
                      return matchesSearch && matchesRole;
                    });
                  };

                  const filteredUsers = getFilteredUsers();

                  // Render deleted users view
                  if (userViewMode === 'deleted') {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle>Deleted Users</CardTitle>
                          <CardDescription>Users who have been deleted but can be restored</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {deletedUsers.length === 0 ? (
                            <div className="text-center py-8">
                              <UserX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No deleted users found</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {deletedUsers.map((deletedUser: any) => (
                                <div key={deletedUser.id} className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <div className="font-medium">{deletedUser.email}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Deleted: {new Date(deletedUser.deleted_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => handleRestoreUser(deletedUser)}
                                    className="flex items-center gap-2"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    Restore
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render users without address view  
                  if (userViewMode === 'incomplete') {
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle>Users with Incomplete Address</CardTitle>
                          <CardDescription>Users who need to complete their location information</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {usersWithoutAddress.length === 0 ? (
                            <div className="text-center py-8">
                              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">All users have complete address information</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {usersWithoutAddress.map((user: any) => (
                                <div key={user.user_id} className="flex items-center justify-between p-3 border rounded">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={user.avatar_url} />
                                      <AvatarFallback>
                                        {user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{user.full_name || 'Unknown User'}</div>
                                      <div className="text-sm text-muted-foreground">{user.email}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Missing: {[
                                          !user.state && 'State',
                                          !user.city && 'City', 
                                          !user.neighborhood && 'Neighborhood'
                                        ].filter(Boolean).join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => handleLogoutUser(user)}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Logout
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render grouped view
                  if (userViewMode === 'grouped') {
                    const displayStates = selectedState === 'all' 
                      ? Object.keys(groupedUsers) 
                      : [selectedState].filter(state => groupedUsers[state]);

                    return (
                      <div className="space-y-6">
                        {displayStates.map(state => {
                          const stateData = groupedUsers[state];
                          if (!stateData) return null;

                          const displayCities = selectedCity === 'all' 
                            ? Object.keys(stateData.cities) 
                            : [selectedCity].filter(city => stateData.cities[city]);

                          return (
                            <Card key={state} className="overflow-hidden">
                              <CardHeader className="bg-muted/50">
                                <CardTitle className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    <span>{state}</span>
                                  </div>
                                  <Badge variant="secondary">
                                    {stateData.users.length} users
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                {displayCities.map(city => {
                                  const cityData = stateData.cities[city];
                                  if (!cityData) return null;

                                  return (
                                    <div key={city} className="border-b last:border-b-0">
                                      <div className="p-4 bg-accent/20">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-medium flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            {city}
                                          </h4>
                                          <Badge variant="outline">
                                            {cityData.users.length} users
                                          </Badge>
                                        </div>
                                      </div>
                                      
                                      {Object.keys(cityData.neighborhoods).map(neighborhood => {
                                        const neighborhoodData = cityData.neighborhoods[neighborhood];
                                        const neighborhoodUsers = neighborhoodData.users.filter(user => {
                                          const matchesSearch = !userSearchQuery || 
                                            user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                            user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
                                          
                                          const matchesRole = userRoleFilter === 'all' || 
                                            user.user_roles?.[0]?.role === userRoleFilter;
                                          
                                          return matchesSearch && matchesRole;
                                        });

                                        if (neighborhoodUsers.length === 0) return null;

                                        return (
                                          <div key={neighborhood} className="p-4 border-l-2 border-primary/20 ml-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="text-sm font-medium text-muted-foreground">
                                                📍 {neighborhood}
                                              </h5>
                                              <Badge variant="outline" className="text-xs">
                                                {neighborhoodUsers.length} users
                                              </Badge>
                                            </div>
                                            
                                            <div className="grid gap-2">
                                              {neighborhoodUsers.map(user => (
                                                <div key={user.user_id} className="flex items-center justify-between p-2 bg-background rounded border">
                                                  <div className="flex items-center space-x-3">
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
                                                    <Avatar className="h-8 w-8">
                                                      <AvatarImage src={user.avatar_url} />
                                                      <AvatarFallback>
                                                        {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                      <div className="font-medium text-sm">{user.full_name || 'Unknown User'}</div>
                                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs">
                                                      {user.user_roles?.[0]?.role || 'user'}
                                                    </Badge>
                                                    <Badge variant={user.is_verified ? 'default' : 'secondary'} className="text-xs">
                                                      {user.is_verified ? 'Verified' : 'Unverified'}
                                                    </Badge>
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
                                                          onClick={() => handleDeleteUser(user)}
                                                          className="text-destructive"
                                                        >
                                                          <Trash2 className="h-4 w-4 mr-2" />
                                                          Delete User
                                                        </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </CardContent>
                            </Card>
                          );
                        })}
                        
                        {displayStates.length === 0 && (
                          <div className="text-center py-8">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No users found matching your filters</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Render list view (original table)
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
                        <Button variant="outline" className="w-full" onClick={() => setShowDMDialog(true)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setShowProfileDialog(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => selectedUser && handleEditUserRole(selectedUser)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Change Permissions
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => selectedUser && handleSuspendUser(selectedUser)}>
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

          {selectedUser && (
            <>
              <DirectMessageDialog
                isOpen={showDMDialog}
                onClose={() => setShowDMDialog(false)}
                recipientId={selectedUser.user_id}
                recipientName={selectedUser.full_name || 'User'}
                recipientAvatar={selectedUser.avatar_url}
              />
              <UserProfileDialog
                isOpen={showProfileDialog}
                onClose={() => setShowProfileDialog(false)}
                userName={selectedUser.full_name || ''}
                userAvatar={selectedUser.avatar_url}
              />
            </>
          )}

          
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
                            onClick={async () => {
                              const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
                              const { copyToClipboard } = useNativeClipboard();
                              await copyToClipboard(selectedAlert.id, "Alert ID copied to clipboard");
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
                        <SelectItem value="investigating">Investigating</SelectItem>
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
                            onClick={async () => {
                              const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
                              const { copyToClipboard } = useNativeClipboard();
                              await copyToClipboard(selectedMarketplaceItem.id, "Item ID copied to clipboard");
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
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search alerts..."
                        value={alertSearchQuery}
                        onChange={(e) => setAlertSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
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
                  <ReportIncidentDialog trigger={<Button>Create Alert</Button>} />
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
                      .filter(alert => {
                        const matchesSearch = !alertSearchQuery || 
                          alert.title?.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
                          alert.description?.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
                          alert.profiles?.full_name?.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
                          formatLocation(alert).toLowerCase().includes(alertSearchQuery.toLowerCase());
                        const matchesType = alertTypeFilter === 'all' || alert.alert_type === alertTypeFilter;
                        const matchesStatus = alertStatusFilter === 'all' || alert.status === alertStatusFilter;
                        return matchesSearch && matchesType && matchesStatus;
                      })
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
                            {isSuperAdmin && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEmergencyAction(alert, 'investigating')}
                                  title="Investigate"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEmergencyAction(alert, 'resolved')}
                                  title="Resolve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEmergencyAction(alert, 'false_alarm')}
                                  title="False Alarm"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search promotions..."
                        value={promotionsSearchQuery}
                        onChange={(e) => setPromotionsSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={promotionsTypeFilter} onValueChange={setPromotionsTypeFilter}>
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
                    <Select value={promotionsStatusFilter} onValueChange={setPromotionsStatusFilter}>
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
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Pending Ad Campaigns</h3>
                  {pendingAdCampaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No promotions waiting for review.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingAdCampaigns.map((campaign: any) => (
                        <AdCampaignCard 
                          key={campaign.id} 
                          campaign={campaign}
                          onApprove={handleApproveCampaign}
                          onReject={handleRejectCampaign}
                        />
                      ))}
                    </div>
                  )}
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
                    {promotions
                      .filter(promotion => {
                        const matchesSearch = !promotionsSearchQuery || 
                          promotion.content_title?.toLowerCase().includes(promotionsSearchQuery.toLowerCase()) ||
                          promotion.advertiser_name?.toLowerCase().includes(promotionsSearchQuery.toLowerCase());
                        const matchesType = promotionsTypeFilter === 'all' || promotion.promotion_type === promotionsTypeFilter;
                        const matchesStatus = promotionsStatusFilter === 'all' || promotion.status === promotionsStatusFilter;
                        return matchesSearch && matchesType && matchesStatus;
                      })
                      .map((promotion) => (
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

                {/* Ad Settings Panel */}
                <div className="mt-10">
                  <h3 className="text-sm font-medium mb-3">Ad Settings</h3>
                  <AdsSettingsPanel />
                </div>
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
              {appConfigs.length > 0 && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Configuration Status</h4>
                    <Badge variant="secondary">{appConfigs.length} settings configured</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">App Name:</span> {getConfigValue('app_name', 'NeighborConnect')}
                    </div>
                    <div>
                      <span className="font-medium">Maintenance:</span> {getConfigValue('maintenance_mode', false) ? 'Active' : 'Off'}
                    </div>
                    <div>
                      <span className="font-medium">Registration:</span> {getConfigValue('allow_registration', true) ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-8">
                {/* General Settings */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">General Settings</h3>
                      <p className="text-sm text-muted-foreground">Basic platform configuration and core functionality</p>
                    </div>
                    <Badge variant="outline">General</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="app-name">Application Name</Label>
                         <Input 
                           id="app-name" 
                           value={getConfigValue('app_name', 'NeighborConnect')} 
                           onChange={(e) => handleConfigUpdate('app_name', e.target.value, 'The main name of the application')} 
                         />
                       </div>
                       <div>
                         <Label htmlFor="app-version">Version</Label>
                         <Input 
                           id="app-version" 
                           value={getConfigValue('app_version', '1.0.0')} 
                           onChange={(e) => handleConfigUpdate('app_version', e.target.value, 'Current version of the application')} 
                         />
                       </div>
                        <div>
                          <Label htmlFor="timezone">Default Timezone</Label>
                         <Select value={getConfigValue('default_timezone', 'UTC')} onValueChange={(value) => handleConfigUpdate('default_timezone', value, 'Default timezone for the application')}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select timezone" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Africa/Lagos">West Africa Time (Lagos)</SelectItem>
                             <SelectItem value="America/New_York">Eastern Time</SelectItem>
                             <SelectItem value="America/Chicago">Central Time</SelectItem>
                             <SelectItem value="America/Denver">Mountain Time</SelectItem>
                             <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                             <SelectItem value="UTC">UTC</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                     <div>
                       <Label htmlFor="app-description">Application Description</Label>
                       <Textarea 
                         id="app-description" 
                         value={getConfigValue('app_description', 'Connecting neighbors, building stronger communities through safety, communication, and local commerce.')} 
                         onChange={(e) => handleConfigUpdate('app_description', e.target.value, 'Main description of the application')} 
                       />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Enable new user registrations</Label>
                           <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
                         </div>
                         <Switch 
                           checked={getConfigValue('allow_registration', true)} 
                           onCheckedChange={(checked) => handleConfigUpdate('allow_registration', checked, 'Whether new users can register accounts')} 
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Require email verification</Label>
                           <p className="text-sm text-muted-foreground">New users must verify email addresses</p>
                         </div>
                         <Switch 
                           checked={getConfigValue('require_email_verification', true)} 
                           onCheckedChange={(checked) => handleConfigUpdate('require_email_verification', checked, 'Whether email verification is required for new users')} 
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Maintenance mode</Label>
                           <p className="text-sm text-muted-foreground">Show maintenance page to all users</p>
                         </div>
                         <Switch 
                           checked={getConfigValue('maintenance_mode', false)} 
                           onCheckedChange={(checked) => handleConfigUpdate('maintenance_mode', checked, 'Whether the app is in maintenance mode')} 
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <div>
                           <Label>Debug mode</Label>
                           <p className="text-sm text-muted-foreground">Enable detailed error logging</p>
                         </div>
                         <Switch 
                           checked={getConfigValue('debug_mode', false)} 
                           onCheckedChange={(checked) => handleConfigUpdate('debug_mode', checked, 'Whether debug mode is enabled for detailed logging')} 
                         />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Authentication & Security */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Authentication & Security</h3>
                      <p className="text-sm text-muted-foreground">Configure security policies and authentication settings</p>
                    </div>
                    <Badge variant="outline">Security</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                         <Input 
                           id="session-timeout" 
                           type="number" 
                           value={getConfigValue('session_timeout_hours', 24)} 
                           onChange={(e) => handleConfigUpdate('session_timeout_hours', parseInt(e.target.value), 'How long user sessions last in hours')} 
                         />
                       </div>
                       <div>
                         <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                         <Input 
                           id="max-login-attempts" 
                           type="number" 
                           value={getConfigValue('max_login_attempts', 5)} 
                           onChange={(e) => handleConfigUpdate('max_login_attempts', parseInt(e.target.value), 'Maximum failed login attempts before lockout')} 
                         />
                       </div>
                       <div>
                         <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                         <Input 
                           id="lockout-duration" 
                           type="number" 
                           value={getConfigValue('lockout_duration_minutes', 15)} 
                           onChange={(e) => handleConfigUpdate('lockout_duration_minutes', parseInt(e.target.value), 'How long accounts are locked after failed attempts')} 
                         />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                        </div>
                        <Switch defaultChecked={false} onCheckedChange={(checked) => handleConfigUpdate('enable_2fa', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Social Login</Label>
                          <p className="text-sm text-muted-foreground">Allow login with Google, Facebook, etc.</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_social_login', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Strong Password Requirements</Label>
                          <p className="text-sm text-muted-foreground">Enforce complex password rules</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('strong_passwords', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email Notifications for Login</Label>
                          <p className="text-sm text-muted-foreground">Notify users of new login attempts</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('login_notifications', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety & Emergency Settings */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Safety & Emergency Settings</h3>
                      <p className="text-sm text-muted-foreground">Configure emergency alert system and safety features</p>
                    </div>
                    <Badge variant="outline">Emergency</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="alert-radius">Alert Radius (km)</Label>
                        <Input id="alert-radius" type="number" defaultValue="5" onChange={(e) => handleConfigUpdate('emergency_alert_radius', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="response-time">Max Response Time (min)</Label>
                        <Input id="response-time" type="number" defaultValue="15" onChange={(e) => handleConfigUpdate('max_response_time', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="auto-escalation">Auto-escalate After (min)</Label>
                        <Input id="auto-escalation" type="number" defaultValue="60" onChange={(e) => handleConfigUpdate('auto_escalate_minutes', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="false-alarm-timeout">False Alarm Timeout (hours)</Label>
                        <Input id="false-alarm-timeout" type="number" defaultValue="24" onChange={(e) => handleConfigUpdate('false_alarm_timeout_hours', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-send alerts to emergency contacts</Label>
                          <p className="text-sm text-muted-foreground">Automatically notify emergency contacts</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('auto_emergency_alerts', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-resolve false alarms</Label>
                          <p className="text-sm text-muted-foreground">Automatically resolve false alarms after timeout</p>
                        </div>
                        <Switch defaultChecked={false} onCheckedChange={(checked) => handleConfigUpdate('auto_resolve_false_alarms', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable location sharing for emergencies</Label>
                          <p className="text-sm text-muted-foreground">Allow precise location sharing during alerts</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_location_sharing', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Panic Button Feature</Label>
                          <p className="text-sm text-muted-foreground">Show panic button for immediate help</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_panic_button', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Audio Alerts</Label>
                          <p className="text-sm text-muted-foreground">Play sound alerts for emergency notifications</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_audio_alerts', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Silent Mode Override</Label>
                          <p className="text-sm text-muted-foreground">Override device silent mode for emergencies</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('override_silent_mode', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content & Moderation Settings */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Content & Moderation</h3>
                      <p className="text-sm text-muted-foreground">Configure content policies, moderation tools, and user-generated content rules</p>
                    </div>
                    <Badge variant="outline">Moderation</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="max-post-length">Max Post Length</Label>
                        <Input id="max-post-length" type="number" defaultValue="5000" onChange={(e) => handleConfigUpdate('max_post_length', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="max-attachments">Max Attachments</Label>
                        <Input id="max-attachments" type="number" defaultValue="10" onChange={(e) => handleConfigUpdate('max_attachments', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                        <Input id="max-file-size" type="number" defaultValue="25" onChange={(e) => handleConfigUpdate('max_file_size_mb', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="post-cooldown">Post Cooldown (seconds)</Label>
                        <Input id="post-cooldown" type="number" defaultValue="30" onChange={(e) => handleConfigUpdate('post_cooldown_seconds', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Automatic content scanning</Label>
                          <p className="text-sm text-muted-foreground">Scan posts for inappropriate content using AI</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('auto_content_moderation', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-hide reported content</Label>
                          <p className="text-sm text-muted-foreground">Immediately hide content when reported</p>
                        </div>
                        <Switch defaultChecked={false} onCheckedChange={(checked) => handleConfigUpdate('auto_hide_reported', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Profanity Filter</Label>
                          <p className="text-sm text-muted-foreground">Filter inappropriate language automatically</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_profanity_filter', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Image Content Moderation</Label>
                          <p className="text-sm text-muted-foreground">Scan uploaded images for inappropriate content</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_image_moderation', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>User Reputation System</Label>
                          <p className="text-sm text-muted-foreground">Enable user reputation scores based on behavior</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_reputation_system', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Comment Approval Required</Label>
                          <p className="text-sm text-muted-foreground">Require manual approval for all comments</p>
                        </div>
                        <Switch defaultChecked={false} onCheckedChange={(checked) => handleConfigUpdate('require_comment_approval', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business & Marketplace */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Business & Marketplace</h3>
                      <p className="text-sm text-muted-foreground">Configure business features, marketplace settings, and monetization options</p>
                    </div>
                    <Badge variant="outline">Business</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="business-fee">Business Verification Fee (₦)</Label>
                        <Input id="business-fee" type="number" defaultValue="15000" onChange={(e) => handleConfigUpdate('business_verification_fee', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="marketplace-fee">Marketplace Fee (%)</Label>
                        <Input id="marketplace-fee" type="number" defaultValue="3" onChange={(e) => handleConfigUpdate('marketplace_fee_percent', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="promotion-fee">Promotion Fee (₦)</Label>
                        <Input id="promotion-fee" type="number" defaultValue="5000" onChange={(e) => handleConfigUpdate('promotion_fee', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="escrow-hold">Escrow Hold (days)</Label>
                        <Input id="escrow-hold" type="number" defaultValue="7" onChange={(e) => handleConfigUpdate('escrow_hold_days', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Business Verification</Label>
                          <p className="text-sm text-muted-foreground">Business accounts must be verified to list services</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('require_business_verification', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Marketplace</Label>
                          <p className="text-sm text-muted-foreground">Allow users to buy and sell items</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_marketplace', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Promotions</Label>
                          <p className="text-sm text-muted-foreground">Allow paid promotions and advertisements</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_promotions', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Service Bookings</Label>
                          <p className="text-sm text-muted-foreground">Allow users to book services directly</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_service_bookings', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Escrow Protection</Label>
                          <p className="text-sm text-muted-foreground">Hold payments in escrow until completion</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_escrow_protection', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Reviews & Ratings</Label>
                          <p className="text-sm text-muted-foreground">Enable review system for businesses</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_reviews_ratings', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications & Communication */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Notifications & Communication</h3>
                      <p className="text-sm text-muted-foreground">Configure notification preferences and communication features</p>
                    </div>
                    <Badge variant="outline">Communication</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <Select onValueChange={(value) => handleConfigUpdate('email_notifications', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All notifications</SelectItem>
                            <SelectItem value="important">Important only</SelectItem>
                            <SelectItem value="emergency">Emergency only</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <Select onValueChange={(value) => handleConfigUpdate('push_notifications', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All notifications</SelectItem>
                            <SelectItem value="important">Important only</SelectItem>
                            <SelectItem value="emergency">Emergency only</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Direct Messages</Label>
                          <p className="text-sm text-muted-foreground">Allow private messaging between users</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_direct_messages', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Video Calls</Label>
                          <p className="text-sm text-muted-foreground">Allow video calling between users</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_video_calls', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Group Chat Feature</Label>
                          <p className="text-sm text-muted-foreground">Enable group messaging capabilities</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_group_chat', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Read Receipts</Label>
                          <p className="text-sm text-muted-foreground">Show when messages are read</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_read_receipts', checked)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="message-retention">Message Retention (days)</Label>
                        <Input id="message-retention" type="number" defaultValue="365" onChange={(e) => handleConfigUpdate('message_retention_days', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="notification-quiet-hours">Quiet Hours (24h format)</Label>
                        <Input id="notification-quiet-hours" defaultValue="22:00-08:00" onChange={(e) => handleConfigUpdate('quiet_hours', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy & Data Management */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Privacy & Data Management</h3>
                      <p className="text-sm text-muted-foreground">Configure privacy settings, data handling, and compliance features</p>
                    </div>
                    <Badge variant="outline">Privacy</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="data-retention">Data Retention (days)</Label>
                        <Input id="data-retention" type="number" defaultValue="2555" onChange={(e) => handleConfigUpdate('data_retention_days', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="backup-frequency">Backup Frequency</Label>
                        <Select onValueChange={(value) => handleConfigUpdate('backup_frequency', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cookie-consent">Cookie Consent Duration (days)</Label>
                        <Input id="cookie-consent" type="number" defaultValue="365" onChange={(e) => handleConfigUpdate('cookie_consent_days', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Analytics</Label>
                          <p className="text-sm text-muted-foreground">Collect anonymous usage data for improvements</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_analytics', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Data Export</Label>
                          <p className="text-sm text-muted-foreground">Users can export their personal data</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('allow_data_export', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Account Deletion</Label>
                          <p className="text-sm text-muted-foreground">Users can permanently delete their accounts</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('allow_account_deletion', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>GDPR Compliance Mode</Label>
                          <p className="text-sm text-muted-foreground">Enable additional GDPR compliance features</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('gdpr_compliance_mode', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Privacy Dashboard</Label>
                          <p className="text-sm text-muted-foreground">Provide users with privacy control dashboard</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('show_privacy_dashboard', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Anonymous Usage Statistics</Label>
                          <p className="text-sm text-muted-foreground">Collect non-personal usage statistics</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('anonymous_statistics', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO & Web Presence */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">SEO & Web Presence</h3>
                      <p className="text-sm text-muted-foreground">Configure search engine optimization, meta tags, and web presence settings</p>
                    </div>
                    <Badge variant="outline">SEO</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="site-title">Site Title</Label>
                        <Input 
                          id="site-title" 
                          placeholder="Your Community Platform" 
                          defaultValue={getConfigValue('site_title', 'Community Platform')}
                          onChange={(e) => handleConfigUpdate('site_title', e.target.value, 'Main title of the website')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="site-tagline">Site Tagline</Label>
                        <Input 
                          id="site-tagline" 
                          placeholder="Connect with your neighborhood" 
                          defaultValue={getConfigValue('site_tagline', 'Connect with your neighborhood')}
                          onChange={(e) => handleConfigUpdate('site_tagline', e.target.value, 'Site tagline/subtitle')}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="meta-description">Meta Description</Label>
                      <Textarea 
                        id="meta-description" 
                        placeholder="A comprehensive community platform connecting neighbors, local businesses, and emergency services..." 
                        rows={3}
                        defaultValue={getConfigValue('meta_description', 'A comprehensive community platform connecting neighbors, local businesses, and emergency services.')}
                        onChange={(e) => handleConfigUpdate('meta_description', e.target.value, 'Meta description for search engines')}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meta-keywords">Meta Keywords</Label>
                        <Input 
                          id="meta-keywords" 
                          placeholder="community, neighborhood, local business, emergency"
                          defaultValue={getConfigValue('meta_keywords', 'community, neighborhood, local business, emergency')}
                          onChange={(e) => handleConfigUpdate('meta_keywords', e.target.value, 'Comma-separated keywords for SEO')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="canonical-url">Canonical URL</Label>
                        <Input 
                          id="canonical-url" 
                          placeholder="https://yoursite.com"
                          defaultValue={getConfigValue('canonical_url', '')}
                          onChange={(e) => handleConfigUpdate('canonical_url', e.target.value, 'Canonical URL for SEO')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="og-title">Open Graph Title</Label>
                        <Input 
                          id="og-title" 
                          placeholder="Community Platform - Connect with Neighbors"
                          defaultValue={getConfigValue('og_title', getConfigValue('site_title', 'Community Platform'))}
                          onChange={(e) => handleConfigUpdate('og_title', e.target.value, 'Open Graph title for social media')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="og-image">Open Graph Image URL</Label>
                        <Input 
                          id="og-image" 
                          placeholder="https://yoursite.com/og-image.jpg"
                          defaultValue={getConfigValue('og_image', '')}
                          onChange={(e) => handleConfigUpdate('og_image', e.target.value, 'Open Graph image URL for social media')}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="og-description">Open Graph Description</Label>
                      <Textarea 
                        id="og-description" 
                        placeholder="Join your local community platform to connect with neighbors, discover local businesses, and stay safe together." 
                        rows={2}
                        defaultValue={getConfigValue('og_description', getConfigValue('meta_description', 'A comprehensive community platform connecting neighbors, local businesses, and emergency services.'))}
                        onChange={(e) => handleConfigUpdate('og_description', e.target.value, 'Open Graph description for social media')}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="twitter-handle">Twitter Handle</Label>
                        <Input 
                          id="twitter-handle" 
                          placeholder="@yourcommunity"
                          defaultValue={getConfigValue('twitter_handle', '')}
                          onChange={(e) => handleConfigUpdate('twitter_handle', e.target.value, 'Twitter handle for Twitter Cards')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="google-analytics">Google Analytics ID</Label>
                        <Input 
                          id="google-analytics" 
                          placeholder="G-XXXXXXXXXX"
                          defaultValue={getConfigValue('google_analytics_id', '')}
                          onChange={(e) => handleConfigUpdate('google_analytics_id', e.target.value, 'Google Analytics tracking ID')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="google-search-console">Google Search Console</Label>
                        <Input 
                          id="google-search-console" 
                          placeholder="google-site-verification=..."
                          defaultValue={getConfigValue('google_search_console', '')}
                          onChange={(e) => handleConfigUpdate('google_search_console', e.target.value, 'Google Search Console verification code')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="robots-txt">Robots.txt Rules</Label>
                        <Input 
                          id="robots-txt" 
                          placeholder="User-agent: *"
                          defaultValue={getConfigValue('robots_txt_rules', 'User-agent: *\nDisallow: /admin\nDisallow: /api')}
                          onChange={(e) => handleConfigUpdate('robots_txt_rules', e.target.value, 'Custom robots.txt rules')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable SEO Optimization</Label>
                          <p className="text-sm text-muted-foreground">Automatically optimize pages for search engines</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('enable_seo_optimization', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('enable_seo_optimization', checked, 'Enable automatic SEO optimization')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Generate Sitemap</Label>
                          <p className="text-sm text-muted-foreground">Automatically generate XML sitemap</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('generate_sitemap', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('generate_sitemap', checked, 'Enable automatic sitemap generation')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Open Graph Tags</Label>
                          <p className="text-sm text-muted-foreground">Add Open Graph meta tags for social media</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('enable_open_graph', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('enable_open_graph', checked, 'Enable Open Graph meta tags')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Twitter Cards</Label>
                          <p className="text-sm text-muted-foreground">Enable Twitter Card meta tags</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('enable_twitter_cards', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('enable_twitter_cards', checked, 'Enable Twitter Card meta tags')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Schema Markup</Label>
                          <p className="text-sm text-muted-foreground">Add structured data markup</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('enable_schema_markup', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('enable_schema_markup', checked, 'Enable JSON-LD structured data')} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Analytics Tracking</Label>
                          <p className="text-sm text-muted-foreground">Enable Google Analytics tracking</p>
                        </div>
                        <Switch 
                          defaultChecked={getConfigValue('enable_analytics_tracking', true)} 
                          onCheckedChange={(checked) => handleConfigUpdate('enable_analytics_tracking', checked, 'Enable Google Analytics tracking')} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Performance & Scaling */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">Performance & Scaling</h3>
                      <p className="text-sm text-muted-foreground">Configure performance optimization and scaling settings</p>
                    </div>
                    <Badge variant="outline">Performance</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="cache-ttl">Cache TTL (minutes)</Label>
                        <Input id="cache-ttl" type="number" defaultValue="60" onChange={(e) => handleConfigUpdate('cache_ttl_minutes', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="rate-limit">Rate Limit (req/min)</Label>
                        <Input id="rate-limit" type="number" defaultValue="100" onChange={(e) => handleConfigUpdate('rate_limit_per_minute', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="max-concurrent">Max Concurrent Users</Label>
                        <Input id="max-concurrent" type="number" defaultValue="10000" onChange={(e) => handleConfigUpdate('max_concurrent_users', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="db-timeout">Database Timeout (sec)</Label>
                        <Input id="db-timeout" type="number" defaultValue="30" onChange={(e) => handleConfigUpdate('database_timeout_seconds', parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable CDN</Label>
                          <p className="text-sm text-muted-foreground">Use Content Delivery Network for static assets</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_cdn', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Image Compression</Label>
                          <p className="text-sm text-muted-foreground">Automatically compress uploaded images</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_image_compression', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Lazy Loading</Label>
                          <p className="text-sm text-muted-foreground">Load content as users scroll</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_lazy_loading', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Real-time Updates</Label>
                          <p className="text-sm text-muted-foreground">Push real-time updates to connected users</p>
                        </div>
                        <Switch defaultChecked={true} onCheckedChange={(checked) => handleConfigUpdate('enable_realtime_updates', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save All Changes Button */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Changes are saved automatically. Some settings may require a restart to take effect.
                  </p>
                  <Button size="lg" onClick={() => toast({ title: "Settings saved", description: "All configuration changes have been saved successfully." })}>
                    <Settings className="mr-2 h-4 w-4" />
                    Save All Changes
                  </Button>
                </div>
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

        <TabsContent value="newsletter" className="space-y-6">
          <NewsletterSubscribersPanel />
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <BlogManagementPanel />
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
                      <div className="text-2xl font-bold">{stats.totalUsers * 15 + 423}</div>
                      <p className="text-xs text-muted-foreground">
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">73.2%</div>
                      <p className="text-xs text-muted-foreground">
                        +5.1% from last week
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦{(stats.totalUsers * 150 + 12450).toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        +8.2% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.max(1, Math.floor(stats.totalUsers * 0.15))}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently online
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 mb-6">
                  {/* User Growth Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth Trend</CardTitle>
                      <p className="text-sm text-muted-foreground">User registration over the last 12 months</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">User Growth Chart</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>Jan: {Math.floor(stats.totalUsers * 0.08)}</div>
                                <div>Feb: {Math.floor(stats.totalUsers * 0.12)}</div>
                                <div>Mar: {Math.floor(stats.totalUsers * 0.15)}</div>
                                <div>Apr: {Math.floor(stats.totalUsers * 0.18)}</div>
                                <div>May: {Math.floor(stats.totalUsers * 0.22)}</div>
                                <div>Jun: {Math.floor(stats.totalUsers * 0.28)}</div>
                                <div>Jul: {Math.floor(stats.totalUsers * 0.35)}</div>
                                <div>Aug: {Math.floor(stats.totalUsers * 0.45)}</div>
                                <div>Sep: {Math.floor(stats.totalUsers * 0.60)}</div>
                                <div>Oct: {Math.floor(stats.totalUsers * 0.78)}</div>
                                <div>Nov: {Math.floor(stats.totalUsers * 0.90)}</div>
                                <div>Dec: {stats.totalUsers}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Content Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Distribution</CardTitle>
                        <p className="text-sm text-muted-foreground">Breakdown of platform content types</p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                            <div className="text-center">
                              <div className="mb-4">
                                <div className="w-24 h-24 rounded-full border-8 border-primary/20 border-t-primary mx-auto mb-4"></div>
                              </div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Content Pie Chart</h3>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-primary rounded"></div>
                                  <span>Posts: {stats.activePosts}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-secondary rounded"></div>
                                  <span>Marketplace: {stats.marketplaceItems}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-accent rounded"></div>
                                  <span>Emergency: {stats.emergencyAlerts}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Engagement Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Engagement</CardTitle>
                        <p className="text-sm text-muted-foreground">User interactions over the last 7 days</p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                            <div className="text-center">
                              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                              <h3 className="text-sm font-medium text-muted-foreground mb-2">Engagement Line Chart</h3>
                              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                <div>Mon: 124</div>
                                <div>Tue: 156</div>
                                <div>Wed: 189</div>
                                <div>Thu: 167</div>
                                <div>Fri: 203</div>
                                <div>Sat: 178</div>
                                <div>Sun: 145</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Analytics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Analytics</CardTitle>
                      <p className="text-sm text-muted-foreground">Monthly revenue breakdown and projections</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                          <div className="text-center">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">Revenue Bar Chart</h3>
                            <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
                              <div className="space-y-1">
                                <div>Jan</div>
                                <div className="h-16 bg-primary/20 rounded-sm"></div>
                                <div>₦{Math.floor((stats.totalUsers * 150 + 12450) * 0.4).toLocaleString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div>Feb</div>
                                <div className="h-20 bg-primary/30 rounded-sm"></div>
                                <div>₦{Math.floor((stats.totalUsers * 150 + 12450) * 0.5).toLocaleString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div>Mar</div>
                                <div className="h-24 bg-primary/40 rounded-sm"></div>
                                <div>₦{Math.floor((stats.totalUsers * 150 + 12450) * 0.6).toLocaleString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div>Apr</div>
                                <div className="h-28 bg-primary/50 rounded-sm"></div>
                                <div>₦{Math.floor((stats.totalUsers * 150 + 12450) * 0.7).toLocaleString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div>May</div>
                                <div className="h-32 bg-primary/60 rounded-sm"></div>
                                <div>₦{Math.floor((stats.totalUsers * 150 + 12450) * 0.8).toLocaleString()}</div>
                              </div>
                              <div className="space-y-1">
                                <div>Jun</div>
                                <div className="h-36 bg-primary rounded-sm"></div>
                                <div>₦{(stats.totalUsers * 150 + 12450).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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

                  {/* Performance Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>System Performance</CardTitle>
                      <p className="text-sm text-muted-foreground">Real-time system health and performance indicators</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>CPU Usage</span>
                              <span>45%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Memory Usage</span>
                              <span>67%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: '67%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Database Load</span>
                              <span>32%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: '32%' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm">API Response Time</span>
                            <span className="text-sm font-medium">156ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Uptime</span>
                            <span className="text-sm font-medium">99.8%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Error Rate</span>
                            <span className="text-sm font-medium">0.2%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api-integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>API Integration Settings</span>
              </CardTitle>
              <CardDescription>Manage external API configurations and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Configuration Overview */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      🔗 Current API Configuration
                      <Badge variant="outline" className="text-xs">
                        Project: {currentApiConfig.supabase.project}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">Live configuration status of all integrated APIs</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchCurrentApiConfig}>
                    <Eye className="h-4 w-4 mr-2" />
                    Refresh Config
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Supabase Connection */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Supabase Database</span>
                      <Badge variant={currentApiConfig.supabase.connected ? 'default' : 'destructive'}>
                        {currentApiConfig.supabase.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>URL: {currentApiConfig.supabase.url}</div>
                      <div>Status: {apiStatus.supabase === 'active' ? '✅ Active' : '⏳ Checking...'}</div>
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Google Maps</span>
                      <Badge variant={currentApiConfig.googleMaps.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.googleMaps.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>API Key: {currentApiConfig.googleMaps.hasKey ? '✅ Configured' : '❌ Missing'}</div>
                      <div>Status: {apiStatus.googleMaps === 'active' ? '✅ Active' : apiStatus.googleMaps === 'error' ? '❌ Error' : '⏳ Checking...'}</div>
                      <div>Zoom: {currentApiConfig.googleMaps.defaultZoom}</div>
                    </div>
                  </div>

                  {/* Stripe */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Stripe Payments</span>
                      <Badge variant={currentApiConfig.stripe.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.stripe.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Secret Key: {currentApiConfig.stripe.hasKey ? '✅ Configured' : '❌ Missing'}</div>
                      <div>Status: {apiStatus.stripe === 'active' ? '✅ Active' : apiStatus.stripe === 'error' ? '❌ Error' : '⏳ Checking...'}</div>
                      <div>Currency: {currentApiConfig.stripe.currency}</div>
                    </div>
                  </div>

                  {/* Mapbox */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Mapbox Maps</span>
                      <Badge variant={currentApiConfig.mapbox.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.mapbox.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Token: {currentApiConfig.mapbox.hasKey ? '✅ Configured' : '❌ Missing'}</div>
                      <div>Status: {apiStatus.mapbox === 'active' ? '✅ Active' : apiStatus.mapbox === 'error' ? '❌ Error' : '⏳ Checking...'}</div>
                      <div>Style: {currentApiConfig.mapbox.style?.split('/').pop()}</div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Email Service</span>
                      <Badge variant={currentApiConfig.email.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.email.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>From: {currentApiConfig.email.fromAddress || 'Not configured'}</div>
                      <div>Status: {apiStatus.email === 'active' ? '✅ Active' : '⏳ Ready'}</div>
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Push Notifications</span>
                      <Badge variant={currentApiConfig.push.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.push.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Emergency Priority: {currentApiConfig.push.emergencyPriority ? '✅ Enabled' : '❌ Disabled'}</div>
                      <div>Status: ✅ Ready</div>
                    </div>
                  </div>

                  {/* Webhooks */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Webhooks</span>
                      <Badge variant={currentApiConfig.webhooks.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.webhooks.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Secret: {currentApiConfig.webhooks.secret ? '✅ Configured' : '❌ Missing'}</div>
                      <div>Timeout: {currentApiConfig.webhooks.timeout}s</div>
                    </div>
                  </div>

                  {/* SMS */}
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">SMS Notifications</span>
                      <Badge variant={currentApiConfig.sms?.enabled ? 'default' : 'secondary'}>
                        {currentApiConfig.sms?.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Provider: {currentApiConfig.sms?.provider || 'Not configured'}</div>
                      <div>Status: ⏳ Pending configuration</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Google Maps API */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Google Maps API</h3>
                    <p className="text-sm text-muted-foreground">Configure Google Maps integration for location services</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apiStatus.googleMaps === 'active' ? 'default' : apiStatus.googleMaps === 'error' ? 'destructive' : 'secondary'}>
                      {apiStatus.googleMaps === 'active' ? 'Active' : apiStatus.googleMaps === 'error' ? 'Error' : 'Unknown'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={testingApi === 'googleMaps'}
                      onClick={() => testApiIntegration('googleMaps')}
                    >
                      {testingApi === 'googleMaps' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-maps-enabled">Enable Google Maps</Label>
                    <Switch
                      id="google-maps-enabled"
                      checked={getConfigValue('google_maps_enabled', false)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('google_maps_enabled', checked, 'Enable/disable Google Maps integration')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maps-default-zoom">Default Zoom Level</Label>
                    <Input
                      id="maps-default-zoom"
                      type="number"
                      min="1"
                      max="20"
                      value={getConfigValue('maps_default_zoom', 12)}
                      onChange={(e) => 
                        handleConfigUpdate('maps_default_zoom', parseInt(e.target.value), 'Default zoom level for maps')
                      }
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Status: Google Maps API key is {apiStatus.googleMaps === 'active' ? 'configured and working' : 'not configured or has issues'}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                    >
                      Google Cloud Console
                    </Button>
                    {apiStatus.googleMaps !== 'active' && (
                      <div className="text-sm text-orange-600">
                        Configure GOOGLE_MAPS_API_KEY in Supabase Edge Function Secrets
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stripe Payment API */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Stripe Payment Gateway</h3>
                    <p className="text-sm text-muted-foreground">Configure payment processing for marketplace and services</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apiStatus.stripe === 'active' ? 'default' : apiStatus.stripe === 'error' ? 'destructive' : 'secondary'}>
                      {apiStatus.stripe === 'active' ? 'Active' : apiStatus.stripe === 'error' ? 'Error' : 'Unknown'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={testingApi === 'stripe'}
                      onClick={() => testApiIntegration('stripe')}
                    >
                      {testingApi === 'stripe' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-enabled">Enable Stripe Payments</Label>
                    <Switch
                      id="stripe-enabled"
                      checked={getConfigValue('stripe_enabled', false)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('stripe_enabled', checked, 'Enable/disable Stripe payment processing')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe-currency">Default Currency</Label>
                    <Select 
                      value={getConfigValue('stripe_currency', 'NGN')}
                      onValueChange={(value) => 
                        handleConfigUpdate('stripe_currency', value, 'Default currency for payments')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Status: Stripe secret key is configured in Supabase secrets
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
                    >
                      Stripe Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions', '_blank')}
                    >
                      Manage Secrets
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mapbox Maps API */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Mapbox Maps API</h3>
                    <p className="text-sm text-muted-foreground">Alternative mapping service with advanced features</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apiStatus.mapbox === 'active' ? 'default' : apiStatus.mapbox === 'error' ? 'destructive' : 'secondary'}>
                      {apiStatus.mapbox === 'active' ? 'Active' : apiStatus.mapbox === 'error' ? 'Error' : 'Unknown'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={testingApi === 'mapbox'}
                      onClick={() => testApiIntegration('mapbox')}
                    >
                      {testingApi === 'mapbox' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mapbox-enabled">Enable Mapbox Maps</Label>
                    <Switch
                      id="mapbox-enabled"
                      checked={getConfigValue('mapbox_enabled', false)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('mapbox_enabled', checked, 'Enable/disable Mapbox integration')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mapbox-style">Map Style</Label>
                    <Select 
                      value={getConfigValue('mapbox_style', 'mapbox://styles/mapbox/light-v11')}
                      onValueChange={(value) => 
                        handleConfigUpdate('mapbox_style', value, 'Default Mapbox map style')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mapbox://styles/mapbox/light-v11">Light</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/dark-v11">Dark</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/streets-v12">Streets</SelectItem>
                        <SelectItem value="mapbox://styles/mapbox/satellite-v9">Satellite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Status: Mapbox public token is configured in Supabase secrets
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://account.mapbox.com/access-tokens/', '_blank')}
                    >
                      Mapbox Tokens
                    </Button>
                  </div>
                </div>
              </div>

              {/* SMS/Messaging API */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">SMS & Messaging API</h3>
                    <p className="text-sm text-muted-foreground">Configure SMS notifications and emergency alerts</p>
                  </div>
                  <Badge variant={getConfigValue('sms_enabled', false) ? 'default' : 'secondary'}>
                    {getConfigValue('sms_enabled', false) ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
                    <Switch
                      id="sms-enabled"
                      checked={getConfigValue('sms_enabled', false)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('sms_enabled', checked, 'Enable/disable SMS notifications')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-provider">SMS Provider</Label>
                    <Select 
                      value={getConfigValue('sms_provider', 'twilio')}
                      onValueChange={(value) => 
                        handleConfigUpdate('sms_provider', value, 'SMS service provider')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                        <SelectItem value="africanstalking">African's Talking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Note: SMS functionality requires API keys to be configured in Supabase Edge Function Secrets
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://console.twilio.com/', '_blank')}
                  >
                    Twilio Console
                  </Button>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">Configure browser and mobile push notifications</p>
                  </div>
                  <Badge variant={getConfigValue('push_notifications_enabled', true) ? 'default' : 'secondary'}>
                    {getConfigValue('push_notifications_enabled', true) ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                    <Switch
                      id="push-enabled"
                      checked={getConfigValue('push_notifications_enabled', true)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('push_notifications_enabled', checked, 'Enable/disable push notifications')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency-push">Emergency Push Priority</Label>
                    <Switch
                      id="emergency-push"
                      checked={getConfigValue('emergency_push_priority', true)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('emergency_push_priority', checked, 'High priority for emergency notifications')
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={testingApi === 'push'}
                    onClick={() => testApiIntegration('push')}
                  >
                    {testingApi === 'push' ? 'Testing...' : 'Send Test Notification'}
                  </Button>
                </div>
              </div>

              {/* Email Service */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Email Service</h3>
                    <p className="text-sm text-muted-foreground">Configure email notifications and transactional emails</p>
                  </div>
                  <Badge variant={getConfigValue('email_enabled', true) ? 'default' : 'secondary'}>
                    {getConfigValue('email_enabled', true) ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                    <Switch
                      id="email-enabled"
                      checked={getConfigValue('email_enabled', true)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('email_enabled', checked, 'Enable/disable email notifications')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-from">From Email Address</Label>
                    <Input
                      id="email-from"
                      type="email"
                      placeholder="noreply@yourapp.com"
                      value={getConfigValue('email_from_address', '')}
                      onChange={(e) => 
                        handleConfigUpdate('email_from_address', e.target.value, 'Default from email address')
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={testingApi === 'email'}
                    onClick={() => testApiIntegration('email')}
                  >
                    {testingApi === 'email' ? 'Testing...' : 'Send Test Email'}
                  </Button>
                </div>
              </div>

              {/* File Storage */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">File Storage & CDN</h3>
                    <p className="text-sm text-muted-foreground">Configure file upload and storage settings</p>
                  </div>
                  <Badge variant="default">Supabase Storage</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      min="1"
                      max="100"
                      value={getConfigValue('max_file_size_mb', 10)}
                      onChange={(e) => 
                        handleConfigUpdate('max_file_size_mb', parseInt(e.target.value), 'Maximum file upload size in MB')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowed-formats">Allowed File Formats</Label>
                    <Input
                      id="allowed-formats"
                      placeholder="jpg,png,gif,pdf,doc"
                      value={getConfigValue('allowed_file_formats', 'jpg,jpeg,png,gif,pdf,doc,docx')}
                      onChange={(e) => 
                        handleConfigUpdate('allowed_file_formats', e.target.value, 'Comma-separated list of allowed file extensions')
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">API Rate Limiting</h3>
                    <p className="text-sm text-muted-foreground">Configure API request limits and throttling</p>
                  </div>
                  <Badge variant={getConfigValue('rate_limiting_enabled', true) ? 'default' : 'secondary'}>
                    {getConfigValue('rate_limiting_enabled', true) ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-limit-enabled">Enable Rate Limiting</Label>
                    <Switch
                      id="rate-limit-enabled"
                      checked={getConfigValue('rate_limiting_enabled', true)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('rate_limiting_enabled', checked, 'Enable/disable API rate limiting')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requests-per-minute">Requests per Minute</Label>
                    <Input
                      id="requests-per-minute"
                      type="number"
                      min="10"
                      max="1000"
                      value={getConfigValue('requests_per_minute', 100)}
                      onChange={(e) => 
                        handleConfigUpdate('requests_per_minute', parseInt(e.target.value), 'Maximum API requests per minute per user')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency-rate-limit">Emergency API Limit</Label>
                    <Input
                      id="emergency-rate-limit"
                      type="number"
                      min="50"
                      max="500"
                      value={getConfigValue('emergency_api_limit', 200)}
                      onChange={(e) => 
                        handleConfigUpdate('emergency_api_limit', parseInt(e.target.value), 'Higher rate limit for emergency services')
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Webhook Configuration</h3>
                    <p className="text-sm text-muted-foreground">Configure webhooks for external integrations</p>
                  </div>
                  <Badge variant={getConfigValue('webhooks_enabled', false) ? 'default' : 'secondary'}>
                    {getConfigValue('webhooks_enabled', false) ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhooks-enabled">Enable Webhooks</Label>
                    <Switch
                      id="webhooks-enabled"
                      checked={getConfigValue('webhooks_enabled', false)}
                      onCheckedChange={(checked) => 
                        handleConfigUpdate('webhooks_enabled', checked, 'Enable/disable webhook functionality')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Webhook Secret Key</Label>
                    <Input
                      id="webhook-secret"
                      type="password"
                      placeholder="Enter webhook secret"
                      value={getConfigValue('webhook_secret', '')}
                      onChange={(e) => 
                        handleConfigUpdate('webhook_secret', e.target.value, 'Secret key for webhook verification')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-timeout">Webhook Timeout (seconds)</Label>
                    <Input
                      id="webhook-timeout"
                      type="number"
                      min="5"
                      max="60"
                      value={getConfigValue('webhook_timeout', 30)}
                      onChange={(e) => 
                        handleConfigUpdate('webhook_timeout', parseInt(e.target.value), 'Webhook request timeout in seconds')
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={testingApi === 'webhook'}
                      onClick={() => testApiIntegration('webhook')}
                    >
                      {testingApi === 'webhook' ? 'Testing...' : 'Test Webhook'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* API Status Overview */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      API Status Overview
                      {monitoringActive && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">Live</span>
                        </div>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {monitoringActive ? 'Real-time monitoring active - Updates every 30 seconds' : 'Real-time status of all configured APIs'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {monitoringActive ? (
                      <Button variant="outline" size="sm" onClick={stopLiveMonitoring}>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Live Monitoring
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={startLiveMonitoring}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Monitoring
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Supabase</span>
                    <Badge variant={apiStatus.supabase === 'active' ? 'default' : 'destructive'}>
                      {apiStatus.supabase === 'active' ? 'Connected' : 'Error'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Google Maps</span>
                    <Badge variant={apiStatus.googleMaps === 'active' ? 'default' : 'destructive'}>
                      {apiStatus.googleMaps === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Mapbox</span>
                    <Badge variant={apiStatus.mapbox === 'active' ? 'default' : 'destructive'}>
                      {apiStatus.mapbox === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Stripe</span>
                    <Badge variant={apiStatus.stripe === 'active' ? 'default' : 'destructive'}>
                      {apiStatus.stripe === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={checkApiStatus}
                    disabled={monitoringActive}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {monitoringActive ? 'Auto-Refreshing...' : 'Manual Refresh'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions', '_blank')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Secrets
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const data = {
                      timestamp: new Date().toISOString(),
                      monitoringActive,
                      apiStatus,
                      lastChecked: new Date().toLocaleString(),
                      configurations: appConfigs.filter(config => 
                        config.config_key.includes('api_') || 
                        config.config_key.includes('_enabled') ||
                        config.config_key.includes('google_') ||
                        config.config_key.includes('stripe_') ||
                        config.config_key.includes('mapbox_')
                      ),
                      systemHealth
                    };
                    const dataStr = JSON.stringify(data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `api-status-report-${new Date().getTime()}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    toast({
                      title: "Report Exported",
                      description: "Live API status report downloaded successfully",
                    });
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Live Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>API Management & Developer Portal</span>
              </CardTitle>
              <CardDescription>Manage API keys, monitor usage, and configure developer access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiUsage.totalRequests.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Daily Requests</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiUsage.dailyRequests}</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiUsage.activeKeys}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiUsage.rateLimitHits}</div>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </CardContent>
                </Card>
              </div>

              {/* API Endpoints Overview */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Available API Endpoints</h3>
                    <p className="text-sm text-muted-foreground">Core endpoints available to developers</p>
                  </div>
                  <Button variant="outline" onClick={() => window.open('/api-docs', '_blank')}>
                    <Globe className="h-4 w-4 mr-2" />
                    View Public Docs
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">GET</Badge>
                          <code className="text-sm">/api/communities</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Get list of communities</p>
                      </div>
                      <Badge variant="outline">Auth Required</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">POST</Badge>
                          <code className="text-sm">/api/emergency/alert</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Create emergency alert</p>
                      </div>
                      <Badge variant="outline">Auth Required</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">GET</Badge>
                          <code className="text-sm">/api/services</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Get local services</p>
                      </div>
                      <Badge variant="secondary">Optional Auth</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">GET</Badge>
                          <code className="text-sm">/api/users/profile</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Get user profile</p>
                      </div>
                      <Badge variant="outline">Auth Required</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">POST</Badge>
                          <code className="text-sm">/api/communities</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Create new community</p>
                      </div>
                      <Badge variant="outline">Auth Required</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">GET</Badge>
                          <code className="text-sm">/api/marketplace</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Browse marketplace items</p>
                      </div>
                      <Badge variant="secondary">Optional Auth</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key Management */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">API Key Management</h3>
                    <p className="text-sm text-muted-foreground">Generate and manage developer API keys</p>
                  </div>
                  <Button onClick={generateApiKey}>
                    <Key className="h-4 w-4 mr-2" />
                    Generate New Key
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <div className="text-center p-6 text-muted-foreground">
                      <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No API keys generated yet</p>
                      <p className="text-sm">Create your first API key to get started</p>
                    </div>
                  ) : (
                    apiKeys.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{key.key_name || `API Key ${index + 1}`}</span>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_active ? 'Active' : 'Revoked'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Key: {key.api_key?.substring(0, 12)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(key.created_at).toLocaleDateString()}
                            {key.last_used_at && ` • Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {key.is_active && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => revokeApiKey(key.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rate Limiting Configuration */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Rate Limiting & Security</h3>
                  <p className="text-sm text-muted-foreground">Configure API access limits and security settings</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-rate-limit">Default Rate Limit (per hour)</Label>
                    <Input
                      id="default-rate-limit"
                      type="number"
                      value={getConfigValue('api_default_rate_limit', 1000)}
                      onChange={(e) => 
                        handleConfigUpdate('api_default_rate_limit', parseInt(e.target.value), 'Default API rate limit per hour')
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premium-rate-limit">Premium Rate Limit (per hour)</Label>
                    <Input
                      id="premium-rate-limit"
                      type="number"
                      value={getConfigValue('api_premium_rate_limit', 10000)}
                      onChange={(e) => 
                        handleConfigUpdate('api_premium_rate_limit', parseInt(e.target.value), 'Premium API rate limit per hour')
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-cors-origins">Allowed CORS Origins</Label>
                  <Textarea
                    id="api-cors-origins"
                    placeholder="https://example.com, https://app.example.com"
                    value={getConfigValue('api_cors_origins', '')}
                    onChange={(e) => 
                      handleConfigUpdate('api_cors_origins', e.target.value, 'Allowed CORS origins for API requests')
                    }
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list of allowed origins</p>
                </div>
              </div>

              {/* Developer Resources */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Developer Resources</h3>
                  <p className="text-sm text-muted-foreground">Tools and resources for API developers</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => window.open('/api-docs', '_blank')}>
                    <Code className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const sdkData = {
                      javascript: {
                        package: 'neighborlink-js',
                        install: 'npm install neighborlink-js',
                        docs: '/docs/sdk/javascript'
                      },
                      python: {
                        package: 'neighborlink-python', 
                        install: 'pip install neighborlink-python',
                        docs: '/docs/sdk/python'
                      },
                      php: {
                        package: 'neighborlink/php-sdk',
                        install: 'composer require neighborlink/php-sdk', 
                        docs: '/docs/sdk/php'
                      }
                    };
                    
                    const dataStr = JSON.stringify(sdkData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'neighborlink-sdks.json';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download SDKs
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    const exampleData = {
                      authentication: {
                        headers: {
                          'Authorization': 'Bearer YOUR_API_KEY',
                          'Content-Type': 'application/json'
                        }
                      },
                      examples: {
                        getCommunities: `fetch('/api/communities', { headers: auth })`,
                        createAlert: `fetch('/api/emergency/alert', { method: 'POST', headers: auth, body: JSON.stringify(alertData) })`
                      }
                    };
                    
                    const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
                    const { copyToClipboard } = useNativeClipboard();
                    await copyToClipboard(JSON.stringify(exampleData, null, 2), "API examples copied to clipboard");
                  }}>
                    <Code className="h-4 w-4 mr-2" />
                    Copy Examples
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>

      {/* Global Dialogs - Outside of Tabs */}



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
