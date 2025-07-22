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
  Clock,
  Key,
  Lock,
  LockKeyhole,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

interface SearchResult {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
}

const EmergencyContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isInvitingContact, setIsInvitingContact] = useState(false);
  const [isConfirmingContact, setIsConfirmingContact] = useState(false);
  const [isViewingCode, setIsViewingCode] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [contactToConfirm, setContactToConfirm] = useState<EmergencyContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [contactCode, setContactCode] = useState<string>('');
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    contact_name: '',
    phone_number: '',
    email: '',
    profile_name: '',
    search_query: '',
    search_type: 'phone' as 'phone' | 'email' | 'profile',
    relationship: '',
    is_primary_contact: false,
    can_receive_location: true,
    can_alert_public: false,
    preferred_methods: ['in_app'] as ContactMethod[]
  });

  const [inviteData, setInviteData] = useState({
    search_query: '',
    search_type: 'phone' as 'phone' | 'email' | 'profile'
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const loadSentRequests = async () => {
    if (!user) return;
    
    try {
        
      const { data, error } = await supabase
        .from('emergency_contact_requests')
        .select(`
          id,
          recipient_phone,
          status,
          created_at
        `)
        .eq('sender_id', user.id)
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
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary_contact', { ascending: false })
        .order('contact_name');

      if (error) throw error;
      
      // Map the data to ensure it matches our interface
      const mappedContacts = data.map(contact => ({
        ...contact,
        is_confirmed: !!contact.is_confirmed // Ensure boolean type
      }));
      
      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts.",
        variant: "destructive"
      });
    }
  };

  const searchContacts = async (query: string, searchType: 'phone' | 'email' | 'profile') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (searchType === 'phone') {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .eq('phone', query)
          .limit(5);
        
        if (error) throw error;
        setSearchResults((data || []).map(item => ({ ...item, email: '' })));
      } else if (searchType === 'profile') {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .ilike('full_name', `%${query}%`)
          .limit(5);
        
        if (error) throw error;
        setSearchResults((data || []).map(item => ({ ...item, email: '' })));
      } else {
        // Email search not supported yet
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sendInvitation = async () => {
    if (!user || !inviteData.search_query || !profile?.phone) return;
    
    setLoading(true);
    try {
      // Check if this search query is already invited
      const { data: existingRequests, error: checkError } = await supabase
        .from('emergency_contact_requests')
        .select('id, status')
        .eq('sender_id', user.id)
        .eq('recipient_phone', inviteData.search_query)
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
          sender_id: user.id,
          recipient_phone: inviteData.search_query
        });
        
      if (error) throw error;
      
      toast({
        title: "Invitation Sent",
        description: "Emergency contact invitation has been sent.",
      });
      
      setInviteData({ search_query: '', search_type: 'phone' });
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
            email: formData.email,
            profile_name: formData.profile_name,
            search_query: formData.search_query,
            search_type: formData.search_type,
            relationship: formData.relationship,
            is_primary_contact: formData.is_primary_contact,
            can_receive_location: formData.can_receive_location,
            can_alert_public: formData.can_alert_public,
            preferred_methods: formData.preferred_methods
          })
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        // First check if this phone number belongs to a user on the app
        const { data: matchingProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('phone', formData.phone_number)
          .limit(1);
          
        if (profileError) throw profileError;
        
        const isAppUser = matchingProfiles && matchingProfiles.length > 0;
        
        // Create new contact
        const { data: newContact, error } = await supabase
          .from('emergency_contacts')
          .insert({
            user_id: user.id,
            contact_name: formData.contact_name,
            phone_number: formData.phone_number,
            email: formData.email,
            profile_name: formData.profile_name,
            search_query: formData.search_query,
            search_type: formData.search_type,
            relationship: formData.relationship,
            is_primary_contact: formData.is_primary_contact,
            can_receive_location: formData.can_receive_location,
            can_alert_public: formData.can_alert_public,
            preferred_methods: formData.preferred_methods,
            is_confirmed: isAppUser // Auto-confirm if they're an app user
          })
          .select()
          .single();

        if (error) throw error;
        
        // If the contact is an app user, send them a notification
        if (isAppUser) {
          const appUser = matchingProfiles![0];
          
          // Create a contact request for quick connecting
          const { error: requestError } = await supabase
            .from('emergency_contact_requests')
            .insert({
              sender_id: user.id,
              recipient_phone: formData.phone_number,
              recipient_id: appUser.user_id,
              status: 'pending',
              notification_sent: true
            });
            
          if (requestError) throw requestError;
          
          toast({
            title: "Contact saved and notified",
            description: `${formData.contact_name} is on the app and has been notified of your request.`,
          });
        } else {
          toast({
            title: "Contact saved",
            description: "Remember to get their confirmation code to verify this contact.",
          });
        }
      }

      await loadContacts();
      resetForm();
      
      if (editingContact) {
        toast({
          title: "Contact updated",
          description: "Emergency contact has been successfully updated.",
        });
      }
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
      email: '',
      profile_name: '',
      search_query: '',
      search_type: 'phone',
      relationship: '',
      is_primary_contact: false,
      can_receive_location: true,
      can_alert_public: false,
      preferred_methods: ['in_app']
    });
    setIsAddingContact(false);
    setEditingContact(null);
    setConfirmationCode('');
    setContactToConfirm(null);
    setIsConfirmingContact(false);
    setSearchResults([]);
  };

  const startEditContact = (contact: EmergencyContact) => {
    setFormData({
      contact_name: contact.contact_name,
      phone_number: contact.phone_number,
      email: '',
      profile_name: '',
      search_query: '',
      search_type: 'phone',
      relationship: contact.relationship || '',
      is_primary_contact: contact.is_primary_contact,
      can_receive_location: contact.can_receive_location,
      can_alert_public: contact.can_alert_public,
      preferred_methods: contact.preferred_methods || ['in_app']
    });
    setEditingContact(contact);
    setIsAddingContact(true);
  };
  
  const startConfirmContact = (contact: EmergencyContact) => {
    setContactToConfirm(contact);
    setConfirmationCode('');
    setIsConfirmingContact(true);
  };
  
  const confirmContact = async () => {
    if (!contactToConfirm || !confirmationCode) return;
    
    setLoading(true);
    try {
      // Verify the confirmation code and update the contact
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('confirm_code')
        .eq('id', contactToConfirm.id)
        .single();
        
      if (error) throw error;
      
      if (data.confirm_code !== confirmationCode) {
        toast({
          title: "Invalid Code",
          description: "The confirmation code you entered is incorrect.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Update the contact to be confirmed
      const { error: updateError } = await supabase
        .from('emergency_contacts')
        .update({ is_confirmed: true })
        .eq('id', contactToConfirm.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Contact Confirmed",
        description: "Emergency contact has been successfully confirmed.",
      });
      
      // Refresh the contacts list
      await loadContacts();
      
      // Close the confirmation dialog
      setIsConfirmingContact(false);
      setContactToConfirm(null);
      setConfirmationCode('');
    } catch (error) {
      console.error('Error confirming contact:', error);
      toast({
        title: "Error",
        description: "Failed to confirm emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (method: ContactMethod, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferred_methods: checked
        ? [...prev.preferred_methods, method]
        : prev.preferred_methods.filter(m => m !== method)
    }));
  };

  const selectSearchResult = (result: SearchResult) => {
    let searchValue = '';
    if (inviteData.search_type === 'phone') {
      searchValue = result.phone;
    } else if (inviteData.search_type === 'email') {
      searchValue = result.email;
    } else {
      searchValue = result.full_name;
    }
    
    setInviteData(prev => ({ ...prev, search_query: searchValue || '' }));
    setSearchResults([]);
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
                  Find & Invite Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Find & Invite Emergency Contact</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-3">
                   <p className="text-sm text-muted-foreground">
                     Find and invite someone to be your emergency contact by their phone number, email, or profile name.
                   </p>
                   
                   <div className="space-y-2">
                     <Label htmlFor="search-type">Search by</Label>
                     <Select
                       value={inviteData.search_type}
                       onValueChange={(value) => setInviteData(prev => ({ ...prev, search_type: value as 'phone' | 'email' | 'profile' }))}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="phone">Phone Number</SelectItem>
                         <SelectItem value="email">Email Address</SelectItem>
                         <SelectItem value="profile">Profile Name</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="search-query">
                       {inviteData.search_type === 'phone' && 'Phone Number'}
                       {inviteData.search_type === 'email' && 'Email Address'}
                       {inviteData.search_type === 'profile' && 'Profile Name'}
                     </Label>
                     <Input
                       id="search-query"
                       type={inviteData.search_type === 'email' ? 'email' : inviteData.search_type === 'phone' ? 'tel' : 'text'}
                       placeholder={
                         inviteData.search_type === 'phone' ? '+234 XXX XXX XXXX' :
                         inviteData.search_type === 'email' ? 'user@example.com' :
                         'Enter name to search'
                       }
                       value={inviteData.search_query}
                       onChange={(e) => {
                         const value = e.target.value;
                         setInviteData(prev => ({ ...prev, search_query: value }));
                         if (value.length > 2) {
                           searchContacts(value, inviteData.search_type);
                         } else {
                           setSearchResults([]);
                         }
                       }}
                     />
                   </div>
                   
                   {/* Search Results */}
                   {searchResults.length > 0 && (
                     <div className="mt-3">
                       <Label className="text-sm font-medium">Found Users</Label>
                       <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                         {searchResults.map((result) => (
                           <div 
                             key={result.user_id} 
                             className="flex items-center justify-between p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                             onClick={() => selectSearchResult(result)}
                           >
                             <div className="flex flex-col">
                               <span className="text-sm font-medium">{result.full_name}</span>
                               <span className="text-xs text-muted-foreground">
                                 {inviteData.search_type === 'phone' ? result.phone : 
                                  inviteData.search_type === 'email' ? result.email : 
                                  result.phone}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   
                   {isSearching && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <RefreshCw className="h-4 w-4 animate-spin" />
                       Searching...
                     </div>
                   )}
                   
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
                       disabled={loading || !inviteData.search_query} 
                       className="flex-1"
                     >
                       {loading ? 'Sending...' : 'Send Invitation'}
                     </Button>
                   </div>
                 </div>
              </DialogContent>
            </Dialog>
            
            {/* Confirmation Dialog */}
            <Dialog open={isConfirmingContact} onOpenChange={setIsConfirmingContact}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <LockKeyhole className="h-5 w-5" />
                    Confirm Emergency Contact
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-3">
                  {contactToConfirm && (
                    <>
                      <p className="text-sm">
                        To confirm <strong>{contactToConfirm.contact_name}</strong> as your emergency contact, 
                        please enter the confirmation code they provided to you.
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmation-code">Confirmation Code</Label>
                        <Input
                          id="confirmation-code"
                          value={confirmationCode}
                          onChange={(e) => setConfirmationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Ask your emergency contact to go to their settings and share their unique code with you.</p>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsConfirmingContact(false)} 
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={confirmContact} 
                          disabled={loading || !confirmationCode || confirmationCode.length < 6} 
                          className="flex-1"
                        >
                          {loading ? 'Confirming...' : 'Confirm Contact'}
                        </Button>
                      </div>
                    </>
                  )}
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
          {/* View Confirmation Code Dialog */}
          <Dialog open={isViewingCode} onOpenChange={setIsViewingCode}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Your Confirmation Code
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                <p className="text-sm">
                  Share this code with your emergency contact so they can verify and confirm you.
                </p>
                
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-mono tracking-widest font-semibold">{contactCode}</p>
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>This is your unique confirmation code for the selected contact.</p>
                  <p className="mt-2">Ask them to enter this code in their emergency contacts section.</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => setIsViewingCode(false)} 
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Your Confirmation Codes Section */}
          {profile?.phone && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Your Confirmation Codes
              </h3>
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm mb-3">
                  If someone has added you as an emergency contact, they will need your confirmation code to verify the relationship.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    
                    try {
                      const { data, error } = await supabase
                        .from('emergency_contacts')
                        .select('id, contact_name, confirm_code')
                        .not('confirm_code', 'is', null)
                        .eq('phone_number', profile?.phone)
                        .limit(1);
                        
                      if (error) throw error;
                      
                      if (data && data.length > 0) {
                        setSelectedContact(data[0] as any);
                        setContactCode(data[0].confirm_code);
                        setIsViewingCode(true);
                      } else {
                        toast({
                          title: "No Confirmation Code",
                          description: "No one has added you as their emergency contact yet.",
                        });
                      }
                    } catch (error) {
                      console.error('Error fetching confirmation code:', error);
                      toast({
                        title: "Error",
                        description: "Failed to retrieve confirmation code.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Key className="h-4 w-4 mr-2" />
                  View My Confirmation Code
                </Button>
              </div>
            </div>
          )}
          
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
                        {contact.is_confirmed ? (
                          <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Unconfirmed
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
                      {!contact.is_confirmed && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => startConfirmContact(contact)}
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                      )}
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
