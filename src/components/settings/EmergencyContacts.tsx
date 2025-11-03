import React, { useState, useEffect } from 'react';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  MessageSquare, 
  Smartphone, 
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  Copy,
  LockKeyhole,
  Search,
  UserCheck,
  Loader2
} from 'lucide-react';

type ContactMethod = 'in_app' | 'sms' | 'whatsapp' | 'phone_call';

interface EmergencyContact {
  id: string;
  contact_name: string;
  phone_number: string;
  relationship?: string;
  preferred_methods: ContactMethod[];
  is_primary_contact: boolean;
  can_receive_location: boolean;
  can_alert_public: boolean;
  is_confirmed: boolean;
  confirm_code?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
}

const EmergencyContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isConfirmingContact, setIsConfirmingContact] = useState(false);
  const [isViewingCode, setIsViewingCode] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [contactToConfirm, setContactToConfirm] = useState<EmergencyContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [contactCode, setContactCode] = useState<string>('');
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [verifyingContact, setVerifyingContact] = useState<EmergencyContact | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    contact_name: '',
    phone_number: '',
    relationship: '',
    is_primary_contact: false,
    can_receive_location: true,
    can_alert_public: false,
    preferred_methods: ['in_app'] as ContactMethod[]
  });

  const contactMethods: { value: ContactMethod; label: string; icon: JSX.Element }[] = [
    { value: 'in_app', label: 'In-App Notification', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'sms', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'phone_call', label: 'Phone Call', icon: <Phone className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure user is fully loaded
      const timeoutId = setTimeout(() => {
        loadProfile();
        loadContacts();
        subscribeToContacts();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        const subscription = supabase.channel('emergency-contacts');
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const searchUsersByPhone = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, email, neighborhood, city, state, avatar_url')
        .or(`phone.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone_number: value }));
    
    // Clear any existing timeout
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Set a new timeout to avoid making too many requests while typing
    const timeout = setTimeout(() => {
      searchUsersByPhone(value);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const selectUserFromSearch = (profile: UserProfile) => {
    setFormData(prev => ({
      ...prev,
      contact_name: profile.full_name || '',
      phone_number: profile.phone || '',
    }));
    setSearchResults([]);
  };

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      console.log('EmergencyContacts: Loading profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('EmergencyContacts: Profile load error:', error);
        throw error;
      }
      
      console.log('EmergencyContacts: Profile loaded successfully');
      setProfile(data);
    } catch (error) {
      console.error('EmergencyContacts: Error loading profile:', error);
      // Don't show toast for profile errors to reduce noise
    }
  };

  const subscribeToContacts = () => {
    const subscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'emergency_contacts'
        }, () => {
          loadContacts();
        }),
      {
        channelName: 'emergency-contacts',
        onError: loadContacts,
        pollInterval: 45000,
        debugName: 'EmergencyContacts'
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  };

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('EmergencyContacts: Loading contacts for user:', user.id);
      
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('EmergencyContacts: Database error:', error);
        throw error;
      }
      
      console.log('EmergencyContacts: Loaded contacts:', data?.length || 0);
      setContacts(data || []);
    } catch (error: any) {
      console.error('EmergencyContacts: Error loading emergency contacts:', error);
      
      // Only show toast for unexpected errors
      if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
        toast({
          title: "Error Loading Contacts",
          description: "Some contacts may not be visible. Please refresh the page.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Insert the contact in the emergency_contacts table
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: formData.contact_name,
          phone_number: formData.phone_number,
          relationship: formData.relationship,
          preferred_methods: formData.preferred_methods,
          is_primary_contact: formData.is_primary_contact,
          can_receive_location: formData.can_receive_location,
          can_alert_public: formData.can_alert_public
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Create a contact request and notification system
      try {
        const { data: request, error: requestError } = await supabase
          .from('emergency_contact_requests')
          .insert({
            sender_id: user.id,
            recipient_phone: formData.phone_number,
            status: 'pending'
          })
          .select()
          .single();
        
        if (requestError) {
          console.error('Error creating contact request:', requestError);
          toast({
            title: "Warning",
            description: "Contact added but notification may be delayed.",
            variant: "default"
          });
        } else {
          console.log('Contact request created:', request);
          
          // Try to trigger the edge function
          try {
            const { data: response, error: funcError } = await supabase.functions.invoke(
              'emergency-contact-invitation',
              {
                body: {
                  type: 'INSERT',
                  table: 'emergency_contact_requests',
                  record: request,
                  schema: 'public',
                  old_record: null
                }
              }
            );
            
            if (funcError) {
              console.warn('Edge function not available, notifications may be delayed:', funcError);
              // Don't fail the whole operation, database trigger will handle it
            } else {
              console.log('Edge function response:', response);
            }
          } catch (funcErr) {
            console.warn('Edge function invocation failed:', funcErr);
            // Continue anyway - the contact is added
          }
        }
      } catch (e: any) {
        console.error('Error in contact request creation:', e);
        toast({
          title: "Warning",
          description: "Contact added but notification system may be unavailable. Contact will still receive alerts.",
          variant: "default"
        });
      }
      
      toast({
        title: "Emergency Contact Added",
        description: `${formData.contact_name} has been added as an emergency contact.`,
      });
      
      // Reset form
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
      loadContacts();
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to add emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          contact_name: formData.contact_name,
          phone_number: formData.phone_number,
          relationship: formData.relationship,
          preferred_methods: formData.preferred_methods,
          is_primary_contact: formData.is_primary_contact,
          can_receive_location: formData.can_receive_location,
          can_alert_public: formData.can_alert_public
        })
        .eq('id', editingContact.id);
        
      if (error) throw error;
      
      toast({
        title: "Contact Updated",
        description: "Emergency contact has been updated successfully.",
      });
      
      setEditingContact(null);
      setIsAddingContact(false);
      loadContacts();
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to update emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!confirm(`Are you sure you want to remove ${contactName} from your emergency contacts?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);
        
      if (error) throw error;
      
      toast({
        title: "Contact Removed",
        description: `${contactName} has been removed from your emergency contacts.`,
      });
      
      loadContacts();
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      toast({
        title: "Error",
        description: "Failed to remove emergency contact.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmContact = async () => {
    if (!contactToConfirm || !confirmationCode) return;
    
    setLoading(true);
    try {
      // Verify the confirmation code
      if (contactToConfirm.confirm_code !== confirmationCode) {
        toast({
          title: "Invalid Code",
          description: "The confirmation code is incorrect. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Update the contact as confirmed
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_confirmed: true })
        .eq('id', contactToConfirm.id);
        
      if (error) throw error;
      
      toast({
        title: "Contact Confirmed",
        description: `${contactToConfirm.contact_name} has been confirmed as your emergency contact.`,
      });
      
      setIsConfirmingContact(false);
      setContactToConfirm(null);
      setConfirmationCode('');
      loadContacts();
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

  const copyCode = async (code: string) => {
    const { useNativeClipboard } = await import('@/hooks/mobile/useNativeClipboard');
    const { copyToClipboard } = useNativeClipboard();
    await copyToClipboard(code, "Confirmation code copied to clipboard");
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      contact_name: contact.contact_name,
      phone_number: contact.phone_number,
      relationship: contact.relationship || '',
      is_primary_contact: contact.is_primary_contact,
      can_receive_location: contact.can_receive_location,
      can_alert_public: contact.can_alert_public,
      preferred_methods: contact.preferred_methods
    });
    setIsAddingContact(true);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Main Emergency Contacts Card */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            
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
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={confirmationCode}
                          onChange={(e) => setConfirmationCode(e.target.value)}
                          maxLength={6}
                        />
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
                          disabled={loading || confirmationCode.length !== 6} 
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
            
            {/* Add Contact Dialog */}
            <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingContact(null);
                  setFormData({
                    contact_name: '',
                    phone_number: '',
                    relationship: '',
                    is_primary_contact: false,
                    can_receive_location: true,
                    can_alert_public: false,
                    preferred_methods: ['in_app']
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">
                    {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-3">
                  <Alert className="mb-4">
                    <Search className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Search for existing users on the app by typing their name, phone, or email. This helps connect with verified users in the SafeNeighbor network.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-sm font-medium">Contact Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Full name"
                        value={formData.contact_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone-number" className="text-sm font-medium">Phone Number *</Label>
                      <div className="relative w-full">
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="Search by phone, email or name"
                          value={formData.phone_number}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full pr-10"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-background rounded-md border shadow-lg max-w-full">
                          <div className="p-2 text-xs text-muted-foreground flex items-center">
                            <Search className="h-3 w-3 mr-1" />
                            Users found in app
                          </div>
                          <div className="max-h-60 overflow-auto">
                            {searchResults.map((profile) => (
                              <button
                                key={profile.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                                onClick={() => selectUserFromSearch(profile)}
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  {profile.avatar_url ? (
                                    <img 
                                      src={profile.avatar_url} 
                                      alt={profile.full_name} 
                                      className="h-8 w-8 rounded-full object-cover" 
                                    />
                                  ) : (
                                    profile.full_name?.charAt(0) || '?'
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{profile.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {profile.phone || profile.email}
                                    {profile.neighborhood && ` • ${profile.neighborhood}`}
                                  </p>
                                </div>
                                <UserCheck className="h-4 w-4 text-green-500 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="neighbor">Neighbor</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Notification Methods</Label>
                    <div className="space-y-2">
                      {contactMethods.map((method) => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={method.value}
                            checked={formData.preferred_methods.includes(method.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  preferred_methods: [...prev.preferred_methods, method.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  preferred_methods: prev.preferred_methods.filter(m => m !== method.value)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer">
                            {method.icon}
                            {method.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is-primary"
                          checked={formData.is_primary_contact}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, is_primary_contact: checked as boolean }))
                          }
                        />
                        <Label htmlFor="is-primary" className="cursor-pointer">
                          Primary Emergency Contact
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can-receive-location"
                          checked={formData.can_receive_location}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, can_receive_location: checked as boolean }))
                          }
                        />
                        <Label htmlFor="can-receive-location" className="cursor-pointer">
                          Can receive my location during emergencies
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can-alert-public"
                          checked={formData.can_alert_public}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, can_alert_public: checked as boolean }))
                          }
                        />
                        <Label htmlFor="can-alert-public" className="cursor-pointer">
                          Can share public emergency alerts in my area
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingContact(false)} 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={editingContact ? handleEditContact : handleAddContact} 
                      disabled={loading || !formData.contact_name || !formData.phone_number} 
                      className="flex-1"
                    >
                      {loading ? 'Saving...' : editingContact ? 'Update Contact' : 'Add Contact'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* View Code Dialog */}
            <Dialog open={isViewingCode} onOpenChange={setIsViewingCode}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Confirmation Code
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-3">
                  {selectedContact && (
                    <>
                      <p className="text-sm">
                        Share this code with <strong>{selectedContact.contact_name}</strong> so they can confirm 
                        the emergency contact relationship:
                      </p>
                      
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <div className="text-2xl font-mono font-bold tracking-widest mb-2">
                          {contactCode}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyCode(contactCode)}
                          className="mt-2"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          This code is unique to this contact. Keep it secure and only share it with the intended person.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Emergency Contacts</h3>
              <p className="text-muted-foreground mb-4">
                Add trusted contacts who will be notified during emergencies
              </p>
              <Button onClick={() => setIsAddingContact(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm sm:text-base truncate">{contact.contact_name}</h3>
                        <div className="flex flex-wrap gap-1">
                          {contact.is_primary_contact && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                          {contact.is_confirmed ? (
                            <Badge className="bg-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Pending Confirmation
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{contact.phone_number}</span>
                        </p>
                        {contact.relationship && (
                          <p className="truncate">{contact.relationship}</p>
                        )}
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.preferred_methods.map((method) => {
                            const methodInfo = contactMethods.find(m => m.value === method);
                            return methodInfo ? (
                              <Badge key={method} variant="secondary" className="text-xs">
                                {React.cloneElement(methodInfo.icon, { className: "h-3 w-3 mr-1" })}
                                <span className="hidden sm:inline">{methodInfo.label}</span>
                                <span className="sm:hidden">{methodInfo.label.split(' ')[0]}</span>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                      {!contact.is_confirmed && contact.confirm_code && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(contact);
                            setContactCode(contact.confirm_code || '');
                            setIsViewingCode(true);
                          }}
                          title="View confirmation code"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {!contact.is_confirmed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setContactToConfirm(contact);
                            setIsConfirmingContact(true);
                          }}
                          title="Confirm this contact"
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(contact)}
                        title="Edit contact"
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id, contact.contact_name)}
                        title="Remove contact"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {contact.can_receive_location && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Shield className="h-3 w-3" />
                        <span className="hidden sm:inline">Can receive location</span>
                        <span className="sm:hidden">Location</span>
                      </div>
                    )}
                    {contact.can_alert_public && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">Can share public alerts</span>
                        <span className="sm:hidden">Alerts</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Security Information */}
      <Card className="w-full max-w-full overflow-hidden mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-hidden">
          <div className="text-sm space-y-2">
            <p><strong>Confirmation Required:</strong> Emergency contacts must confirm their relationship with you using a secure code before they can receive alerts.</p>
            <p><strong>Location Sharing:</strong> Your exact location will only be shared with contacts who have permission during active emergencies.</p>
            <p><strong>Data Protection:</strong> All emergency contact information is encrypted and secured.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyContacts;