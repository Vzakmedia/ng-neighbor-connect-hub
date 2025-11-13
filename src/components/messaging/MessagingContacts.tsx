import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  UserPlus, 
  MessageCircle, 
  Phone, 
  Mail, 
  Check, 
  X, 
  Trash2,
  Send
} from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EmergencyContact {
  id: string;
  contact_name: string;
  phone_number: string;
  email?: string;
  relationship?: string;
  is_confirmed: boolean;
  is_primary: boolean;
  created_at: string;
  user_profile?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_phone: string;
  status: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
}

interface UserContact {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  last_seen?: string;
}

interface MessagingContactsProps {
  onStartConversation: (userId: string, contactName: string) => void;
}

const MessagingContacts = ({ onStartConversation }: MessagingContactsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [userContacts, setUserContacts] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<UserContact[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Fetch emergency contacts
  const fetchEmergencyContacts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching emergency contacts:', error);
      return;
    }

    // Fetch user profiles for contacts who are app users
    const contactsWithProfiles = await Promise.all(
      (data || []).map(async (contact) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('phone', contact.phone_number)
          .single();

        return {
          ...contact,
          user_profile: profile || null
        };
      })
    );

    setEmergencyContacts(contactsWithProfiles);
  };

  // Fetch contact requests
  const fetchContactRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('emergency_contact_requests')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching contact requests:', error);
      return;
    }

    // Fetch sender profiles separately
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('user_id', request.sender_id)
          .single();

        return {
          ...request,
          sender_profile: profile || { full_name: 'Unknown', phone: '', avatar_url: null }
        };
      })
    );

    setContactRequests(requestsWithProfiles);
  };

  // Fetch user contacts (people in the app)
  const fetchUserContacts = async () => {
    if (!user) return;

    // Get contacts from emergency contacts who are also app users
    const { data: emergencyData } = await supabase
      .from('emergency_contacts')
      .select('phone_number')
      .eq('user_id', user.id);

    if (!emergencyData) return;

    const phoneNumbers = emergencyData.map(ec => ec.phone_number);
    
    if (phoneNumbers.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('phone', phoneNumbers)
        .neq('user_id', user.id);

      if (error) {
        console.error('Error fetching user contacts:', error);
      } else {
        setUserContacts(data || []);
      }
    }
  };

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmergencyContacts(),
        fetchContactRequests(),
        fetchUserContacts()
      ]);
      setLoading(false);
    };

    loadContacts();

    // Set up real-time subscriptions
    const contactRequestsSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'emergency_contact_requests'
        }, (payload) => {
          console.log('Contact request change:', payload);
          // Refetch contact requests when any change occurs
          fetchContactRequests();
        }),
      {
        channelName: 'contact-requests-changes',
        onError: fetchContactRequests,
        pollInterval: 30000,
        debugName: 'MessagingContacts-contact-requests'
      }
    );

    const emergencyContactsSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'emergency_contacts'
        }, (payload) => {
          console.log('Emergency contact change:', payload);
          // Refetch contacts when any change occurs
          fetchEmergencyContacts();
          fetchUserContacts();
        }),
      {
        channelName: 'emergency-contacts-changes',
        onError: () => {
          fetchEmergencyContacts();
          fetchUserContacts();
        },
        pollInterval: 30000,
        debugName: 'MessagingContacts-emergency-contacts'
      }
    );

    return () => {
      contactRequestsSubscription?.unsubscribe();
      emergencyContactsSubscription?.unsubscribe();
    };
  }, [user]);

  // Search for app users
  const searchAppUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestedUsers([]);
      return;
    }

    setSearchingUsers(true);
    
    try {
      const { data, error } = await supabase
        .from('display_profiles')
        .select('user_id, display_name, avatar_url')
        .neq('user_id', user?.id)
        .or(`display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already contacts
      const existingContactIds = userContacts.map(contact => contact.user_id);
      const filteredUsers = (data || []).filter(user => !existingContactIds.includes(user.user_id));

      setSuggestedUsers(filteredUsers.map((user: any) => ({
        id: user.user_id,
        user_id: user.user_id,
        full_name: user.display_name || '',
        avatar_url: user.avatar_url
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Send contact request to app user
  const sendContactRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      // Get recipient phone from their profile
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', targetUserId)
        .single();

      if (!recipientProfile?.phone) {
        toast({
          title: "Error",
          description: "Could not find recipient's phone number.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('emergency_contact_requests')
        .insert({
          sender_id: user.id,
          recipient_id: targetUserId,
          recipient_phone: recipientProfile.phone,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Contact Request Sent",
        description: "Your contact request has been sent successfully.",
      });
      
      setSearchQuery('');
      setSuggestedUsers([]);
      setAddContactOpen(false);
      
      // Immediately refresh contact requests to show the new request
      await fetchContactRequests();
      
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast({
        title: "Error",
        description: "Failed to send contact request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete emergency contact
  const handleDeleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contact Deleted",
        description: "Emergency contact has been removed.",
      });
      fetchEmergencyContacts();
      fetchUserContacts();
    }
  };

  // Accept contact request
  const handleAcceptRequest = async (requestId: string) => {
    console.log('Accepting request:', requestId);
    const request = contactRequests.find(r => r.id === requestId);
    if (!request || !user) {
      console.log('Request not found or user not available:', { request, user });
      return;
    }

    try {
      console.log('Calling confirm_emergency_contact_request RPC...');
      const { data, error } = await supabase.rpc('confirm_emergency_contact_request', {
        _request_id: requestId,
        _accept: true
      });

      if (error) throw error;

      console.log('Request accepted successfully:', data);
      
      // Immediately remove the request from local state
      setContactRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: "Request Accepted",
        description: typeof data === 'object' && data && 'message' in data ? String(data.message) : "Contact request has been accepted and added to your contacts.",
      });
      
      // Refresh all contact data in background
      console.log('Refreshing contact data...');
      await Promise.all([
        fetchContactRequests(),
        fetchEmergencyContacts(),
        fetchUserContacts()
      ]);
      console.log('Contact data refreshed');
      
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept contact request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Decline contact request
  const handleDeclineRequest = async (requestId: string) => {
    const { data, error } = await supabase.rpc('confirm_emergency_contact_request', {
      _request_id: requestId,
      _accept: false
    });

    if (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline contact request.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Declined",
        description: "Contact request has been declined.",
      });
      fetchContactRequests();
    }
  };

  const filteredEmergencyContacts = emergencyContacts.filter(contact =>
    contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_number.includes(searchTerm)
  );

  const filteredUserContacts = userContacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-bold">Contacts</h2>
        </div>
        <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add App User</DialogTitle>
              <DialogDescription>
                Search and add other app users to your contact list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <Input
                  id="user-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchAppUsers(e.target.value);
                  }}
                  placeholder="Search by name or phone number..."
                  className="mb-2"
                />
                {searchingUsers && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                {suggestedUsers.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                    {suggestedUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name}</p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => sendContactRequest(user.user_id)}
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searchingUsers && suggestedUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No users found matching your search.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setAddContactOpen(false);
                setSearchQuery('');
                setSuggestedUsers([]);
              }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center border rounded-md px-3 py-2">
        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 px-0"
        />
      </div>

      {/* Contact Requests */}
      {contactRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {request.sender_profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.sender_profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{request.sender_profile?.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeclineRequest(request.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* App Users Contacts */}
      {filteredUserContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">App Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredUserContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={contact.avatar_url || undefined} />
                    <AvatarFallback>
                      {contact.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contact.full_name}</p>
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onStartConversation(contact.user_id, contact.full_name)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredEmergencyContacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No emergency contacts found. Add some contacts to get started.
            </p>
          ) : (
            filteredEmergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={contact.user_profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {contact.contact_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.contact_name}</p>
                      {contact.is_primary && (
                        <Badge variant="outline" className="text-xs">Primary</Badge>
                      )}
                      {contact.is_confirmed && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Confirmed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone_number}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                      )}
                      {contact.relationship && (
                        <span>• {contact.relationship}</span>
                      )}
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {contact.contact_name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingContacts;