import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Building as Building2, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  Calendar
} from '@/lib/icons';
import { useNavigate } from 'react-router-dom';
import { useOnboardingNotifications } from '@/hooks/useOnboardingNotifications';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BusinessEncouragementCardProps {
  onDismiss: () => void;
}

export const BusinessEncouragementCard = ({ onDismiss }: BusinessEncouragementCardProps) => {
  const navigate = useNavigate();
  const { dismissBusinessCard } = useOnboardingNotifications();
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setShowDismissDialog(true);
  };

  const handleTemporaryDismiss = async () => {
    setDismissing(true);
    try {
      await dismissBusinessCard(false);
      setShowDismissDialog(false);
      onDismiss();
    } catch (error) {
      console.error('Failed to dismiss card:', error);
      toast({ title: "Error", description: "Failed to save preference", variant: "destructive" });
    } finally {
      setDismissing(false);
    }
  };

  const handlePermanentDismiss = async () => {
    setDismissing(true);
    try {
      await dismissBusinessCard(true);
      setShowDismissDialog(false);
      onDismiss();
    } catch (error) {
      console.error('Failed to dismiss card:', error);
      toast({ title: "Error", description: "Failed to save preference", variant: "destructive" });
    } finally {
      setDismissing(false);
    }
  };

  const handleCreateBusiness = () => {
    navigate('/business');
    onDismiss();
  };

  const benefits = [
    { icon: TrendingUp, text: "Increase visibility", color: "text-green-500" },
    { icon: Users, text: "Connect with customers", color: "text-blue-500" },
    { icon: Star, text: "Build your reputation", color: "text-yellow-500" },
  ];

  return (
    <>
      <Card className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Start Your Business!</CardTitle>
              <Badge variant="secondary" className="mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Limited Time
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join hundreds of successful businesses in your community. Get discovered by local customers and grow your business.
          </p>

          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <benefit.icon className={`h-4 w-4 ${benefit.color}`} />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleCreateBusiness}
              className="flex-1 text-sm"
              size="sm"
            >
              Get Started
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              size="sm"
              className="text-sm"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Business Reminders</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like us to remind you about creating a business in the future, or would you prefer not to see these suggestions again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleTemporaryDismiss} disabled={dismissing}>
              Remind Me Later
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePermanentDismiss}
              disabled={dismissing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {dismissing ? 'Saving...' : "Don't Show Again"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};