import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Plus, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  invitation_code: string;
  status: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

const StaffInvitationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: ''
  });

  const roles = [
    { value: 'moderator', label: 'Moderator', description: 'Content moderation and community safety' },
    { value: 'manager', label: 'Manager', description: 'Business operations and platform management' },
    { value: 'support', label: 'Support', description: 'User assistance and emergency response' },
    { value: 'staff', label: 'Staff', description: 'Basic monitoring and platform oversight' }
  ];

  useEffect(() => {
    fetchInvitations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('staff-invitations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'staff_invitations' },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load staff invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async () => {
    if (!newInvite.email || !newInvite.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_staff_invitation', {
        _email: newInvite.email,
        _role: newInvite.role as any,
        _invited_by: user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff invitation created successfully"
      });

      setNewInvite({ email: '', role: '' });
      setInviteDialogOpen(false);
      fetchInvitations();
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staff invitation",
        variant: "destructive"
      });
    }
  };

  const copyInvitationLink = async (code: string) => {
    const inviteUrl = `${window.location.origin}/staff-login?invitation=${code}`;
    const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
    const { copyToClipboard } = useNativeClipboard();
    await copyToClipboard(inviteUrl, "Invitation link copied to clipboard");
  };

  const deactivateInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_invitations')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation deactivated"
      });

      fetchInvitations();
    } catch (error) {
      console.error('Error deactivating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate invitation",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (invitation: StaffInvitation) => {
    if (invitation.used_at) {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Used</Badge>;
    }
    if (invitation.status === 'inactive') {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading staff invitations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Staff Invitation Management
            </CardTitle>
            <CardDescription>
              Invite and manage staff members with role-based access
            </CardDescription>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a secure invitation for a new staff member
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@example.com"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Staff Role</Label>
                  <Select value={newInvite.role} onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createInvitation}>
                    Create Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {roles.find(r => r.value === invitation.role)?.label || invitation.role}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(invitation)}</TableCell>
                <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {invitation.status === 'pending' && !invitation.used_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInvitationLink(invitation.invitation_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {invitation.status === 'pending' && !invitation.used_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateInvitation(invitation.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {invitations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No staff invitations created yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffInvitationManager;