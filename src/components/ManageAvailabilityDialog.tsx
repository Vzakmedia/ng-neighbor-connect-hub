import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
}

interface ManageAvailabilityDialogProps {
  service: Service;
  children: React.ReactNode;
}

interface WeeklyAvailability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const ManageAvailabilityDialog = ({ service, children }: ManageAvailabilityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([]);
  

  // Fetch existing weekly availability when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchWeeklyAvailability();
    }
  }, [open, user, service.id]);

  const fetchWeeklyAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('service_weekly_availability')
        .select('*')
        .eq('service_id', service.id)
        .eq('user_id', user!.id)
        .order('day_of_week');

      if (error) throw error;

      if (data) {
        setWeeklyAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching weekly availability:', error);
    }
  };

  const handleDayToggle = (dayOfWeek: number, checked: boolean) => {
    if (checked) {
      // Add default availability for this day
      const newAvailability: WeeklyAvailability = {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
        max_bookings: 1,
        is_available: true,
      };
      setWeeklyAvailability(prev => [...prev, newAvailability]);
    } else {
      // Remove availability for this day
      setWeeklyAvailability(prev => prev.filter(item => item.day_of_week !== dayOfWeek));
    }
  };

  const updateAvailability = (dayOfWeek: number, field: keyof WeeklyAvailability, value: any) => {
    setWeeklyAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSaveAvailability = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Delete existing availability for this service
      const { error: deleteError } = await supabase
        .from('service_weekly_availability')
        .delete()
        .eq('service_id', service.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new availability
      if (weeklyAvailability.length > 0) {
        const { error: insertError } = await supabase
          .from('service_weekly_availability')
          .insert(
            weeklyAvailability.map(item => ({
              service_id: service.id,
              user_id: user.id,
              day_of_week: item.day_of_week,
              start_time: item.start_time,
              end_time: item.end_time,
              max_bookings: item.max_bookings,
              is_available: item.is_available,
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: "Availability updated",
        description: "Your weekly availability has been successfully updated",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability",
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
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Weekly Availability</Label>
            <p className="text-sm text-muted-foreground">
              Select the days and times you're available for this service.
            </p>
            
            {DAYS_OF_WEEK.map((day) => {
              const dayAvailability = weeklyAvailability.find(item => item.day_of_week === day.value);
              const isSelected = !!dayAvailability;
              
              return (
                <div key={day.value} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="font-medium">
                      {day.label}
                    </Label>
                  </div>
                  
                  {isSelected && dayAvailability && (
                    <div className="ml-6 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={dayAvailability.start_time}
                          onChange={(e) => updateAvailability(day.value, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={dayAvailability.end_time}
                          onChange={(e) => updateAvailability(day.value, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Bookings</Label>
                        <Input
                          type="number"
                          min="1"
                          value={dayAvailability.max_bookings}
                          onChange={(e) => updateAvailability(day.value, 'max_bookings', parseInt(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSaveAvailability} 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Availability'}
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