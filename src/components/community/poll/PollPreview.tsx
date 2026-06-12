import { BarChart3 } from '@/lib/icons';
import { formatDistanceToNow } from 'date-fns';

interface PollPreviewOption {
  id: string;
  vote_count: number;
}

interface PollPreviewProps {
  question: string;
  closesAt: string;
  options: PollPreviewOption[];
  userVotes: string[];
}

export const PollPreview = ({ question, closesAt, options, userVotes }: PollPreviewProps) => {
  const isClosed = new Date(closesAt) < new Date();
  const hasVoted = userVotes.length > 0;
  const totalVotes = options.reduce((sum, opt) => sum + opt.vote_count, 0);

  const statusText = isClosed
    ? 'Poll ended'
    : hasVoted
      ? 'You voted · Tap to see results'
      : 'Tap to vote';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
      <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{question}</p>
        <p className="text-xs text-muted-foreground">
          {statusText}
          {totalVotes > 0 && ` · ${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`}
          {!isClosed && ` · Ends ${formatDistanceToNow(new Date(closesAt), { addSuffix: true })}`}
        </p>
      </div>
    </div>
  );
};
