import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LocationAccuracyIndicatorProps {
  accuracy: number;
  onImprove?: () => void;
  isImproving?: boolean;
}

export const LocationAccuracyIndicator = ({ accuracy, onImprove, isImproving }: LocationAccuracyIndicatorProps) => {
  const getAccuracyLevel = () => {
    if (accuracy <= 10) return { level: 'excellent', colorClass: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle };
    if (accuracy <= 20) return { level: 'good', colorClass: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle };
    if (accuracy <= 50) return { level: 'fair', colorClass: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: MapPin };
    return { level: 'poor', colorClass: 'bg-orange-50 border-orange-200 text-orange-700', icon: AlertTriangle };
  };

  const { level, colorClass, icon: Icon } = getAccuracyLevel();
  
  return (
    <Alert className={colorClass}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div>
            <strong className="block">GPS Accuracy: ±{accuracy.toFixed(0)}m</strong>
            <p className="text-sm mt-1">
              {level === 'excellent' && 'Excellent precision for emergency location'}
              {level === 'good' && 'Good accuracy for most purposes'}
              {level === 'fair' && 'Fair accuracy. Consider improving for critical alerts'}
              {level === 'poor' && 'Low accuracy. Move outdoors for better GPS signal'}
            </p>
          </div>
          {level === 'poor' && onImprove && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onImprove}
              disabled={isImproving}
            >
              {isImproving ? 'Improving...' : 'Improve'}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
