import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Filter, Search, Mail, Building, User, Calendar, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApiRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  request_type: string;
  message: string;
  status: string;
  assigned_to: string | null;
  internal_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
}

const ApiRequestsAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Detail dialog
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [requestStatus, setRequestStatus] = useState<string>("");

  // Check if user is staff
  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setCheckComplete(true);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin', 'support', 'manager']);

      if (roleError) {
        console.error('Error checking role:', roleError);
        setCheckComplete(true);
        return;
      }

      setIsStaff(roleData && roleData.length > 0);
      setCheckComplete(true);
    };

    checkStaffRole();
  }, [user]);

  // Fetch requests and staff members
  useEffect(() => {
    if (!isStaff || !user) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch API requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('api_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        toast({
          title: "Error loading requests",
          description: "Failed to fetch API access requests",
          variant: "destructive",
        });
      } else {
        setRequests(requestsData || []);
      }

      // Fetch staff members for assignment
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .in('user_id', 
          await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['super_admin', 'admin', 'support', 'manager'])
            .then(res => res.data?.map(r => r.user_id) || [])
        );

      if (staffError) {
        console.error('Error fetching staff:', staffError);
      } else {
        setStaffMembers(staffData?.map(s => ({
          id: s.user_id,
          full_name: s.full_name || s.email || 'Unknown',
          email: s.email || ''
        })) || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [isStaff, user, toast]);

  // Open detail dialog
  const handleViewDetails = (request: ApiRequest) => {
    setSelectedRequest(request);
    setInternalNotes(request.internal_notes || "");
    setAssignedTo(request.assigned_to || "");
    setRequestStatus(request.status);
    setDialogOpen(true);
  };

  // Update request
  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    const updates: any = {
      status: requestStatus,
      assigned_to: assignedTo || null,
      internal_notes: internalNotes || null,
    };

    // If marking as resolved, set resolved_at
    if (requestStatus === 'resolved' && selectedRequest.status !== 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('api_access_requests')
      .update(updates)
      .eq('id', selectedRequest.id);

    if (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Update failed",
        description: "Failed to update the request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request updated",
        description: "The API request has been updated successfully",
      });

      // Refresh requests
      const { data: updatedRequests } = await supabase
        .from('api_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      setRequests(updatedRequests || []);
      setDialogOpen(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    const matchesSearch = searchQuery === '' ||
      request.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get request type label
  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      enterprise: 'Enterprise',
      technical: 'Technical',
      partnership: 'Partnership',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (!checkComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isStaff) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
            </Link>
            <h1 className="text-xl font-bold">API Access Requests</h1>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>API Access Requests</CardTitle>
            <CardDescription>
              Manage and respond to API access requests from developers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No requests found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            {request.company}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{request.name}</div>
                            <div className="text-xs text-muted-foreground">{request.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getRequestTypeLabel(request.request_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {staffMembers.find(s => s.id === request.assigned_to)?.full_name || 'Unknown'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Access Request Details</DialogTitle>
            <DialogDescription>
              View and manage this API access request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedRequest.company}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Request Type</Label>
                  <Badge variant="outline">
                    {getRequestTypeLabel(selectedRequest.request_type)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{selectedRequest.name}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <a 
                    href={`mailto:${selectedRequest.email}`}
                    className="text-primary hover:underline"
                  >
                    {selectedRequest.email}
                  </a>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                
                {selectedRequest.resolved_at && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Resolved</Label>
                    <p>{new Date(selectedRequest.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Message</Label>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              </div>

              {/* Management Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Manage Request</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={requestStatus} onValueChange={setRequestStatus}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assigned">Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger id="assigned">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add internal notes about this request..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRequest}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiRequestsAdmin;
