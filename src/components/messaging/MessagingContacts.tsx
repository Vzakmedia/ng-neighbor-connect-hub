import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';
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
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: ''
  });

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
    } else {
      setEmergencyContacts(data || []);
    }
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
          .select('full_name, phone')
          .eq('user_id', request.sender_id)
          .single();

        return {
          ...request,
          sender_profile: profile || { full_name: 'Unknown', phone: '' }
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
  }, [user]);

  // Add new emergency contact
  const handleAddContact = async () => {
    if (!user || !newContact.name || !newContact.phone) {
      toast({
        title: "Error",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: user.id,
        contact_name: newContact.name,
        phone_number: newContact.phone,
        email: newContact.email || null,
        relationship: newContact.relationship || null,
        is_confirmed: false,
        is_primary: false
      });

    if (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contact Added",
        description: "Emergency contact has been added successfully.",
      });
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setAddContactOpen(false);
      fetchEmergencyContacts();
      fetchUserContacts();
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
    const { error } = await supabase
      .from('emergency_contact_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept contact request.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Accepted",
        description: "Contact request has been accepted.",
      });
      fetchContactRequests();
    }
  };

  // Decline contact request
  const handleDeclineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('emergency_contact_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                Add a new emergency contact to your list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Phone Number *</Label>
                <Input
                  id="contact-phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <Label htmlFor="contact-relationship">Relationship</Label>
                <Input
                  id="contact-relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  placeholder="Friend, Family, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setAddContactOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddContact}>
                Add Contact
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