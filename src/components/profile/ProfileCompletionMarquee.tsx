import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ProfileSection {
  id: string;
  label: string;
  field: string;
  weight: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ProfileCompletionStatus {
  percentage: number;
  completedSections: ProfileSection[];
  missingSections: ProfileSection[];
  isComplete: boolean;
  getColorClass: () => string;
  getStatusText: () => string;
}

interface ProfileCompletionMarqueeProps {
  completionStatus: ProfileCompletionStatus;
}

const STORAGE_KEY = 'profile_completion_marquee_dismissed';

export const ProfileCompletionMarquee = ({ completionStatus }: ProfileCompletionMarqueeProps) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  useEffect(() => {
    // If completion status changes, show banner again
    if (completionStatus.percentage > 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      setIsDismissed(false);
    }
  }, [completionStatus.percentage]);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleComplete = () => {
    navigate('/complete-profile');
  };

  if (completionStatus.isComplete || isDismissed) {
    return null;
  }

  const isNearComplete = completionStatus.percentage >= 80;

  return (
    <div 
      className={`
        ${isNearComplete 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800'
        }
        border-b
        animate-fade-in
      `}
    >
      <div className="container px-4 py-3 flex items-center gap-3">
        {/* Progress Circle */}
        <div className="relative flex-shrink-0">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className={isNearComplete ? 'text-green-200 dark:text-green-900' : 'text-orange-200 dark:text-orange-900'}
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - completionStatus.percentage / 100)}`}
              className={`${isNearComplete ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} transition-all duration-500`}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isNearComplete ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
            {completionStatus.percentage}%
          </span>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isNearComplete ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
            {completionStatus.getStatusText()}
          </p>
          <p className={`text-xs ${isNearComplete ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'} truncate`}>
            Complete your profile to unlock all features
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleComplete}
          size="sm"
          variant={isNearComplete ? "default" : "secondary"}
          className="flex-shrink-0 h-8 px-3 text-xs"
        >
          Complete Now
        </Button>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1.5 rounded-md hover:bg-background/20 transition-colors ${isNearComplete ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
