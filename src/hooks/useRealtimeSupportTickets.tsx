import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  response_text: string;
  is_staff_response: boolean;
  created_at: string;
  user_id?: string;
}

export const useRealtimeSupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<{ [key: string]: TicketResponse[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchTickets();

    // Set up realtime subscription for tickets
    const ticketsChannel = supabase
      .channel('user_support_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Support ticket updated:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setTickets(prev => prev.map(ticket => 
              ticket.id === payload.new.id ? payload.new as SupportTicket : ticket
            ));
            
            // Show toast if status changed
            const oldTicket = tickets.find(t => t.id === payload.new.id);
            if (oldTicket && oldTicket.status !== payload.new.status) {
              toast({
                title: "Ticket Status Updated",
                description: `Your support ticket status changed to: ${payload.new.status}`,
              });
            }
          } else if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev]);
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for ticket responses
    const responsesChannel = supabase
      .channel('user_ticket_responses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_responses'
        },
        async (payload) => {
          console.log('New ticket response:', payload);
          
          // Check if this response is for user's ticket
          const { data: ticketData } = await supabase
            .from('support_tickets')
            .select('user_id')
            .eq('id', payload.new.ticket_id)
            .single();

          if (ticketData && ticketData.user_id === user.id) {
            const newResponse = payload.new as TicketResponse;
            
            setResponses(prev => ({
              ...prev,
              [newResponse.ticket_id]: [
                ...(prev[newResponse.ticket_id] || []),
                newResponse
              ]
            }));

            // Show notification for staff responses
            if (newResponse.is_staff_response) {
              toast({
                title: "New Support Response",
                description: "You have received a new response to your support ticket.",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [user, toast, tickets]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch responses for all tickets
      if (ticketsData && ticketsData.length > 0) {
        const ticketIds = ticketsData.map(ticket => ticket.id);
        const { data: responsesData, error: responsesError } = await supabase
          .from('support_ticket_responses')
          .select('*')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true });

        if (responsesError) throw responsesError;

        // Group responses by ticket_id
        const groupedResponses: { [key: string]: TicketResponse[] } = {};
        responsesData?.forEach(response => {
          if (!groupedResponses[response.ticket_id]) {
            groupedResponses[response.ticket_id] = [];
          }
          groupedResponses[response.ticket_id].push({
            id: response.id,
            ticket_id: response.ticket_id,
            response_text: response.response_text,
            is_staff_response: response.is_staff_response,
            created_at: response.created_at,
            user_id: response.user_id
          });
        });

        setResponses(groupedResponses);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: {
    subject: string;
    category: string;
    priority: string;
    description: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          ...ticketData,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Support Ticket Created",
        description: "Your support ticket has been submitted successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const addResponse = async (ticketId: string, responseText: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: ticketId,
          response_text: responseText,
          is_staff_response: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Response Sent",
        description: "Your response has been sent to support."
      });

      return data;
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to send response.",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    tickets,
    responses,
    loading,
    createTicket,
    addResponse,
    refreshTickets: fetchTickets
  };
};