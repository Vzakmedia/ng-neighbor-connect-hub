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
import { errorHandler, withRetry } from '@/utils/errorHandling';
import type { Database } from '@/integrations/supabase/types';

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
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [message, setMessage] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  

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
      today.setHours(0, 0, 0, 0);
      const availableDatesSet = new Set();
      
      for (let i = 1; i <= 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dayOfWeek = currentDate.getDay();
        
        const hasAvailability = (data || []).some((slot: any) => 
          slot && typeof slot === 'object' && slot.day_of_week === dayOfWeek
        );
        if (hasAvailability) {
          availableDatesSet.add(currentDate.toDateString());
        }
      }

      const dates = Array.from(availableDatesSet).map(dateStr => new Date(dateStr as string));
      console.log('Available dates generated:', dates.length, dates);
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
      
      (data || []).forEach((availabilityWindow: any) => {
        if (!availabilityWindow || typeof availabilityWindow !== 'object') return;
        
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
              id: `${availabilityWindow.id || 'slot'}-${bookingDate.toISOString().split('T')[0]}-${slotStart}`,
              date: bookingDate.toISOString().split('T')[0],
              start_time: slotStart,
              end_time: slotEnd,
              max_bookings: availabilityWindow.max_bookings || 1,
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
            const bookingCount = bookingsData.filter((booking: any) => {
              if (!booking || typeof booking !== 'object' || !booking.booking_date) return false;
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
      if (!slot) {
        throw new Error('Invalid time slot selected');
      }

      // Validate booking date is in the future
      const bookingDateTime = `${bookingDate.toISOString().split('T')[0]}T${slot.start_time}`;
      const bookingDate_obj = new Date(bookingDateTime);
      if (bookingDate_obj <= new Date()) {
        toast({
          title: "Invalid Date",
          description: "Booking date must be in the future",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify service still exists and is active
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, is_active, approval_status')
        .eq('id', service.id)
        .single();

      if (serviceError || !serviceData) {
        toast({
          title: "Service Not Available",
          description: "Unable to verify service availability.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!serviceData.is_active || serviceData.approval_status !== 'approved') {
        toast({
          title: "Service Not Available",
          description: "This service is currently unavailable.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create the booking with retry logic for network resilience
      await withRetry(async () => {
        const bookingData: Database['public']['Tables']['service_bookings']['Insert'] = {
          client_id: user.id,  // CRITICAL FIX: Use client_id instead of user_id
          provider_id: service.user_id,
          service_id: service.id,
          booking_date: bookingDateTime,
          message: message || null,
          status: 'pending'
        };

        console.log('Creating booking with data:', {
          client_id: user.id,
          provider_id: service.user_id,
          service_id: service.id,
          booking_date: bookingDateTime,
        });

        const { error: bookingError, data: bookingResult } = await supabase
          .from('service_bookings')
          .insert(bookingData)
          .select();

        if (bookingError) {
          console.error('Booking creation error details:', {
            error: bookingError,
            message: bookingError.message,
            details: bookingError.details,
            hint: bookingError.hint,
            code: bookingError.code,
          });
          throw bookingError;
        }

        console.log('Booking created successfully:', bookingResult);
      }, 2, 1000); // Retry up to 2 times with 1 second base delay

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
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // Use centralized error handler for consistent error reporting
      const errorInfo = errorHandler.classifyError(error, {
        route: '/booking',
        userId: user?.id,
      });

      // Show specific error message based on error type
      let errorMessage = 'Failed to create booking request';
      
      if (error.message?.includes('duplicate')) {
        errorMessage = 'You already have a booking request for this time slot';
      } else if (error.message?.includes('foreign key')) {
        errorMessage = 'Service or provider no longer available';
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Unable to verify booking availability';
      }

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Log detailed error for debugging
      console.error('Booking error context:', {
        service_id: service.id,
        provider_id: service.user_id,
        client_id: user?.id,
        booking_date: bookingDate?.toISOString(),
        slot: selectedSlot,
        errorType: errorInfo.type,
        errorCode: errorInfo.code,
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
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    
                    if (checkDate <= today) return true;
                    
                    return !availableDates.some(availableDate => {
                      const availDate = new Date(availableDate);
                      availDate.setHours(0, 0, 0, 0);
                      return availDate.getTime() === checkDate.getTime();
                    });
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