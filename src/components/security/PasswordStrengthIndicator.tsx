import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { validatePasswordStrength } from '@/utils/security';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showDetails = true
}) => {
  const { score, feedback } = validatePasswordStrength(password);
  
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  
  const strengthLabel = strengthLabels[score] || 'Very Weak';
  const strengthColor = strengthColors[score] || 'bg-red-500';
  const progressValue = (score / 5) * 100;

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength:</span>
        <span className={`text-sm font-medium ${
          score >= 4 ? 'text-green-600' : 
          score >= 3 ? 'text-blue-600' : 
          score >= 2 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {strengthLabel}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
      />
      
      {showDetails && feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Requirements:</p>
          <ul className="text-xs space-y-1">
            {feedback.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="text-red-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showDetails && feedback.length === 0 && score >= 4 && (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Password meets security requirements</span>
        </div>
      )}
      
      {showDetails && score < 3 && (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-600">
            Consider using a stronger password for better security
          </span>
        </div>
      )}
    </div>
  );
};