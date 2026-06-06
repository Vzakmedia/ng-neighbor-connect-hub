import { AlertCircle } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We had trouble loading this content. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-5 text-destructive">
      <AlertCircle className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{description}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
