import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Check, X, Eye, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BusinessApplication {
  business_id: string;
  business_name: string;
  business_type: string;
  owner_name: string;
  contact_email: string;
  phone_number: string;
  verification_status: string;
  documents_submitted: number;
  submitted_at: string;
  location: string;
  description: string;
}

export const AdminBusinessVerification = () => {
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      // Mock data for now - replace with actual RPC call once function is available  
      const mockData = [
        {
          business_id: '1',
          business_name: 'Lagos Tech Hub',
          business_type: 'technology',
          owner_name: 'John Doe',
          contact_email: 'john@lagostech.com',
          phone_number: '+234901234567',
          verification_status: 'pending',
          documents_submitted: 3,
          submitted_at: new Date().toISOString(),
          location: 'Lagos, Nigeria',
          description: 'A technology hub providing workspace and resources for startups'
        },
        {
          business_id: '2',
          business_name: 'Neighborhood Grocery',
          business_type: 'retail',
          owner_name: 'Jane Smith',
          contact_email: 'jane@grocery.com',
          phone_number: '+234907654321',
          verification_status: 'pending',
          documents_submitted: 2,
          submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          location: 'Abuja, Nigeria',
          description: 'Local grocery store serving the community'
        }
      ];
      
      setApplications(mockData);
    } catch (error) {
      console.error('Error fetching business applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch business verification queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (businessId: string, action: 'approve' | 'reject', notes?: string) => {
    setActionLoading(true);
    try {
      // Mock action for now - replace with actual database update
      console.log(`${action}ing business ${businessId}:`, notes);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.business_id === businessId 
          ? { ...app, verification_status: action === 'approve' ? 'verified' : 'rejected' }
          : app
      ));

      toast({
        title: "Success",
        description: `Business ${action}ed successfully`,
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating business status:', error);
      toast({
        title: "Error",
        description: "Failed to update business verification status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.verification_status?.toLowerCase() === statusFilter
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Verification</CardTitle>
          <CardDescription>Loading verification queue...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Verification Queue
            </CardTitle>
            <CardDescription>
              Review and verify business registration applications
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No business applications found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.business_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {app.business_name?.charAt(0)?.toUpperCase() || 'B'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{app.business_name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-32">
                          {app.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{app.owner_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {app.contact_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {app.business_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.documents_submitted > 0 ? "default" : "secondary"}>
                      {app.documents_submitted} docs
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(app.verification_status)}
                  </TableCell>
                  <TableCell>
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Business Application Review</DialogTitle>
                            <DialogDescription>
                              Review details for {app.business_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Business Name:</label>
                                <p className="text-sm text-muted-foreground">{app.business_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Business Type:</label>
                                <p className="text-sm text-muted-foreground capitalize">{app.business_type}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Owner Name:</label>
                                <p className="text-sm text-muted-foreground">{app.owner_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Contact Email:</label>
                                <p className="text-sm text-muted-foreground">{app.contact_email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Phone:</label>
                                <p className="text-sm text-muted-foreground">{app.phone_number}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Location:</label>
                                <p className="text-sm text-muted-foreground">{app.location}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Description:</label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {app.description || 'No description provided'}
                              </p>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Documents Submitted:</label>
                              <p className="text-sm text-muted-foreground">
                                {app.documents_submitted} documents uploaded for verification
                              </p>
                            </div>

                            {app.verification_status === 'pending' && (
                              <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                  onClick={() => handleVerificationAction(app.business_id, 'approve')}
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve Business
                                </Button>
                                <Button 
                                  onClick={() => handleVerificationAction(app.business_id, 'reject')}
                                  disabled={actionLoading}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject Application
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {app.verification_status === 'pending' && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            onClick={() => handleVerificationAction(app.business_id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerificationAction(app.business_id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};