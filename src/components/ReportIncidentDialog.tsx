import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MapPinIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNativePermissions } from '@/hooks/mobile/useNativePermissions';

interface ReportIncidentDialogProps {
  trigger: React.ReactNode;
}

const alertTypes = [
  { value: 'break_in', label: 'Break-in' },
  { value: 'theft', label: 'Theft' },
  { value: 'accident', label: 'Accident' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'road_closure', label: 'Road Closure' },
  { value: 'other', label: 'Other' }
];

const severityLevels = [
  { value: 'low', label: 'Low', description: 'Minor issue, no immediate danger' },
  { value: 'medium', label: 'Medium', description: 'Moderate concern, some caution needed' },
  { value: 'high', label: 'High', description: 'Serious issue, immediate attention required' },
  { value: 'critical', label: 'Critical', description: 'Emergency situation, danger present' }
];

const ReportIncidentDialog = ({ trigger }: ReportIncidentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCurrentPosition } = useNativePermissions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alert_type: '',
    severity: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude
      }));
      
      // Reverse geocode to get Nigerian address
      try {
        const { data, error } = await supabase.functions.invoke('nigeria-reverse-geocode', {
          body: { latitude, longitude }
        });
        
        if (!error && data?.address) {
          setFormData(prev => ({
            ...prev,
            address: data.address
          }));
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
      
      setLocationLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Unable to get your current location. Please enable location access or enter the address manually.",
        variant: "destructive"
      });
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to report an incident.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.alert_type || !formData.severity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Show optimistic success
    toast({
      title: "Submitting incident report...",
      description: "Your report is being processed",
    });

    // Reset form and close immediately
    const submittedData = { ...formData };
    const submittedLocation = currentLocation;
    setFormData({
      title: '',
      description: '',
      alert_type: '',
      severity: '',
      address: '',
      latitude: null,
      longitude: null
    });
    setCurrentLocation(null);
    setOpen(false);

    setLoading(true);
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .insert([{
          title: submittedData.title,
          description: submittedData.description,
          alert_type: submittedData.alert_type as any,
          severity: submittedData.severity as any,
          address: submittedData.address || 'Location not specified',
          latitude: submittedData.latitude,
          longitude: submittedData.longitude,
          user_id: user.id,
          status: 'active' as any,
          is_verified: false
        }]);

      if (error) throw error;

      toast({
        title: "Incident Reported",
        description: "Your safety incident report has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting incident report:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your incident report. Please try again.",
        variant: "destructive"
      });
      // Restore form on error
      setFormData(submittedData);
      setCurrentLocation(submittedLocation);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Report Safety Incident
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Alert Type and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alert_type">Incident Type *</Label>
                <Select
                  value={formData.alert_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, alert_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of what happened, when it occurred, and any other relevant information..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="flex items-center gap-2"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    Use Current Location
                  </Button>
                </div>
                <Input
                  id="address"
                  placeholder="Enter the incident location or address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
                {currentLocation && (
                  <p className="text-sm text-muted-foreground">
                    📍 Location captured: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Important Notice */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Emergency situations:</strong> If this is an active emergency requiring immediate response, 
                please call emergency services directly instead of using this form.
              </AlertDescription>
            </Alert>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIncidentDialog;