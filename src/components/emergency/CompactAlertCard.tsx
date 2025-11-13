import { useState } from 'react';
import { ShareIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SafetyAlert } from '@/types/emergency';
import { formatDistance, formatTimeAgo, calculateDistance } from '@/utils/distanceCalculator';

interface CompactAlertCardProps {
  alert: SafetyAlert;
  userLocation?: { latitude: number; longitude: number };
  onClick: () => void;
}

const CompactAlertCard = ({ alert, userLocation, onClick }: CompactAlertCardProps) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        alert.latitude,
        alert.longitude
      )
    : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: alert.title,
        text: alert.description,
        url: window.location.href,
      });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle comment submission here
    console.log('Comment:', comment);
    setComment('');
    setShowCommentInput(false);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
          {alert.severity === 'critical' || alert.severity === 'high' ? (
            <ExclamationTriangleIcon className="h-5 w-5" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {getAlertTypeLabel(alert.alert_type)}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleShare}
            >
              <ShareIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {distance !== null && <span>{formatDistance(distance)}</span>}
            {distance !== null && <span>•</span>}
            <span>{formatTimeAgo(alert.created_at)}</span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {alert.description}
          </p>
          
          {!showCommentInput ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentInput(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Write about this alert...
            </button>
          ) : (
            <form onSubmit={handleCommentSubmit} onClick={(e) => e.stopPropagation()}>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write about this alert..."
                className="text-sm"
                autoFocus
                onBlur={() => {
                  if (!comment) setShowCommentInput(false);
                }}
              />
            </form>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CompactAlertCard;
