import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Clock, User, Plus, Send, Eye, Reply, Archive } from '@/lib/icons';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_response_at?: string;
  profiles?: { full_name: string; email: string } | null;
  assigned_profile?: { full_name: string } | null;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  response_text: string;
  is_staff_response: boolean;
  is_internal_note: boolean;
  response_type: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface EmailInbox {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  is_replied: boolean;
  received_at: string;
  ticket_id?: string;
}

export const EnhancedSupportTicketSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<Record<string, TicketResponse[]>>({});
  const [emails, setEmails] = useState<EmailInbox[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailInbox | null>(null);
  const [responseText, setResponseText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!user_id(full_name, email),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as any) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    }
  };

  // Fetch ticket responses
  const fetchResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(prev => ({ ...prev, [ticketId]: (data as any) || [] }));
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  // Fetch email inbox
  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('support_email_inbox')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error",
        description: "Failed to load email inbox",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchEmails();
    }
  }, [user]);

  // Send email response
  const sendEmailResponse = async () => {
    if (!selectedTicket || !responseText.trim() || !emailSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-support-email-response', {
        body: {
          ticketId: selectedTicket.id,
          responseText,
          recipientEmail: selectedTicket.profiles?.email,
          subject: emailSubject,
          isInternalNote
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email response sent successfully"
      });

      setResponseText('');
      setEmailSubject('');
      setIsInternalNote(false);
      fetchTickets();
      fetchResponses(selectedTicket.id);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email response",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: status as any,
          assigned_to: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket status updated"
      });

      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  // Mark email as read
  const markEmailAsRead = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('support_email_inbox')
        .update({ is_read: true, processed_at: new Date().toISOString() })
        .eq('id', emailId);

      if (error) throw error;
      fetchEmails();
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'waiting_response': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="flex mb-4">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="emails">Email Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Tickets
              </CardTitle>
              <CardDescription>
                Manage and respond to user support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell>{ticket.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  fetchResponses(ticket.id);
                                  setEmailSubject(`Re: ${ticket.subject}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Ticket Details - {ticket.subject}</DialogTitle>
                                <DialogDescription>
                                  Ticket #{ticket.id.slice(-8)} • {ticket.profiles?.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2">Original Request</h4>
                                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                                </div>

                                {responses[ticket.id] && responses[ticket.id].length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold">Responses</h4>
                                    {responses[ticket.id].map((response) => (
                                      <div
                                        key={response.id}
                                        className={`p-3 rounded-lg ${
                                          response.is_staff_response 
                                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                                            : 'bg-gray-50 border-l-4 border-gray-500'
                                        }`}
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium">
                                            {response.profiles?.full_name || 'User'}
                                            {response.is_staff_response && ' (Staff)'}
                                            {response.is_internal_note && ' (Internal Note)'}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {new Date(response.created_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{response.response_text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="space-y-4 border-t pt-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="email-subject">Email Subject</Label>
                                    <Input
                                      id="email-subject"
                                      value={emailSubject}
                                      onChange={(e) => setEmailSubject(e.target.value)}
                                      placeholder="Enter email subject"
                                    />
                                  </div>
                                  
                                  <div className="grid gap-2">
                                    <Label htmlFor="response">Response</Label>
                                    <Textarea
                                      id="response"
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="Type your response here..."
                                      rows={6}
                                    />
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="internal-note"
                                      checked={isInternalNote}
                                      onChange={(e) => setIsInternalNote(e.target.checked)}
                                    />
                                    <Label htmlFor="internal-note">Internal note (won't be emailed)</Label>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={sendEmailResponse} 
                                      disabled={loading || !responseText.trim()}
                                      className="flex items-center gap-2"
                                    >
                                      <Send className="h-4 w-4" />
                                      {loading ? 'Sending...' : (isInternalNote ? 'Add Note' : 'Send Email')}
                                    </Button>
                                    
                                    <Select 
                                      value={ticket.status} 
                                      onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting_response">Waiting Response</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Inbox
              </CardTitle>
              <CardDescription>
                View and respond to incoming support emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id} className={!email.is_read ? 'font-semibold bg-blue-50' : ''}>
                      <TableCell>{email.from_email}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>
                        {new Date(email.received_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!email.is_read && <Badge variant="destructive">Unread</Badge>}
                          {email.is_replied && <Badge variant="default">Replied</Badge>}
                          {email.ticket_id && <Badge variant="secondary">Linked</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmail(email);
                                if (!email.is_read) {
                                  markEmailAsRead(email.id);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Email: {email.subject}</DialogTitle>
                              <DialogDescription>
                                From: {email.from_email} • {new Date(email.received_at).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="bg-muted p-4 rounded-lg">
                                <div 
                                  className="prose max-w-none"
                                  dangerouslySetInnerHTML={{ 
                                    __html: email.body_html || email.body_text?.replace(/\n/g, '<br>') || '' 
                                  }}
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="default">
                                  <Reply className="h-4 w-4 mr-2" />
                                  Reply
                                </Button>
                                <Button variant="outline">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Ticket
                                </Button>
                                <Button variant="outline">
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emails.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No emails in inbox
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};