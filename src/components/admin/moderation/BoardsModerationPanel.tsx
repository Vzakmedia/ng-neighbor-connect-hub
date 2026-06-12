import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MessagesSquare, Archive, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useBoardsModeration, type ModeratedBoard, type ModeratedBoardPost } from '@/hooks/admin/useBoardsModeration';

type PendingAction = { type: 'archive' | 'delete'; board: ModeratedBoard } | null;

export function BoardsModerationPanel() {
  const { boards, loading, fetchBoards, archiveBoard, deleteBoard, fetchBoardPosts, deleteBoardPost } = useBoardsModeration();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pending, setPending] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Board posts dialog state
  const [postsBoard, setPostsBoard] = useState<ModeratedBoard | null>(null);
  const [posts, setPosts] = useState<ModeratedBoardPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    fetchBoards({ search, status });
  }, [fetchBoards, search, status]);

  const openPosts = async (board: ModeratedBoard) => {
    setPostsBoard(board);
    setPostsLoading(true);
    setPosts(await fetchBoardPosts(board.id));
    setPostsLoading(false);
  };

  const removePost = async (postId: string) => {
    const ok = await deleteBoardPost(postId, `Removed from board "${postsBoard?.name}"`);
    if (ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const confirmAction = async () => {
    if (!pending) return;
    setProcessing(true);
    const fn = pending.type === 'archive' ? archiveBoard : deleteBoard;
    const ok = await fn(pending.board.id, reason || undefined);
    setProcessing(false);
    if (ok) {
      setPending(null);
      setReason('');
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><MessagesSquare className="h-5 w-5" />Discussion Boards</CardTitle>
            <CardDescription>Inspect board activity, archive, or remove boards and posts</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchBoards({ search, status })}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search board name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All boards</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading boards…</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No boards found</div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boards.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{b.name}</TableCell>
                    <TableCell>{b.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>{b.memberCount}</TableCell>
                    <TableCell>{b.postCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {b.is_private && <Badge variant="outline">Private</Badge>}
                        {b.archived_at
                          ? <Badge className="bg-muted text-muted-foreground border border-border">Archived</Badge>
                          : <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openPosts(b)}>
                          <Eye className="h-4 w-4 mr-1" />Posts
                        </Button>
                        {!b.archived_at && (
                          <Button variant="ghost" size="sm" onClick={() => { setPending({ type: 'archive', board: b }); setReason(''); }}>
                            <Archive className="h-4 w-4 mr-1" />Archive
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setPending({ type: 'delete', board: b }); setReason(''); }}>
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

      {/* Archive/Delete confirmation */}
      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.type === 'archive' ? 'Archive Board' : 'Delete Board'}</DialogTitle>
            <DialogDescription>
              {pending?.type === 'archive'
                ? `"${pending?.board.name}" will no longer be discoverable.`
                : `"${pending?.board.name}", its ${pending?.board.memberCount ?? 0} members and ${pending?.board.postCount ?? 0} posts will be permanently removed.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (recorded in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Back</Button>
            <Button variant={pending?.type === 'delete' ? 'destructive' : 'default'} onClick={confirmAction} disabled={processing}>
              {processing ? 'Working…' : pending?.type === 'archive' ? 'Archive Board' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Board posts dialog */}
      <Dialog open={!!postsBoard} onOpenChange={(open) => !open && setPostsBoard(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Posts in "{postsBoard?.name}"</DialogTitle>
            <DialogDescription>Most recent 50 posts — remove any that violate guidelines</DialogDescription>
          </DialogHeader>
          {postsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts…</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No posts in this board</div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{p.profiles?.full_name || 'Unknown'}</span>
                      <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      {p.approval_status && p.approval_status !== 'approved' && (
                        <Badge variant="outline" className="text-[10px]">{p.approval_status}</Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">{p.content}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => removePost(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
