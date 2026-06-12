import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Calendar, Users, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { useEventsModeration, type ModeratedEvent } from '@/hooks/admin/useEventsModeration';

type PendingAction = { type: 'cancel' | 'delete'; event: ModeratedEvent } | null;

export function EventsModerationPanel() {
  const { events, loading, fetchEvents, cancelEvent, deleteEvent } = useEventsModeration();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvents({ search, status });
  }, [fetchEvents, search, status]);

  const confirmAction = async () => {
    if (!pending) return;
    setProcessing(true);
    const fn = pending.type === 'cancel' ? cancelEvent : deleteEvent;
    const ok = await fn(pending.event.id, reason || undefined);
    setProcessing(false);
    if (ok) {
      setPending(null);
      setReason('');
    }
  };

  const eventStatus = (e: ModeratedEvent) => {
    if (e.cancelled_at) return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Cancelled</Badge>;
    if (new Date(e.event_date) >= new Date()) return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Upcoming</Badge>;
    return <Badge className="bg-muted text-muted-foreground border border-border">Past</Badge>;
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" />Events</CardTitle>
            <CardDescription>Review, cancel, or remove community events</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchEvents({ search, status })}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title or location…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No events found</div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>RSVPs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium max-w-[240px] truncate">{e.title}</TableCell>
                    <TableCell>{e.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(e.event_date), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{e.location || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {e.rsvpCounts.going} going · {e.rsvpCounts.interested} interested
                      </span>
                    </TableCell>
                    <TableCell>{eventStatus(e)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!e.cancelled_at && (
                          <Button variant="ghost" size="sm" onClick={() => { setPending({ type: 'cancel', event: e }); setReason(''); }}>
                            <XCircle className="h-4 w-4 mr-1" />Cancel
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setPending({ type: 'delete', event: e }); setReason(''); }}>
                          <Trash2 className="h-4 w-4 mr-1" />Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.type === 'cancel' ? 'Cancel Event' : 'Delete Event'}</DialogTitle>
            <DialogDescription>
              {pending?.type === 'cancel'
                ? `"${pending?.event.title}" will be hidden from the public feed and RSVPs disabled.`
                : `"${pending?.event.title}" and all its RSVPs will be permanently removed.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (recorded in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Back</Button>
            <Button variant={pending?.type === 'delete' ? 'destructive' : 'default'} onClick={confirmAction} disabled={processing}>
              {processing ? 'Working…' : pending?.type === 'cancel' ? 'Cancel Event' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
