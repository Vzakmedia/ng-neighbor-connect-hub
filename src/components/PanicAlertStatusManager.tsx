import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  Search, 
  AlertTriangle, 
  XCircle, 
  MessageSquare,
  Shield,
  Clock,
  User
} from 'lucide-react';

interface PanicAlert {
  id: string;
  user_id: string;
  situation_type: string;
  message?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface PanicAlertStatusManagerProps {
  panicAlert: PanicAlert;
  onStatusUpdate: (alertId: string, newStatus: string) => void;
  className?: string;
}

const PanicAlertStatusManager: React.FC<PanicAlertStatusManagerProps> = ({ 
  panicAlert, 
  onStatusUpdate,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    panicAlert.is_resolved ? 'resolved' : 'active'
  );
  const [statusNote, setStatusNote] = useState('');

  const statusConfig = {
    active: { 
      label: 'Active Emergency', 
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-800 border-red-200',
      description: 'Emergency is currently active and requires attention'
    },
    investigating: { 
      label: 'Being Investigated', 
      icon: Search, 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      description: 'Emergency contacts are investigating the situation'
    },
    resolved: { 
      label: 'Resolved', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Emergency has been resolved and person is safe'
    },
    false_alarm: { 
      label: 'False Alarm', 
      icon: XCircle, 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Emergency was determined to be a false alarm'
    }
  };

  const currentStatus = panicAlert.is_resolved ? 'resolved' : 'active';
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
  const CurrentIcon = statusInfo.icon;

  const handleStatusUpdate = async () => {
    if (!user || selectedStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-panic-alert-status', {
        body: {
          panic_alert_id: panicAlert.id,
          new_status: selectedStatus,
          update_note: statusNote.trim() || undefined
        }
      });

      if (error) throw error;

      onStatusUpdate(panicAlert.id, selectedStatus);
      
      toast({
        title: "Status Updated",
        description: data.message || `Panic alert status changed to ${statusInfo.label}`,
      });

      setStatusNote('');
    } catch (error: any) {
      console.error('Error updating panic alert status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update panic alert status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Panic Alert Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Information */}
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium">Emergency Type:</span>
            <Badge variant="outline">{panicAlert.situation_type.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Created {getTimeSince(panicAlert.created_at)}</span>
          </div>
          {panicAlert.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>📍 {panicAlert.address}</span>
            </div>
          )}
          {panicAlert.message && (
            <div className="text-sm">
              <span className="font-medium">Message:</span> {panicAlert.message}
            </div>
          )}
        </div>

        {/* Current Status Display */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <CurrentIcon className="h-5 w-5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Current Status:</span>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Resolution Info */}
        {panicAlert.is_resolved && panicAlert.resolved_at && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Resolved {getTimeSince(panicAlert.resolved_at)}</span>
            </div>
          </div>
        )}

        {/* Status Update Controls */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus !== currentStatus && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Status Update Note (Optional)
              </label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button 
            onClick={handleStatusUpdate}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3 w-3" />
            <span className="font-medium">Who can update this status:</span>
          </div>
          <ul className="space-y-1 ml-5">
            <li>• The person who triggered the panic alert</li>
            <li>• Emergency contacts linked to this person</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanicAlertStatusManager;