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
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import GoogleCalendarSync from './GoogleCalendarSync';

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number | null;
  price_max: number | null;
  user_id: string;
  location?: string | null;
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
  const { syncBookingToCalendar } = useGoogleCalendar();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [message, setMessage] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [enableCalendarSync, setEnableCalendarSync] = useState(false);

  // Fetch weekly availability when dialog opens
  useEffect(() => {
    if (open) {
      fetchWeeklyAvailability();
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

  const fetchWeeklyAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('service_weekly_availability')
        .select('*')
        .eq('service_id', service.id)
        .eq('is_available', true);

      if (error) throw error;

      // Calculate available dates for the next 30 days based on weekly patterns
      const today = new Date();
      const availableDatesSet = new Set();
      
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dayOfWeek = currentDate.getDay();
        
        const hasAvailability = (data || []).some(slot => slot.day_of_week === dayOfWeek);
        if (hasAvailability) {
          availableDatesSet.add(currentDate.toDateString());
        }
      }

      const dates = Array.from(availableDatesSet).map(dateStr => new Date(dateStr as string));
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching weekly availability:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!bookingDate) return;

    try {
      const dayOfWeek = bookingDate.getDay();
      const { data, error } = await supabase
        .from('service_weekly_availability')
        .select('*')
        .eq('service_id', service.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (error) throw error;
      
      // Generate one-hour time slots from availability windows
      const slots: AvailabilitySlot[] = [];
      
      (data || []).forEach(availabilityWindow => {
        const startTime = availabilityWindow.start_time;
        const endTime = availabilityWindow.end_time;
        
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Generate one-hour slots
        let currentHour = startHour;
        const startMinutes = startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        while ((currentHour * 60 + startMinutes) < endTotalMinutes) {
          const slotStart = `${String(currentHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
          const nextHour = currentHour + 1;
          const slotEnd = `${String(nextHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
          
          // Only add slot if it doesn't exceed the availability window
          if ((nextHour * 60 + startMinutes) <= endTotalMinutes) {
            slots.push({
              id: `${availabilityWindow.id}-${bookingDate.toISOString().split('T')[0]}-${slotStart}`,
              date: bookingDate.toISOString().split('T')[0],
              start_time: slotStart,
              end_time: slotEnd,
              max_bookings: availabilityWindow.max_bookings,
              current_bookings: 0,
            });
          }
          
          currentHour++;
        }
      });

      // Check existing bookings for this date and update current_bookings
      if (slots.length > 0) {
        const dateStr = bookingDate.toISOString().split('T')[0];
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('service_bookings')
          .select('booking_date')
          .eq('service_id', service.id)
          .gte('booking_date', `${dateStr}T00:00:00`)
          .lt('booking_date', `${dateStr}T23:59:59`)
          .neq('status', 'cancelled');

        if (!bookingsError && bookingsData) {
          // Count bookings for each time slot
          slots.forEach(slot => {
            const bookingCount = bookingsData.filter(booking => {
              const bookingTime = new Date(booking.booking_date).toTimeString().slice(0, 5);
              return bookingTime === slot.start_time;
            }).length;
            slot.current_bookings = bookingCount;
          });
        }
      }

      // Filter slots where current_bookings < max_bookings and sort by time
      const availableSlots = slots
        .filter(slot => slot.current_bookings < slot.max_bookings)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
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

      // Create the booking - fix timestamp format
      const bookingDateTime = `${bookingDate.toISOString().split('T')[0]}T${slot.start_time}`;
      const { error: bookingError } = await supabase
        .from('service_bookings')
        .insert({
          client_id: user.id,
          provider_id: service.user_id,
          service_id: service.id,
          booking_date: bookingDateTime,
          message: message || null,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Note: We don't need to update booking count in weekly availability table
      // since current_bookings is calculated dynamically from service_bookings table

      // Sync to Google Calendar if enabled
      if (enableCalendarSync) {
        const startDateTime = `${bookingDate.toISOString().split('T')[0]}T${slot.start_time}`;
        const endDateTime = `${bookingDate.toISOString().split('T')[0]}T${slot.end_time}`;
        
        await syncBookingToCalendar({
          title: service.title,
          description: service.description + (message ? `\n\nMessage: ${message}` : ''),
          startDateTime,
          endDateTime,
          location: service.location || undefined,
        });
      }

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

          <GoogleCalendarSync onSyncEnabledChange={setEnableCalendarSync} />

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