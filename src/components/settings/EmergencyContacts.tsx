import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Phone, 
  MessageCircle, 
  Smartphone, 
  Star, 
  Edit, 
  Trash2,
  Users,
  MapPin,
  Shield,
  UserPlus,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useMinimalAuth as useAuth } from '@/hooks/useAuth-minimal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmergencyContactRequest from './EmergencyContactRequest';

type ContactMethod = 'in_app' | 'sms' | 'whatsapp' | 'phone_call';

interface EmergencyContact {
  id: string;
  contact_name: string;
  phone_number: string;
  relationship: string;
  is_primary: boolean;
  is_primary_contact: boolean;
  can_receive_location: boolean;
  can_alert_public: boolean;
  preferred_methods: ContactMethod[];
  is_confirmed: boolean;
}

const EmergencyContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isInvitingContact, setIsInvitingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState<{
    contact_name: string;
    phone_number: string;
    relationship: string;
    is_primary_contact: boolean;
    can_receive_location: boolean;
    can_alert_public: boolean;
    preferred_methods: ContactMethod[];
  }>({
    contact_name: '',
    phone_number: '',
    relationship: '',
    is_primary_contact: false,
    can_receive_location: true,
    can_alert_public: false,
    preferred_methods: ['in_app']
  });

  const [inviteData, setInviteData] = useState({
    phone_number: ''
  });

  const contactMethods: { value: ContactMethod; label: string; icon: JSX.Element }[] = [
    { value: 'in_app', label: 'In-App Notification', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'sms', label: 'SMS', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'phone_call', label: 'Phone Call', icon: <Phone className="h-4 w-4" /> }
  ];

  const relationshipTypes = [
    'Family', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 
    'Neighbor', 'Colleague', 'Doctor', 'Other'
  ];

  useEffect(() => {
    if (user) {
      loadContacts();
      loadProfile();
      loadSentRequests();
      subscribeToContacts();
    }
    
    return () => {
      const subscription = supabase.channel('emergency-contacts');
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      // For development - handle mock user ID
      const userId = user.id === 'mock-user-id' ? 
        'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id;
        
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSentRequests = async () => {
    if (!user) return;
    
    try {
      // For development - handle mock user ID
      const userId = user.id === 'mock-user-id' ? 
        'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id;
        
      const { data, error } = await supabase
        .from('emergency_contact_requests')
        .select(`
          id,
          recipient_phone,
          status,
          created_at
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setSentRequests(data || []);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  const subscribeToContacts = () => {
    const subscription = supabase.channel('emergency-contacts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_contacts'
        },
        (payload) => {
          if (payload.new && payload.new.user_id === user?.id) {
            loadContacts();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_contacts'
        },
        (payload) => {
          if (payload.new && payload.new.user_id === user?.id) {
            loadContacts();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'emergency_contacts'
        },
        () => {
          loadContacts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_contact_requests'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'sender_id' in payload.new && payload.new.sender_id === user?.id) {
            loadSentRequests();
          }
        }
      )
      .subscribe();
  };

  const loadContacts = async () => {
    if (!user) return;

    try {
      // For development - handle mock user ID
      const userId = user.id === 'mock-user-id' ? 
        'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id;
        
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary_contact', { ascending: false })
        .order('contact_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts.",
        variant: "destructive"
      });
    }
  };

  const sendInvitation = async () => {
    if (!user || !inviteData.phone_number || !profile?.phone) return;
    
    setLoading(true);
    try {
      // For development - handle mock user ID
      const userId = user.id === 'mock-user-id' ? 
        'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id;
        
      // Check if this phone number is already invited
      const { data: existingRequests, error: checkError } = await supabase
        .from('emergency_contact_requests')
        .select('id, status')
        .eq('sender_id', userId)
        .eq('recipient_phone', inviteData.phone_number)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (existingRequests && existingRequests.length > 0) {
        const latestRequest = existingRequests[0];
        if (latestRequest.status === 'pending') {
          toast({
            title: "Invitation Already Sent",
            description: "You have already invited this contact. They need to accept your invitation.",
          });
          setIsInvitingContact(false);
          setLoading(false);
          return;
        }
      }
      
      // Send the invitation
      const { error } = await supabase
        .from('emergency_contact_requests')
        .insert({
          sender_id: user.id === 'mock-user-id' ? 
            'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id,
          recipient_phone: inviteData.phone_number
        });
        
      if (error) throw error;
      
      toast({
        title: "Invitation Sent",
        description: "Emergency contact invitation has been sent.",
      });
      
      setInviteData({ phone_number: '' });
      setIsInvitingContact(false);
      loadSentRequests();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send emergency contact invitation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    if (!user || !formData.contact_name || !formData.phone_number) return;

    setLoading(true);
    try {
      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            contact_name: formData.contact_name,
            phone_number: formData.phone_number,
            relationship: formData.relationship,
            is_primary_contact: formData.is_primary_contact,
            can_receive_location: formData.can_receive_location,
            can_alert_public: formData.can_alert_public,
            preferred_methods: formData.preferred_methods
          })
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('emergency_contacts')
          .insert({
            user_id: user.id === 'mock-user-id' ? 
              'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48' : user.id,
            contact_name: formData.contact_name,
            phone_number: formData.phone_number,
            relationship: formData.relationship,
            is_primary_contact: formData.is_primary_contact,
            can_receive_location: formData.can_receive_location,
            can_alert_public: formData.can_alert_public,
            preferred_methods: formData.preferred_methods
          });

        if (error) throw error;
      }

      await loadContacts();
      resetForm();
      toast({
        title: "Contact saved",
        description: `Emergency contact ${editingContact ? 'updated' : 'added'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      await loadContacts();
      toast({
        title: "Contact deleted",
        description: "Emergency contact removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: '',
      phone_number: '',
      relationship: '',
      is_primary_contact: false,
      can_receive_location: true,
      can_alert_public: false,
      preferred_methods: ['in_app']
    });
    setIsAddingContact(false);
    setEditingContact(null);
  };

  const startEditContact = (contact: EmergencyContact) => {
    setFormData({
      contact_name: contact.contact_name,
      phone_number: contact.phone_number,
      relationship: contact.relationship || '',
      is_primary_contact: contact.is_primary_contact,
      can_receive_location: contact.can_receive_location,
      can_alert_public: contact.can_alert_public,
      preferred_methods: contact.preferred_methods || ['in_app']
    });
    setEditingContact(contact);
    setIsAddingContact(true);
  };

  const handleMethodChange = (method: ContactMethod, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferred_methods: checked
        ? [...prev.preferred_methods, method]
        : prev.preferred_methods.filter(m => m !== method)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Emergency Contact Requests */}
      <EmergencyContactRequest />
      
      {/* Main Emergency Contacts Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={isInvitingContact} onOpenChange={setIsInvitingContact}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Invite Emergency Contact</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Invite someone to be your emergency contact. They will receive a notification and need to accept your invitation.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">Contact's Phone Number</Label>
                    <Input
                      id="invite-phone"
                      type="tel"
                      placeholder="+234 XXX XXX XXXX"
                      value={inviteData.phone_number}
                      onChange={(e) => setInviteData({ phone_number: e.target.value })}
                    />
                  </div>
                  
                  {sentRequests.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Your Pending Invitations</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {sentRequests
                          .filter(req => req.status === 'pending')
                          .map(request => (
                            <div key={request.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span className="text-xs">{request.recipient_phone}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsInvitingContact(false)} 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={sendInvitation} 
                      disabled={loading || !inviteData.phone_number} 
                      className="flex-1"
                    >
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full Name</Label>
                    <Input
                      id="contact-name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                      placeholder="Enter contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="+234 XXX XXX XXXX"
                      type="tel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipTypes.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Preferred Contact Methods</Label>
                    {contactMethods.map((method) => (
                      <div key={method.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`method-${method.value}`}
                          checked={formData.preferred_methods.includes(method.value)}
                          onCheckedChange={(checked) => handleMethodChange(method.value, !!checked)}
                        />
                        <Label 
                          htmlFor={`method-${method.value}`} 
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {method.icon}
                          {method.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primary-contact"
                        checked={formData.is_primary_contact}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary_contact: !!checked }))}
                      />
                      <Label htmlFor="primary-contact" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Primary Contact
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="share-location"
                        checked={formData.can_receive_location}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_receive_location: !!checked }))}
                      />
                      <Label htmlFor="share-location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Can receive location updates
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alert-public"
                        checked={formData.can_alert_public}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_alert_public: !!checked }))}
                      />
                      <Label htmlFor="alert-public" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Can alert public on my behalf
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={saveContact} disabled={loading} className="flex-1">
                      {loading ? 'Saving...' : (editingContact ? 'Update' : 'Add')} Contact
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sent Invitations Section */}
          {sentRequests.filter(req => req.status === 'pending').length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Invitations
              </h3>
              <div className="space-y-2">
                {sentRequests
                  .filter(req => req.status === 'pending')
                  .map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{request.recipient_phone}</span>
                      </div>
                      <Badge variant="outline">Awaiting Response</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        
          {/* Contacts List */}
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No emergency contacts added yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add contacts who should be notified in case of emergencies.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{contact.contact_name}</h3>
                        {contact.is_primary_contact && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.phone_number} • {contact.relationship}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.preferred_methods?.map((method) => {
                          const methodInfo = contactMethods.find(m => m.value === method);
                          return methodInfo ? (
                            <Badge key={method} variant="outline" className="text-xs">
                              {methodInfo.icon}
                              <span className="ml-1">{methodInfo.label}</span>
                            </Badge>
                          ) : null;
                        })}
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {contact.can_receive_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location sharing
                          </span>
                        )}
                        {contact.can_alert_public && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Public alerts
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditContact(contact)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteContact(contact.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyContacts;