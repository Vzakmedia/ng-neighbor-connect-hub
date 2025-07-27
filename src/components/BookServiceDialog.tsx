import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number | null;
  price_max: number | null;
  user_id: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  current_bookings: number;
}

interface BookServiceDialogProps {
  service: Service;
  onBookingCreated: () => void;
  children: React.ReactNode;
}

const BookServiceDialog = ({ service, onBookingCreated, children }: BookServiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [message, setMessage] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Fetch available dates when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableDates();
    }
  }, [open, service.id]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (bookingDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot('');
    }
  }, [bookingDate, service.id]);

  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('service_availability')
        .select('date')
        .eq('service_id', service.id)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const dates = (data || []).map(item => new Date(item.date));
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!bookingDate) return;

    try {
      const dateStr = bookingDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('service_availability')
        .select('*')
        .eq('service_id', service.id)
        .eq('date', dateStr)
        .eq('is_available', true);

      if (error) throw error;
      
      // Filter slots where current_bookings < max_bookings
      const availableSlots = (data || []).filter(slot => slot.current_bookings < slot.max_bookings);
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingDate || !selectedSlot) return;

    setLoading(true);
    try {
      // Find the selected availability slot
      const slot = availableSlots.find(s => s.id === selectedSlot);
      if (!slot) throw new Error('Invalid time slot selected');

      // Create the booking
      const { error: bookingError } = await supabase
        .from('service_bookings')
        .insert({
          client_id: user.id,
          provider_id: service.user_id,
          service_id: service.id,
          booking_date: `${bookingDate.toISOString().split('T')[0]}T${slot.start_time}:00`,
          message: message || null,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Update the availability slot booking count
      const { error: updateError } = await supabase
        .from('service_availability')
        .update({ 
          current_bookings: slot.current_bookings + 1 
        })
        .eq('id', selectedSlot);

      if (updateError) throw updateError;

      toast({
        title: "Booking request sent",
        description: "Your booking request has been sent to the service provider",
      });

      // Reset form
      setMessage('');
      setBookingDate(undefined);
      setSelectedSlot('');
      setOpen(false);
      onBookingCreated();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="font-semibold">{service.title}</h3>
            <p className="text-sm text-muted-foreground">{service.description}</p>
            {(service.price_min || service.price_max) && (
              <p className="text-sm font-medium mt-2">
                Price: ₦{service.price_min || 0} - ₦{service.price_max || 0}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !bookingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bookingDate ? format(bookingDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={bookingDate}
                  onSelect={setBookingDate}
                  disabled={(date) => {
                    if (date < new Date()) return true;
                    return !availableDates.some(availableDate => 
                      availableDate.toDateString() === date.toDateString()
                    );
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {bookingDate && availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label>Select Time Slot*</Label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.start_time} - {slot.end_time} 
                      ({slot.max_bookings - slot.current_bookings} slots available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {bookingDate && availableSlots.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No available time slots for this date
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any special requests or details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !bookingDate || !selectedSlot} className="flex-1">
              {loading ? 'Booking...' : 'Send Booking Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookServiceDialog;