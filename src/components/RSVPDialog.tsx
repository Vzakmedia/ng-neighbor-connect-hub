import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface RSVPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  onRSVPSubmitted?: () => void;
}

const RSVPDialog = ({ 
  open, 
  onOpenChange, 
  eventId, 
  eventTitle, 
  onRSVPSubmitted 
}: RSVPDialogProps) => {
  const [status, setStatus] = useState<'going' | 'interested' | 'not_going'>('going');
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Pre-fill form with user profile data when dialog opens
  useEffect(() => {
    if (open && profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone || '');
    }
    if (open && user?.email) {
      setEmailAddress(user.email);
    }
  }, [open, profile, user]);

  const resetForm = () => {
    setMessage('');
    setStatus('going');
    setFullName('');
    setPhoneNumber('');
    setEmailAddress('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim() || !emailAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address",
        variant: "destructive",
      });
      return;
    }

    // Store previous state for potential rollback
    const previousFormState = {
      status,
      message,
      fullName,
      phoneNumber,
      emailAddress
    };

    // Optimistic UI update: Show success immediately
    setIsSubmitting(true);
    toast({
      title: "RSVP Submitted!",
      description: `Your RSVP for "${eventTitle}" has been recorded.`,
    });

    // Close dialog and reset form optimistically
    resetForm();
    onOpenChange(false);
    onRSVPSubmitted?.();

    try {
      // Check if user already has an RSVP for this event
      const { data: existingRSVP, error: fetchError } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const rsvpData = {
        status: previousFormState.status,
        message: previousFormState.message.trim() || null,
        full_name: previousFormState.fullName.trim(),
        phone_number: previousFormState.phoneNumber.trim() || null,
        email_address: previousFormState.emailAddress.trim(),
        updated_at: new Date().toISOString()
      };

      if (existingRSVP) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update(rsvpData)
          .eq('id', existingRSVP.id);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: user.id,
            ...rsvpData
          });

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error submitting RSVP:', error);
      
      // Rollback: Restore form state and reopen dialog
      setStatus(previousFormState.status);
      setMessage(previousFormState.message);
      setFullName(previousFormState.fullName);
      setPhoneNumber(previousFormState.phoneNumber);
      setEmailAddress(previousFormState.emailAddress);
      onOpenChange(true);
      
      toast({
        title: "Error",
        description: "Failed to submit RSVP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RSVP to Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event</Label>
            <p className="text-sm text-muted-foreground">{eventTitle}</p>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm border-t pt-4">Registration Information</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter your email address"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </div>
            </div>
          </div>

          {/* RSVP Status */}
          <div className="space-y-2">
            <Label htmlFor="status">RSVP Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="going">Going</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="not_going">Not Going</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message with your RSVP..."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RSVPDialog;