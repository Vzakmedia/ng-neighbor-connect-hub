import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface BusinessApplication {
  id: string;
  business_name: string;
  description: string;
  category: string;
  phone: string | null;
  email: string | null;
  physical_address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  operating_hours: any;
  is_verified: boolean;
  verification_status: string;
  verification_documents: any;
  tax_id_number: string | null;
  business_license: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    phone: string;
    email: string;
  };
}

const BusinessVerificationAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<BusinessApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to avoid join issues
      const applicationsWithProfiles = await Promise.all(
        (data || []).map(async (application: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, phone, email')
            .eq('user_id', application.user_id)
            .maybeSingle();

          return {
            ...application,
            profiles: profile || { full_name: 'Unknown User', avatar_url: '', phone: '', email: '' }
          };
        })
      );

      setApplications(applicationsWithProfiles as BusinessApplication[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load business applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (applicationId: string, action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      const updates: any = {
        verification_status: action === 'approve' ? 'verified' : 'rejected',
        is_verified: action === 'approve',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', applicationId as any);

      if (error) throw error;

      // Send notification to business owner
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        await supabase
          .from('alert_notifications')
          .insert({
            recipient_id: application.user_id,
            notification_type: 'business_verification',
            content: action === 'approve' 
              ? `Congratulations! Your business "${application.business_name}" has been verified and is now live on NeighborLink NG.`
              : `Your business application for "${application.business_name}" has been rejected. ${reviewNotes ? `Reason: ${reviewNotes}` : 'Please review and resubmit.'}`,
            sender_name: 'NeighborLink NG Admin'
          } as any);
      }

      toast({
        title: `Business ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `${application?.business_name} has been ${action === 'approve' ? 'verified and activated' : 'rejected'}.`,
      });

      fetchApplications();
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (error) {
      console.error(`Error ${action}ing business:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} business application`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBusinessInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const pendingApplications = applications.filter(app => app.verification_status === 'pending');
  const verifiedBusinesses = applications.filter(app => app.verification_status === 'verified');
  const rejectedApplications = applications.filter(app => app.verification_status === 'rejected');

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{verifiedBusinesses.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedApplications.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedBusinesses.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <Card key={application.id} className="border-yellow-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={application.logo_url || application.profiles?.avatar_url} />
                            <AvatarFallback>
                              {getBusinessInitials(application.business_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                          <CardTitle className="text-lg">{application.business_name}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{formatCategory(application.category)}</span>
                            {application.city && application.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {application.city}, {application.state}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Applied {formatTimeAgo(application.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Business Application Review
                              </DialogTitle>
                              <DialogDescription>
                                Review and approve or reject this business application
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedApplication && (
                              <div className="space-y-6">
                                {/* Business Info */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Business Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium">Business Name</p>
                                        <p className="text-muted-foreground">{selectedApplication.business_name}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Category</p>
                                        <p className="text-muted-foreground">{formatCategory(selectedApplication.category)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-muted-foreground">{selectedApplication.phone || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-muted-foreground">{selectedApplication.email || 'Not provided'}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Description</p>
                                      <p className="text-muted-foreground">{selectedApplication.description}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Address</p>
                                      <p className="text-muted-foreground">{selectedApplication.physical_address}</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Owner Info */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Business Owner</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage src={selectedApplication.profiles?.avatar_url} />
                                        <AvatarFallback>
                                          {selectedApplication.profiles?.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{selectedApplication.profiles?.full_name || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">{selectedApplication.profiles?.email}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Documents */}
                                {(selectedApplication.tax_id_number || selectedApplication.business_license) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Documents</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {selectedApplication.tax_id_number && (
                                        <div>
                                          <p className="text-sm font-medium">Tax ID (TIN)</p>
                                          <p className="text-muted-foreground">{selectedApplication.tax_id_number}</p>
                                        </div>
                                      )}
                                      {selectedApplication.business_license && (
                                        <div>
                                          <p className="text-sm font-medium">Business License</p>
                                          <p className="text-muted-foreground">{selectedApplication.business_license}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Review Notes */}
                                <div className="space-y-2">
                                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                                  <Textarea
                                    id="review-notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about the review decision..."
                                    rows={3}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                  <Button
                                    onClick={() => handleApproval(selectedApplication.id, 'approve')}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700 flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {processing ? 'Processing...' : 'Approve Business'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproval(selectedApplication.id, 'reject')}
                                    disabled={processing}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {processing ? 'Processing...' : 'Reject Application'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {application.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {application.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {application.phone}
                        </span>
                      )}
                      {application.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {verifiedBusinesses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No verified businesses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedBusinesses.map((business) => (
                <Card key={business.id} className="border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={business.logo_url || business.profiles?.avatar_url} />
                        <AvatarFallback>
                          {getBusinessInitials(business.business_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{business.business_name}</h3>
                          <Shield className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">{formatCategory(business.category)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Verified {formatTimeAgo(business.updated_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedApplications.map((application) => (
                <Card key={application.id} className="border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={application.logo_url || application.profiles?.avatar_url} />
                          <AvatarFallback>
                            {getBusinessInitials(application.business_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{application.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{formatCategory(application.category)}</p>
                          <p className="text-xs text-muted-foreground">
                            Rejected {formatTimeAgo(application.updated_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessVerificationAdmin;