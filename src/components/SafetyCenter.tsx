import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMinimalAuth as useAuth } from '@/hooks/useAuth-minimal';
import SafetyMap from './SafetyMap';
import PanicButton from './PanicButton';
import ReportIncidentDialog from './ReportIncidentDialog';

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
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

const SafetyCenter = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

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
    
    // Set up real-time subscription for new alerts
    const subscription = supabase
      .channel('safety_alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
        (payload) => {
          console.log('New safety alert:', payload);
          fetchAlerts(); // Refresh alerts when new one is added
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filterSeverity, filterType]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filterSeverity !== 'all') {
        query = query.eq('severity', filterSeverity as any);
      }

      if (filterType !== 'all') {
        query = query.eq('alert_type', filterType as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts((data as any) || []);
    } catch (error) {
      console.error('Error fetching safety alerts:', error);
    } finally {
      setLoading(false);
    }
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
              <Button className="flex items-center gap-2 hidden md:flex">
                <Plus className="h-4 w-4" />
                Report Incident
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Mobile Report Button */}
      <div className="md:hidden">
        <ReportIncidentDialog
          trigger={
            <Button className="w-full flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Report Incident
            </Button>
          }
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts', value: alerts.filter(a => a.status === 'active').length, color: 'text-red-600', icon: AlertTriangle },
          { label: 'Resolved Today', value: alerts.filter(a => a.status === 'resolved' && new Date(a.created_at).toDateString() === new Date().toDateString()).length, color: 'text-green-600', icon: CheckCircle },
          { label: 'Under Investigation', value: alerts.filter(a => a.status === 'investigating').length, color: 'text-yellow-600', icon: Search },
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
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <SafetyMap alerts={alerts} onAlertClick={(alert) => setSelectedAlert(alert)} />
          </CardContent>
        </Card>
      ) : (
        /* Alert List */
        <div className="space-y-4">
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
                    : 'Your neighborhood is all clear! No safety alerts at this time.'}
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
        </div>
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
            <CardContent>
              <div className="space-y-4">
                <p>{selectedAlert.description}</p>
                <div className="flex items-center gap-2">
                  <Badge className={severityColors[selectedAlert.severity]}>
                    {selectedAlert.severity}
                  </Badge>
                  <Badge variant="outline">
                    {selectedAlert.alert_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>📍 {selectedAlert.address}</p>
                  <p>🕒 {getTimeSince(selectedAlert.created_at)}</p>
                  <p>👤 Reported by {selectedAlert.profiles?.full_name || 'Anonymous'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SafetyCenter;