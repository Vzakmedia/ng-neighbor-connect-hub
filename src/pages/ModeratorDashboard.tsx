import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Shield, Users, MessageSquare, Flag, AlertTriangle, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContentModerationPanel from "@/components/ContentModerationPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ModeratorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    pendingReports: 0,
    activeAlerts: 0,
    moderatedToday: 0,
    flaggedContent: 0
  });
  
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user has moderator role
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['moderator', 'super_admin'])
        .single();
      
      setUserRole(data?.role);
    };
    
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (!user || !userRole) return;

    const fetchModeratorData = async () => {
      try {
        // Fetch pending reports count
        const { count: reportsCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch active emergency alerts count
        const { count: alertsCount } = await supabase
          .from('panic_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('is_resolved', false);

        // Fetch flagged content count
        const { count: flaggedCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setStats({
          pendingReports: reportsCount || 0,
          activeAlerts: alertsCount || 0,
          moderatedToday: 0, // Calculate based on today's resolved reports
          flaggedContent: flaggedCount || 0
        });

        // Fetch detailed reports data
        const { data: reportsData } = await supabase
          .from('content_reports')
          .select('*, profiles(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        // Fetch emergency alerts
        const { data: alertsData } = await supabase
          .from('panic_alerts')
          .select('*')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })
          .limit(10);

        setReports(reportsData || []);
        setEmergencyAlerts(alertsData || []);

      } catch (error) {
        console.error('Error fetching moderator data:', error);
        toast({
          title: "Error",
          description: "Failed to load moderator data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModeratorData();

    // Set up real-time subscriptions
    const moderatorChannel = supabase.channel('moderator-updates');

    moderatorChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'content_reports' }, 
      (payload) => {
        console.log('Content reports change:', payload);
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          setReports(prev => [payload.new, ...prev.slice(0, 19)]);
          setStats(prev => ({ ...prev, pendingReports: prev.pendingReports + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(report => 
            report.id === payload.new.id ? payload.new : report
          ));
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            setStats(prev => ({ ...prev, pendingReports: prev.pendingReports - 1 }));
          }
        }
      }
    );

    moderatorChannel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'panic_alerts' }, 
      (payload) => {
        console.log('Panic alerts change:', payload);
        if (payload.eventType === 'INSERT') {
          setEmergencyAlerts(prev => [payload.new, ...prev.slice(0, 9)]);
          setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setEmergencyAlerts(prev => prev.map(alert => 
            alert.id === payload.new.id ? payload.new : alert
          ));
          if (!payload.old.is_resolved && payload.new.is_resolved) {
            setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts - 1 }));
          }
        }
      }
    );

    moderatorChannel.subscribe();

    return () => {
      supabase.removeChannel(moderatorChannel);
    };
  }, [user, userRole, toast]);

  // Action handlers
  const handleReportAction = async (reportId, action) => {
    try {
      // Optimistically update UI
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : report
      ));

      const { error } = await supabase
        .from('content_reports')
        .update({ 
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_staff_activity', {
        _action_type: 'moderate_content',
        _resource_type: 'content_report',
        _resource_id: reportId,
        _details: { action, status: action }
      });

      toast({
        title: "Success",
        description: `Report ${action}`
      });
    } catch (error) {
      // Revert optimistic update
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'pending', reviewed_by: null, reviewed_at: null }
          : report
      ));
      
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole || !['moderator', 'super_admin'].includes(userRole)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the moderator dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
        <p className="text-muted-foreground">Content moderation and community safety management</p>
        <div className="flex items-center mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live updates enabled</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex gap-6" orientation="vertical">
        <TabsList className="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="overview" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="w-full justify-start">
            <Flag className="h-4 w-4 mr-2" />
            Content Reports
          </TabsTrigger>
          <TabsTrigger value="approvals" className="w-full justify-start">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="emergency" className="w-full justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Alerts
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            User Moderation
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.pendingReports}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.activeAlerts}</div>
                  <p className="text-xs text-muted-foreground">Emergency situations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moderated Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stats.moderatedToday}</div>
                  <p className="text-xs text-muted-foreground">Actions taken</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingReports > 5 ? 'High' : 'Normal'}</div>
                  <p className="text-xs text-muted-foreground">Workload level</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">
                          {report.reason}
                        </Badge>
                        <span className="text-sm">{report.content_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <p className="text-sm text-muted-foreground">No pending reports</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emergencyAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">
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
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <CardDescription>Review and moderate reported content</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">{report.content_type}</Badge>
                        </TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{report.profiles?.full_name || 'Unknown'}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'pending' ? "destructive" : "secondary"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReportAction(report.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReportAction(report.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
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

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <ContentModerationPanel />
          </TabsContent>

          {/* Emergency Alerts Tab */}
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Alert Management</CardTitle>
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Moderation Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Moderation</CardTitle>
                <CardDescription>Manage user accounts and violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">User Moderation</h3>
                  <p className="text-muted-foreground">Advanced user moderation features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ModeratorDashboard;