import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
}

interface ManageAvailabilityDialogProps {
  service: Service;
  children: React.ReactNode;
}

const ManageAvailabilityDialog = ({ service, children }: ManageAvailabilityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxBookings, setMaxBookings] = useState('1');

  const handleAddAvailability = async () => {
    if (!user || !selectedDate) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('service_availability')
        .insert({
          service_id: service.id,
          user_id: user.id,
          date: selectedDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          max_bookings: parseInt(maxBookings),
          is_available: true
        });

      if (error) throw error;

      toast({
        title: "Availability added",
        description: "Your availability has been successfully added",
      });

      // Reset form
      setSelectedDate(undefined);
      setStartTime('09:00');
      setEndTime('17:00');
      setMaxBookings('1');
    } catch (error) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: "Failed to add availability",
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
          <DialogTitle>Manage Availability - {service.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-bookings">Max Bookings</Label>
            <Input
              id="max-bookings"
              type="number"
              min="1"
              value={maxBookings}
              onChange={(e) => setMaxBookings(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAddAvailability} 
              disabled={loading || !selectedDate} 
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Availability'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAvailabilityDialog;