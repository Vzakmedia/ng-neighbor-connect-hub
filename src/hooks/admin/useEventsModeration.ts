import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

export interface ModeratedEvent {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  end_date: string | null;
  is_public: boolean;
  rsvp_enabled: boolean;
  cancelled_at: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null } | null;
  rsvpCounts: { going: number; interested: number };
}

/**
 * Admin/moderator tooling for community events.
 * Writes are guarded with .select('id') so an RLS-blocked mutation surfaces
 * as an error instead of silently affecting 0 rows.
 */
export const useEventsModeration = () => {
  const { toast } = useToast();
  const { logContentModeration } = useAdminAuditLog();
  const [events, setEvents] = useState<ModeratedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (filters?: { search?: string; status?: string }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('events')
        .select('id, title, location, event_date, end_date, is_public, rsvp_enabled, cancelled_at, created_at, user_id, profiles!events_user_id_fkey(full_name)')
        .order('event_date', { ascending: false })
        .limit(100);

      if (filters?.search) {
        const term = filters.search.replace(/[%_,()]/g, '');
        if (term) query = query.or(`title.ilike.%${term}%,location.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as any[];

      // One batched query for RSVP counts across the page
      const ids = rows.map((e) => e.id);
      const counts = new Map<string, { going: number; interested: number }>();
      if (ids.length > 0) {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .in('event_id', ids);
        for (const r of rsvps || []) {
          const c = counts.get(r.event_id) || { going: 0, interested: 0 };
          if (r.status === 'going') c.going += 1;
          else if (r.status === 'interested') c.interested += 1;
          counts.set(r.event_id, c);
        }
      }

      let merged: ModeratedEvent[] = rows.map((e) => ({
        ...e,
        rsvpCounts: counts.get(e.id) || { going: 0, interested: 0 },
      }));

      if (filters?.status === 'cancelled') merged = merged.filter((e) => e.cancelled_at);
      else if (filters?.status === 'upcoming') merged = merged.filter((e) => !e.cancelled_at && new Date(e.event_date) >= new Date());
      else if (filters?.status === 'past') merged = merged.filter((e) => !e.cancelled_at && new Date(e.event_date) < new Date());

      setEvents(merged);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: 'Error', description: 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelEvent = useCallback(async (eventId: string, reason?: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ cancelled_at: new Date().toISOString(), rsvp_enabled: false, is_public: false } as any)
        .eq('id', eventId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', eventId, 'event', reason);
      toast({ title: 'Event Cancelled', description: 'The event has been cancelled and hidden from the public feed' });
      await fetchEvents();
      return true;
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({ title: 'Error', description: 'Failed to cancel event', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchEvents, logContentModeration]);

  const deleteEvent = useCallback(async (eventId: string, reason?: string) => {
    try {
      // event_rsvps has no FK cascade from events — remove them explicitly first
      await supabase.from('event_rsvps').delete().eq('event_id', eventId);

      const { data, error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows affected — check permissions');

      logContentModeration('admin_content_remove', eventId, 'event', reason);
      toast({ title: 'Event Deleted', description: 'The event and its RSVPs have been removed' });
      await fetchEvents();
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
      return false;
    }
  }, [toast, fetchEvents, logContentModeration]);

  return { events, loading, fetchEvents, cancelEvent, deleteEvent };
};
