import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { SafetyAlert, SEVERITY_COLORS } from '@/types/emergency';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AlertStatusManager from '../AlertStatusManager';
import { getUserErrorMessage } from '@/utils/errorHandling';
import { formatDistanceToNow } from 'date-fns';

interface AlertComment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface AlertDetailDialogProps {
  alert: SafetyAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (alertId: string, newStatus: string, note?: string) => void;
  isOwner: boolean;
  canModerate: boolean;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  break_in: 'Break In',
  theft: 'Theft',
  accident: 'Accident',
  suspicious_activity: 'Suspicious Activity',
  harassment: 'Harassment',
  fire: 'Fire',
  flood: 'Flood',
  power_outage: 'Power Outage',
  road_closure: 'Road Closure',
  other: 'Emergency',
};

const isRawCoordinates = (address: string) =>
  /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address?.trim() ?? '');

export const AlertDetailDialog = ({
  alert,
  isOpen,
  onClose,
  onStatusUpdate,
  isOwner,
  canModerate,
}: AlertDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<AlertComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && alert) {
      setComments([]);
      loadComments(alert.id);
    }
  }, [isOpen, alert?.id]);

  const loadComments = async (alertId: string) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('alert_responses')
        .select('id, user_id, comment, created_at, profiles:user_id(full_name, avatar_url)')
        .eq('alert_id', alertId as any)
        .eq('response_type', 'comment' as any)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments((data ?? []) as unknown as AlertComment[]);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!user || !alert || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('alert_responses').insert({
        alert_id: alert.id as any,
        user_id: user.id as any,
        response_type: 'comment' as any,
        comment: newComment.trim(),
      } as any);
      if (error) throw error;
      setNewComment('');
      await loadComments(alert.id);
    } catch (err) {
      toast({
        title: 'Error',
        description: getUserErrorMessage(err, "Couldn't post your comment. Please try again."),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!alert) return null;

  const alertTypeLabel =
    ALERT_TYPE_LABELS[alert.alert_type] ??
    alert.alert_type.replace(/_/g, ' ');

  const mapsUrl = `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;
  const locationDisplay = isRawCoordinates(alert.address)
    ? 'Location available on map'
    : alert.address;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
          <DialogTitle className="text-base font-semibold leading-tight mb-2">
            {alert.title}
          </DialogTitle>
          <div className="flex flex-wrap gap-2">
            <Badge className={SEVERITY_COLORS[alert.severity]}>
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">{alertTypeLabel}</Badge>
            <Badge
              variant={
                alert.status === 'active'
                  ? 'destructive'
                  : alert.status === 'resolved'
                  ? 'default'
                  : 'secondary'
              }
            >
              {alert.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            {/* Reporter + time */}
            {alert.profiles && (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={alert.profiles.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {alert.profiles.full_name?.charAt(0) ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{alert.profiles.full_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-foreground leading-relaxed">{alert.description}</p>

            {/* Location */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
              <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm break-words">{locationDisplay}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  View on map
                </a>
              </div>
            </div>

            {/* Status management (owner / moderator only) */}
            {(isOwner || canModerate) && (
              <>
                <Separator />
                <AlertStatusManager
                  alert={alert}
                  onStatusUpdate={onStatusUpdate}
                  isOwner={isOwner}
                  canModerate={canModerate}
                />
              </>
            )}

            <Separator />

            {/* Comments */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                Comments{comments.length > 0 ? ` (${comments.length})` : ''}
              </h3>

              {loadingComments ? (
                <p className="text-xs text-muted-foreground">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No comments yet. Be the first to respond.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={c.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {c.profiles?.full_name?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">
                          {c.profiles?.full_name ?? 'Community member'}
                        </p>
                        <p className="text-sm text-foreground mt-0.5">{c.comment}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Comment input pinned to bottom */}
        {user && (
          <div className="p-4 border-t flex-shrink-0 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment about this alert…"
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment();
              }}
            />
            <Button
              onClick={submitComment}
              disabled={submitting || !newComment.trim()}
              size="sm"
              className="w-full"
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
