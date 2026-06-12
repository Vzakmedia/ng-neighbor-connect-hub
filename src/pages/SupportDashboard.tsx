import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Navigate, useNavigate } from "react-router-dom";
import { Volume2 as HeadphonesIcon, Users, AlertTriangle, MessageSquare, Phone, Mail, Clock, CheckCircle, ArrowLeft, Grid, RefreshCw, Home } from '@/lib/icons';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDashboard } from "@/components/alert-system/AlertDashboard";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedSupportTicketSystem } from '@/components/support/EnhancedSupportTicketSystem';

const LOGO_URL = "https://cowiviqhrnmhttugozbz.supabase.co/storage/v1/object/public/onboarding-assets/neighborlink-logo.jpeg";

const SupportDashboard = () => {
  const { user } = useAuth();
  const { role } = useAdminStatus();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    openTickets: 0,
    activeEmergencies: 0,
    resolvedToday: 0,
    averageResponseTime: 0
  });
  
  const [tickets, setTickets] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [userQueries, setUserQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) return;

    const fetchSupportData = async () => {
      try {
        // Fetch emergency alerts count
        const { count: alertsCount } = await supabase
          .from('panic_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('is_resolved', false);

        // Fetch content reports that need support attention
        const { count: reportsCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          openTickets: 0, // Implement ticket system
          activeEmergencies: alertsCount || 0,
          resolvedToday: 0, // Calculate today's resolved issues
          averageResponseTime: 15 // Mock data
        });

        // Fetch emergency alerts
        const { data: alertsData } = await supabase
          .from('panic_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch content reports for support review
        const { data: reportsData } = await supabase
          .from('content_reports')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(20);

        setEmergencyAlerts(alertsData || []);
        setUserQueries(reportsData || []);

      } catch (error) {
        console.error('Error fetching support data:', error);
        toast({
          title: "Error",
          description: "Failed to load support data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();

    // Set up real-time subscriptions
    const supportChannel = supabase.channel('support-updates');

    supportChannel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'panic_alerts' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setEmergencyAlerts(prev => [payload.new, ...prev.slice(0, 19)]);
          setStats(prev => ({ ...prev, activeEmergencies: prev.activeEmergencies + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setEmergencyAlerts(prev => prev.map(alert => 
            alert.id === payload.new.id ? payload.new : alert
          ));
          if (!payload.old.is_resolved && payload.new.is_resolved) {
            setStats(prev => ({ ...prev, activeEmergencies: prev.activeEmergencies - 1 }));
          }
        }
      }
    );

    supportChannel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'content_reports' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setUserQueries(prev => [payload.new, ...prev.slice(0, 19)]);
        } else if (payload.eventType === 'UPDATE') {
          setUserQueries(prev => prev.map(query => 
            query.id === payload.new.id ? payload.new : query
          ));
        }
      }
    );

    supportChannel.subscribe();

    return () => {
      supabase.removeChannel(supportChannel);
    };
  }, [user, role, toast]);

  const handleEmergencyResponse = async (alertId, response) => {
    try {
      // Log support response to emergency
      await supabase.rpc('log_staff_activity', {
        _action_type: 'emergency_response',
        _resource_type: 'panic_alert',
        _resource_id: alertId,
        _details: { response }
      });

      toast({
        title: "Success",
        description: "Emergency response logged"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log response",
        variant: "destructive"
      });
    }
  };

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="NeighborLink Logo" className="h-8 w-8 rounded-full object-cover shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">NeighborLink</p>
              <p className="text-sm font-bold text-foreground">Support Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-orange-700 dark:text-orange-300 font-medium">Live</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/staff-portal')}
              className="text-muted-foreground hover:text-foreground hover:bg-accent gap-1.5"
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Staff Portal</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Back to App</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Support Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">User assistance and emergency response center</p>
          </div>
        </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <HeadphonesIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="emergency" className="w-full justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="alerts" className="w-full justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alert System
          </TabsTrigger>
          <TabsTrigger value="tickets" className="w-full justify-start">
            <MessageSquare className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            User Assistance
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.openTickets}</div>
                  <p className="text-xs text-muted-foreground">Awaiting response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Emergencies</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.activeEmergencies}</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.resolvedToday}</div>
                  <p className="text-xs text-muted-foreground">Issues handled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageResponseTime}m</div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emergencyAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.is_resolved ? "secondary" : "destructive"}>
                          {alert.situation_type}
                        </Badge>
                        <span className="text-sm">Emergency</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {emergencyAlerts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active emergencies</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent User Queries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userQueries.slice(0, 5).map((query) => (
                    <div key={query.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {query.reason}
                        </Badge>
                        <span className="text-sm">{query.content_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(query.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {userQueries.length === 0 && (
                    <p className="text-sm text-muted-foreground">No pending queries</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Response Center</CardTitle>
                <CardDescription>Monitor and respond to emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant="destructive">{alert.situation_type}</Badge>
                        </TableCell>
                        <TableCell>{alert.address || 'Location not provided'}</TableCell>
                        <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={alert.is_resolved ? "secondary" : "destructive"}>
                            {alert.is_resolved ? "Resolved" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEmergencyResponse(alert.id, 'contacted')}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEmergencyResponse(alert.id, 'escalated')}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert System Tab */}
          <TabsContent value="alerts">
            <AlertDashboard />
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets">
            <EnhancedSupportTicketSystem />
          </TabsContent>

          {/* User Assistance Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Assistance Center</CardTitle>
                <CardDescription>Help users with account and platform issues</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userQueries.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell>
                          <Badge variant="outline">{query.reason}</Badge>
                        </TableCell>
                        <TableCell>{query.profiles?.full_name || 'Unknown'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {query.description || 'No description provided'}
                        </TableCell>
                        <TableCell>{new Date(query.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Assist User
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </div>
  );
};

export default SupportDashboard;