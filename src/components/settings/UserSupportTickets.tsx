import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Flag as Ticket, MessageSquare, Clock, CheckCircle, AlertCircle } from '@/lib/icons';
import { useRealtimeSupportTickets } from '@/hooks/useRealtimeSupportTickets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const UserSupportTickets = () => {
  const { tickets, responses, loading, addResponse } = useRealtimeSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) return;

    setIsSubmitting(true);
    try {
      await addResponse(selectedTicket, newResponse.trim());
      setNewResponse('');
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your tickets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          My Support Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No support tickets yet.</p>
            <p className="text-sm">Create a ticket above if you need help.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-medium">{ticket.subject}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Category: {ticket.category}</span>
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {responses[ticket.id]?.length || 0} responses
                  </span>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket.id)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{ticket.subject}</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Original Request</h4>
                          <p className="text-sm bg-muted p-3 rounded">{ticket.description}</p>
                        </div>

                        {responses[ticket.id] && responses[ticket.id].length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Conversation</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {responses[ticket.id].map((response) => (
                                <div
                                  key={response.id}
                                  className={`p-3 rounded ${
                                    response.is_staff_response
                                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-4'
                                      : 'bg-muted mr-4'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                      {response.is_staff_response ? 'Support Team' : 'You'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(response.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{response.response_text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                          <div className="space-y-2">
                            <Separator />
                            <Label htmlFor="response">Add Response</Label>
                            <Textarea
                              id="response"
                              value={newResponse}
                              onChange={(e) => setNewResponse(e.target.value)}
                              placeholder="Type your response..."
                              rows={3}
                            />
                            <Button
                              onClick={submitResponse}
                              disabled={isSubmitting || !newResponse.trim()}
                              size="sm"
                            >
                              {isSubmitting ? 'Sending...' : 'Send Response'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSupportTickets;