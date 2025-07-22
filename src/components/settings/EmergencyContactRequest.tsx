import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserPlus, Shield, AlertTriangle, Phone, X } from 'lucide-react';

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_phone: string;
  status: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

const EmergencyContactRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadIncomingRequests();
      subscribeToRequests();
    }
    
    return () => {
      const subscription = supabase.channel('emergency-contact-requests');
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadIncomingRequests = async () => {
    if (!user || !profile?.phone) return;
    
    try {
      setLoading(true);
      
      // Get all incoming requests for this user's phone number
      const { data, error } = await supabase
        .from('emergency_contact_requests')
        .select(`
          id,
          sender_id,
          recipient_phone,
          status,
          created_at,
          notification_sent,
          profiles:sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq('recipient_phone', profile.phone)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map the data to a simpler format
      const mappedRequests = data.map((request: any) => ({
        id: request.id,
        sender_id: request.sender_id,
        recipient_phone: request.recipient_phone,
        status: request.status,
        notification_sent: request.notification_sent,
        created_at: request.created_at,
        sender: request.profiles
      }));
      
      setIncomingRequests(mappedRequests);
    } catch (error) {
      console.error('Error loading incoming requests:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contact requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRequests = () => {
    const subscription = supabase.channel('emergency-contact-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_contact_requests'
        },
        (payload) => {
          if (payload.new && payload.new.recipient_phone === profile?.phone) {
            loadIncomingRequests();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_contact_requests'
        },
        (payload) => {
          if (payload.new && payload.new.recipient_phone === profile?.phone) {
            loadIncomingRequests();
          }
        }
      )
      .subscribe();
  };

  const handleAccept = async (requestId: string, senderId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update the request status
      const { error: updateError } = await supabase
        .from('emergency_contact_requests')
        .update({
          status: 'accepted',
          recipient_id: user.id
        })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // Create a new emergency contact relationship
      const { error: insertError } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: senderId,
          contact_name: profile.full_name || 'Emergency Contact',
          phone_number: profile.phone,
          is_primary_contact: false,
          preferred_methods: ['in_app', 'phone_call'],
          is_confirmed: true, // Auto-confirm when accepting an invitation
        });
        
      if (insertError) throw insertError;
      
      // Also add the sender as my emergency contact
      const { data: senderData, error: senderError } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', senderId)
        .single();
        
      if (senderError) throw senderError;
      
      const { error: myContactError } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: senderData.full_name || 'Emergency Contact',
          phone_number: senderData.phone,
          is_primary_contact: false,
          preferred_methods: ['in_app', 'phone_call'],
          // This contact isn't auto-confirmed - they'll need to enter your code
        });
        
      if (myContactError) throw myContactError;
      
      toast({
        title: "Request Accepted",
        description: "You are now emergency contacts with each other.",
      });
      
      // Refresh the list
      loadIncomingRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept emergency contact request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contact_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({
        title: "Request Declined",
        description: "The emergency contact request has been declined.",
      });
      
      // Refresh the list
      loadIncomingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline emergency contact request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.phone) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You need to add a phone number to your profile to receive emergency contact requests.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Emergency Contact Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incomingRequests.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending emergency contact requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{request.sender?.full_name || 'Someone'}</h3>
                      <Badge variant="outline">New Request</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {request.recipient_phone}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Wants to add you as an emergency contact
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                      onClick={() => handleAccept(request.id, request.sender_id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => handleDecline(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    They will be notified during emergencies
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyContactRequest;