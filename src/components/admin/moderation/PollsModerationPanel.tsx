import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, BarChart2, Lock, Trash2, RefreshCw } from 'lucide-react';
import { usePollsModeration, type ModeratedPoll } from '@/hooks/admin/usePollsModeration';

export function PollsModerationPanel() {
  const { polls, loading, fetchPolls, closePoll, deletePoll } = usePollsModeration();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<ModeratedPoll | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPolls({ search, status });
  }, [fetchPolls, search, status]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setProcessing(true);
    const ok = await deletePoll(pendingDelete.id, 'Removed by moderator');
    setProcessing(false);
    if (ok) setPendingDelete(null);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart2 className="h-5 w-5" />Polls</CardTitle>
            <CardDescription>Close voting early or remove inappropriate polls</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchPolls({ search, status })}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search question…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All polls</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading polls…</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No polls found</div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Closes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[280px] truncate">{p.question}</TableCell>
                    <TableCell>{p.creatorName || 'Unknown'}</TableCell>
                    <TableCell>{p.voteCount}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(p.closes_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      {p.isClosed
                        ? <Badge className="bg-muted text-muted-foreground border border-border">Closed</Badge>
                        : <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Open</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!p.isClosed && (
                          <Button variant="ghost" size="sm" onClick={() => closePoll(p.id)}>
                            <Lock className="h-4 w-4 mr-1" />Close
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(p)}>
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

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Poll</DialogTitle>
            <DialogDescription>
              "{pendingDelete?.question}" and all {pendingDelete?.voteCount ?? 0} votes will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Back</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={processing}>
              {processing ? 'Working…' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
