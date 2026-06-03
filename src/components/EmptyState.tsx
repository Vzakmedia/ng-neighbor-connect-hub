import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleClick = (action: { onClick?: () => void; href?: string }) => {
    if (action.onClick) action.onClick();
    else if (action.href) navigate(action.href);
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-5 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{description}</p>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <Button onClick={() => handleClick(primaryAction)}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={() => handleClick(secondaryAction)}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
