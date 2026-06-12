import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Star, Trash2, Eye, RefreshCw, Flag } from 'lucide-react';
import { useRecommendationsModeration, type ModeratedRecommendation, type ModeratedReview } from '@/hooks/admin/useRecommendationsModeration';

export function RecommendationsModerationPanel() {
  const { recommendations, loading, fetchRecommendations, fetchReviews, deleteReview, deleteRecommendation } = useRecommendationsModeration();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ModeratedRecommendation | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Reviews dialog state
  const [reviewsRec, setReviewsRec] = useState<ModeratedRecommendation | null>(null);
  const [reviews, setReviews] = useState<ModeratedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations({ search });
  }, [fetchRecommendations, search]);

  const openReviews = async (rec: ModeratedRecommendation) => {
    setReviewsRec(rec);
    setReviewsLoading(true);
    setReviews(await fetchReviews(rec.id));
    setReviewsLoading(false);
  };

  const removeReview = async (reviewId: string) => {
    const ok = await deleteReview(reviewId, `Removed from "${reviewsRec?.title}"`);
    if (ok) setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setProcessing(true);
    const ok = await deleteRecommendation(pendingDelete.id, reason || undefined);
    setProcessing(false);
    if (ok) {
      setPendingDelete(null);
      setReason('');
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5" />Recommendations</CardTitle>
            <CardDescription>Remove spam recommendations and moderate reviews</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchRecommendations({ search })}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 translate-y-[2px] h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search title or description…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading recommendations…</div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No recommendations found</div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.title}</TableCell>
                    <TableCell>{r.authorName || 'Unknown'}</TableCell>
                    <TableCell>{r.category ? <Badge variant="outline">{r.category}</Badge> : '—'}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {r.average_rating?.toFixed(1) ?? '—'} ({r.total_reviews ?? 0})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openReviews(r)}>
                          <Eye className="h-4 w-4 mr-1" />Reviews
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setPendingDelete(r); setReason(''); }}>
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

      {/* Delete confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recommendation</DialogTitle>
            <DialogDescription>
              "{pendingDelete?.title}" and all its reviews will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (recorded in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Back</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={processing}>
              {processing ? 'Working…' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviews dialog */}
      <Dialog open={!!reviewsRec} onOpenChange={(open) => !open && setReviewsRec(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for "{reviewsRec?.title}"</DialogTitle>
            <DialogDescription>Remove reviews that are spam or abusive</DialogDescription>
          </DialogHeader>
          {reviewsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rv) => (
                <div key={rv.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{rv.reviewerName || 'Unknown'}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-amber-500" />{rv.rating}
                      </span>
                      <span>{formatDistanceToNow(new Date(rv.created_at), { addSuffix: true })}</span>
                      {rv.is_flagged && (
                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px]">
                          <Flag className="h-2.5 w-2.5 mr-0.5" />Flagged
                        </Badge>
                      )}
                    </div>
                    {rv.review_title && <p className="text-sm font-medium">{rv.review_title}</p>}
                    {rv.review_text && <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">{rv.review_text}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => removeReview(rv.id)}>
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
