import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AsyncStateHandlerProps {
  loading: boolean;
  error?: string | null;
  children: ReactNode;
  loadingText?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  emptyState?: ReactNode;
  isEmpty?: boolean;
}

export const AsyncStateHandler = ({
  loading,
  error,
  children,
  loadingText = "Loading...",
  onRetry,
  showRetry = true,
  emptyState,
  isEmpty = false,
}: AsyncStateHandlerProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {showRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
};