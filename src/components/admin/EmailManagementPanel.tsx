import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnverifiedUser {
  user_id: string;
  email: string;
  created_at: string;
  full_name?: string;
}

interface EmailAuditLog {
  id: string;
  recipient_email: string;
  email_type: string;
  action_type: string;
  created_at: string;
  error_message?: string;
}

export default function EmailManagementPanel() {
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UnverifiedUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch users with unverified emails
      const { data: unverifiedData, error: unverifiedError } = await supabase
        .rpc('get_unverified_email_users');
      
      if (unverifiedError) {
        console.error('Error fetching unverified users:', unverifiedError);
      } else if (unverifiedData) {
        setUnverifiedUsers(unverifiedData);
      }

      // Fetch email audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('email_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!logsError) {
        setEmailLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (user: UnverifiedUser) => {
    setActionLoading(user.user_id);
    try {
      const { error } = await supabase.functions.invoke('admin-resend-verification', {
        body: {
          action: 'resend',
          userId: user.user_id,
          email: user.email
        }
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: `New verification email sent to ${user.email}`,
      });
      
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to resend verification email',
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualVerify = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.user_id);
    try {
      const { error } = await supabase.functions.invoke('admin-resend-verification', {
        body: {
          action: 'verify',
          userId: selectedUser.user_id,
          email: selectedUser.email
        }
      });

      if (error) throw error;

      toast({
        title: "User Verified",
        description: `${selectedUser.email} has been manually verified`,
      });
      
      setVerifyDialogOpen(false);
      setSelectedUser(null);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to verify user',
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openVerifyDialog = (user: UnverifiedUser) => {
    setSelectedUser(user);
    setVerifyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unverifiedUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Users awaiting email verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails Sent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs.filter(log => 
                new Date(log.created_at).toDateString() === new Date().toDateString() &&
                log.action_type === 'sent'
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verification emails sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Failed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs.filter(log => 
                new Date(log.created_at).toDateString() === new Date().toDateString() &&
                log.action_type === 'failed'
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Failed email attempts today</p>
          </CardContent>
        </Card>
      </div>

      {/* Unverified Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unverified Users</CardTitle>
              <CardDescription>Users who haven't verified their email addresses</CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : unverifiedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>All users are verified!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unverifiedUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendVerification(user)}
                          disabled={actionLoading === user.user_id}
                        >
                          {actionLoading === user.user_id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-3 w-3 mr-1" />
                              Resend
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openVerifyDialog(user)}
                          disabled={actionLoading === user.user_id}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Email Activity Log</CardTitle>
          <CardDescription>Recent email verification actions</CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No email activity yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.email_type.replace('admin_', '').replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.action_type === 'sent' || log.action_type === 'manually_verified' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {log.action_type === 'manually_verified' ? 'Verified' : 'Sent'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Verification Confirmation Dialog */}
      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manually Verify User?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to manually verify <strong>{selectedUser?.email}</strong>.
              <br /><br />
              This will mark their email as verified without requiring them to click a verification link.
              This action will be logged for audit purposes.
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualVerify}>
              Verify User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
