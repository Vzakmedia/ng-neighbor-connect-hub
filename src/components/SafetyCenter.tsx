import React, { useState, useEffect } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Plus,
  Filter,
  Search,
  Phone,
  Eye,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Settings,
  Bell,
  RefreshCw,
  List
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SafetyMap from './SafetyMap';
import PanicButton from './PanicButton';
import ReportIncidentDialog from './ReportIncidentDialog';
import AlertStatusManager from './AlertStatusManager';
import RealTimeAlertFeed from './RealTimeAlertFeed';
import PanicAlertStatusManager from './PanicAlertStatusManager';
import { useToast } from '@/hooks/use-toast';

interface SafetyAlert {
  id: string;
  title: string;
  description: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'false_alarm';
  latitude: number;
  longitude: number;
  address: string;
  images: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  verified_at?: string;
  verified_by?: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface PanicAlert {
  id: string;
  user_id: string;
  situation_type: string;
  message?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  latitude: number;
  longitude: number;
}

const SafetyCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [selectedPanicAlert, setSelectedPanicAlert] = useState<PanicAlert | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'feed'>('list');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const alertTypeIcons = {
    break_in: Shield,
    theft: AlertTriangle,
    accident: Zap,
    suspicious_activity: Eye,
    harassment: User,
    fire: Zap,
    flood: Activity,
    power_outage: Zap,
    road_closure: MapPin,
    other: AlertTriangle
  };

  const alertTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'break_in', label: 'Break-in' },
    { value: 'theft', label: 'Theft' },
    { value: 'accident', label: 'Accident' },
    { value: 'suspicious_activity', label: 'Suspicious Activity' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'fire', label: 'Fire' },
    { value: 'flood', label: 'Flood' },
    { value: 'power_outage', label: 'Power Outage' },
    { value: 'road_closure', label: 'Road Closure' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchAlerts();
    fetchPanicAlerts();
    
    // Set up safe real-time subscriptions
    const alertsSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
          async (payload) => {
            console.log('New safety alert:', payload);
            // Fetch the complete alert with profile data
            const { data } = await supabase
              .from('safety_alerts')
              .select(`
                *,
                profiles (full_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setAlerts(prev => [data as any, ...prev]);
              toast({
                title: "New Safety Alert",
                description: `${data.title} - ${data.severity} severity`,
              });
            }
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'safety_alerts' },
          (payload) => {
            console.log('Alert updated:', payload);
            setAlerts(prev => 
              prev.map(alert => 
                alert.id === payload.new.id 
                  ? { ...alert, ...payload.new }
                  : alert
              )
            );
          }
        ),
      {
        channelName: 'safety_alerts_updates',
        onError: () => {
          fetchAlerts();
          fetchPanicAlerts();
        },
        pollInterval: 30000,
        debugName: 'SafetyCenter'
      }
    );

    // Auto-refresh disabled to prevent constant refreshes
    console.log('SafetyCenter auto-refresh disabled to prevent refresh loops');

    return () => {
      alertsSubscription?.unsubscribe();
      cleanupSafeSubscription('safety_alerts_updates', 'SafetyCenter');
    };
  }, [filterSeverity, filterType, filterStatus, autoRefresh, toast]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filterSeverity !== 'all') {
        query = query.eq('severity', filterSeverity as any);
      }

      if (filterType !== 'all') {
        query = query.eq('alert_type', filterType as any);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching safety alerts:', error);
        toast({
          title: "Failed to load safety alerts",
          description: error.message || "Unknown error occurred",
          variant: "destructive",
        });
        setAlerts([]);
        setLoading(false);
        return;
      }
      
      console.log('Safety alerts fetched:', data?.length || 0, 'alerts');
      setAlerts((data as any) || []);
    } catch (error) {
      console.error('Error fetching safety alerts:', error);
      toast({
        title: "Failed to load safety alerts",
        description: "Unable to fetch the latest safety alerts. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPanicAlerts = async () => {
    if (!user) return;
    
    try {
      // Get current user's profile to filter by location
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, state, city')
        .eq('user_id', user.id)
        .single();

      // Get panic alerts created by user
      let query = supabase
        .from('panic_alerts')
        .select('*')
        .eq('user_id', user.id);

      const { data: userPanicAlerts, error: userError } = await query;
      if (userError) throw userError;

      let contactPanicAlerts: any[] = [];
      let areaPanicAlerts: any[] = [];
      
      // Get panic alerts where user is an emergency contact
      if (userProfile?.phone) {
        const { data: emergencyContacts } = await supabase
          .from('emergency_contacts')
          .select('user_id')
          .eq('phone_number', userProfile.phone);

        if (emergencyContacts && emergencyContacts.length > 0) {
          const contactUserIds = emergencyContacts.map(ec => ec.user_id);
          
          const { data: contactAlerts, error: contactError } = await supabase
            .from('panic_alerts')
            .select('*')
            .in('user_id', contactUserIds);

          if (contactError) throw contactError;
          contactPanicAlerts = contactAlerts || [];
        }
      }

      // Get panic alerts in user's area (same state)
      if (userProfile?.state) {
        const { data: areaAlerts, error: areaError } = await supabase
          .from('panic_alerts')
          .select(`
            *,
            profiles (state, city)
          `)
          .neq('user_id', user.id) // Exclude user's own alerts
          .order('created_at', { ascending: false });

        if (areaError) throw areaError;
        
        // Filter by state/city in the application
        areaPanicAlerts = (areaAlerts || []).filter((alert: any) => 
          alert.profiles?.state === userProfile.state ||
          alert.profiles?.city === userProfile.city
        );
      }

      // Combine and deduplicate alerts
      const allPanicAlerts = [...(userPanicAlerts || []), ...contactPanicAlerts, ...areaPanicAlerts];
      const uniqueAlerts = allPanicAlerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.id === alert.id)
      );

      setPanicAlerts(uniqueAlerts);
    } catch (error) {
      console.error('Error fetching panic alerts:', error);
      toast({
        title: "Failed to load panic alerts", 
        description: "Unable to fetch panic alerts. Please try refreshing.",
        variant: "destructive"
      });
    }
  };

  const handlePanicAlertStatusUpdate = (alertId: string, newStatus: string) => {
    setPanicAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              is_resolved: newStatus === 'resolved',
              resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString() 
            }
          : alert
      )
    );
    
    if (selectedPanicAlert?.id === alertId) {
      setSelectedPanicAlert(prev => prev ? { 
        ...prev, 
        is_resolved: newStatus === 'resolved',
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString() 
      } : null);
    }

    // Also refresh safety alerts as they should be updated by the trigger
    setTimeout(() => fetchAlerts(), 1000);
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-blue-600" />;
    }
  };

  const handleStatusUpdate = (alertId: string, newStatus: string, note?: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: newStatus as any, updated_at: new Date().toISOString() }
          : alert
      )
    );
    
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(prev => prev ? { ...prev, status: newStatus as any } : null);
    }

    toast({
      title: "Status Updated",
      description: `Alert status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Panic Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Safety Center
          </h1>
          <p className="text-muted-foreground">Community safety alerts and emergency reporting</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <PanicButton />
          <ReportIncidentDialog
            trigger={
              <Button className="hidden md:flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Report Incident
              </Button>
            }
          />
          <ReportIncidentDialog
            trigger={
              <Button className="md:hidden h-9 w-9 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
      

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length, color: 'text-red-600', icon: AlertTriangle },
          { label: 'Resolved Today', value: alerts.filter(a => a.status === 'resolved' && new Date(a.created_at).toDateString() === new Date().toDateString()).length, color: 'text-green-600', icon: CheckCircle },
          { label: 'Under Investigation', value: alerts.filter(a => a.status === 'investigating').length, color: 'text-yellow-600', icon: Search },
          { label: 'My Panic Alerts', value: panicAlerts.filter(a => a.user_id === user?.id).length, color: 'text-purple-600', icon: AlertTriangle },
          { label: 'Total Reports', value: alerts.length, color: 'text-blue-600', icon: Shield }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Desktop view buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map View
          </Button>
          <Button
            variant={viewMode === 'feed' ? 'default' : 'outline'}
            onClick={() => setViewMode('feed')}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-1" />
            Live Feed
          </Button>
        </div>
        
        {/* Mobile filter buttons - icons only, expand when active */}
        <div className="md:hidden w-full">
          <div className="flex justify-center gap-1 w-full">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
              className={`transition-all duration-300 ease-in-out text-xs ${
                viewMode === 'list' 
                  ? 'px-3 flex items-center gap-2 min-w-fit' 
                  : 'px-0 w-8 h-8 justify-center'
              }`}
            >
              <List className="h-3 w-3 flex-shrink-0" />
              {viewMode === 'list' && (
                <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  List
                </span>
              )}
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              size="sm"
              className={`transition-all duration-300 ease-in-out text-xs ${
                viewMode === 'map' 
                  ? 'px-3 flex items-center gap-2 min-w-fit' 
                  : 'px-0 w-8 h-8 justify-center'
              }`}
            >
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {viewMode === 'map' && (
                <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  Map
                </span>
              )}
            </Button>
            <Button
              variant={viewMode === 'feed' ? 'default' : 'outline'}
              onClick={() => setViewMode('feed')}
              size="sm"
              className={`transition-all duration-300 ease-in-out text-xs ${
                viewMode === 'feed' 
                  ? 'px-3 flex items-center gap-2 min-w-fit' 
                  : 'px-0 w-8 h-8 justify-center'
              }`}
            >
              <Activity className="h-3 w-3 flex-shrink-0" />
              {viewMode === 'feed' && (
                <span className="whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  Feed
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            {alertTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_alarm">False Alarm</option>
          </select>

        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <SafetyMap alerts={alerts} onAlertClick={(alert) => setSelectedAlert(alert as any)} />
          </CardContent>
        </Card>
      ) : viewMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RealTimeAlertFeed 
              onAlertClick={(alert) => setSelectedAlert(alert as any)} 
              className="h-[600px]"
            />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={fetchAlerts} variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Alerts
                </Button>
                <Button 
                  onClick={() => setAutoRefresh(!autoRefresh)} 
                  variant={autoRefresh ? "default" : "outline"} 
                  size="sm" 
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
                </Button>
              </CardContent>
            </Card>

            {/* Panic Alerts Section */}
            {panicAlerts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Your Panic Alerts ({panicAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {panicAlerts.slice(0, 3).map((panicAlert) => (
                    <div 
                      key={panicAlert.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPanicAlert(panicAlert)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">
                            {panicAlert.situation_type.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant={panicAlert.is_resolved ? "secondary" : "destructive"} className="text-xs">
                          {panicAlert.is_resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getTimeSince(panicAlert.created_at)}
                      </div>
                    </div>
                  ))}
                  {panicAlerts.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +{panicAlerts.length - 3} more panic alerts
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Tabbed Alert Views */
        <Tabs defaultValue="safety-alerts" className="w-full">
          {/* Desktop tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-2">
            <TabsTrigger value="safety-alerts" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="panic-alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Panic Alerts ({panicAlerts.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Mobile tabs - using buttons instead of TabsTrigger */}
          <div className="md:hidden w-full mb-4">
            <div className="flex justify-center gap-1 w-full">
              <Button
                variant="outline"
                className="flex-1"
              >
                <Shield className="h-3 w-3 mr-1" />
                Safety
              </Button>
              <Button
                variant="outline"
                className="flex-1"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Panic
              </Button>
            </div>
          </div>
          
          <TabsContent value="safety-alerts" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Safety Alerts</h3>
                  <p className="text-muted-foreground">
                    {filterSeverity !== 'all' || filterType !== 'all'
                      ? 'No alerts match your current filters'
                      : 'Your community is all clear! No safety alerts at this time.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => {
                const AlertIcon = alertTypeIcons[alert.alert_type as keyof typeof alertTypeIcons] || AlertTriangle;
                return (
                  <Card key={alert.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAlert(alert)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${severityColors[alert.severity]}`}>
                            <AlertIcon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{alert.title}</h3>
                              <Badge 
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className={severityColors[alert.severity]}
                              >
                                {alert.severity}
                              </Badge>
                              {alert.is_verified && (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-3 line-clamp-2">{alert.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {alert.address || 'Location not specified'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeSince(alert.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {alert.profiles?.full_name || 'Anonymous'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getSeverityIcon(alert.severity)}
                          <Badge variant="outline" className="text-xs">
                            {alert.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
          
          <TabsContent value="panic-alerts" className="space-y-4 mt-6">
            {panicAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Panic Alerts</h3>
                  <p className="text-muted-foreground">
                    No panic alerts in your area at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              panicAlerts.map((panicAlert) => (
                <Card key={panicAlert.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPanicAlert(panicAlert)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {panicAlert.situation_type.replace('_', ' ').toUpperCase()} Emergency
                            </h3>
                            <Badge variant={panicAlert.is_resolved ? "secondary" : "destructive"}>
                              {panicAlert.is_resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                          
                          {panicAlert.message && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">{panicAlert.message}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {panicAlert.address || 'Location not specified'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeSince(panicAlert.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        {panicAlert.is_resolved && panicAlert.resolved_at && (
                          <div className="text-xs text-muted-foreground">
                            Resolved {getTimeSince(panicAlert.resolved_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Alert Detail Modal/Sidebar would go here */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {selectedAlert.title}
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedAlert(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <p>{selectedAlert.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={severityColors[selectedAlert.severity]}>
                    {selectedAlert.severity}
                  </Badge>
                  <Badge variant="outline">
                    {selectedAlert.alert_type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={
                    selectedAlert.status === 'active' ? 'text-red-600' :
                    selectedAlert.status === 'investigating' ? 'text-yellow-600' :
                    selectedAlert.status === 'resolved' ? 'text-green-600' :
                    'text-gray-600'
                  }>
                    {selectedAlert.status.replace('_', ' ')}
                  </Badge>
                  {selectedAlert.is_verified && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedAlert.address || 'Location not specified'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Reported {getTimeSince(selectedAlert.created_at)}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedAlert.profiles?.full_name || 'Anonymous'}
                  </p>
                  {selectedAlert.updated_at !== selectedAlert.created_at && (
                    <p className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Updated {getTimeSince(selectedAlert.updated_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Management */}
              <AlertStatusManager
                alert={selectedAlert}
                onStatusUpdate={handleStatusUpdate}
                isOwner={user?.id === selectedAlert.user_id}
                canModerate={false} // You can add role checking here
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panic Alert Detail Modal */}
      {selectedPanicAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Panic Alert - {selectedPanicAlert.situation_type.replace('_', ' ')}
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedPanicAlert(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PanicAlertStatusManager
                panicAlert={selectedPanicAlert}
                onStatusUpdate={handlePanicAlertStatusUpdate}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SafetyCenter;