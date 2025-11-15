import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckCircleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

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

interface ProfileCompletionCardProps {
  completionStatus: ProfileCompletionStatus;
  onEditProfile: () => void;
}

export const ProfileCompletionCard = ({ 
  completionStatus, 
  onEditProfile 
}: ProfileCompletionCardProps) => {
  const [expanded, setExpanded] = useState(!completionStatus.isComplete);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const hapticFeedback = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  useEffect(() => {
    if (completionStatus.isComplete && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [completionStatus.isComplete]);

  if (completionStatus.isComplete) {
    return (
      <>
        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 dark:text-green-100">Profile Complete!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your profile is looking great
              </p>
            </div>
            <SparklesIcon className="h-6 w-6 text-green-500 animate-pulse" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Profile Completion</CardTitle>
          <Badge variant={completionStatus.percentage >= 80 ? 'default' : 'secondary'}>
            {completionStatus.getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Circle and Percentage */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionStatus.percentage / 100)}`}
                className={`${completionStatus.getColorClass()} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${completionStatus.getColorClass()}`}>
                {completionStatus.percentage}%
              </span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {completionStatus.missingSections.length} section{completionStatus.missingSections.length !== 1 ? 's' : ''} remaining
            </p>
            <Progress value={completionStatus.percentage} className="h-2" />
          </div>
        </div>

        {/* Missing Sections */}
        <div>
          <button
            onClick={() => {
              setExpanded(!expanded);
              hapticFeedback();
            }}
            className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-primary transition-colors"
          >
            <span>What's missing?</span>
            {expanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>

          {expanded && (
            <div className="space-y-2 mt-3 animate-accordion-down">
              {completionStatus.missingSections.map(section => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{section.weight}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Complete Profile Button */}
        <Button
          onClick={() => {
            hapticFeedback();
            onEditProfile();
          }}
          className="w-full"
          variant={completionStatus.percentage >= 50 ? 'default' : 'destructive'}
        >
          Complete Profile
        </Button>
      </CardContent>
    </Card>
  );
};
