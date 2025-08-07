import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Phone, Shield, AlertTriangle } from 'lucide-react';
import { PanicAlert } from '@/types/emergency';
import PanicAlertStatusManager from '../PanicAlertStatusManager';

interface PanicAlertManagerProps {
  panicAlert: PanicAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (alertId: string, newStatus: string) => void;
  getTimeSince: (dateString: string) => string;
}

const PanicAlertManager = ({
  panicAlert,
  isOpen,
  onClose,
  onStatusUpdate,
  getTimeSince
}: PanicAlertManagerProps) => {
  if (!panicAlert) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Panic Alert Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Status */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={panicAlert.is_resolved ? 'default' : 'destructive'}
              className="text-sm px-3 py-1"
            >
              {panicAlert.is_resolved ? 'RESOLVED' : 'ACTIVE'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {getTimeSince(panicAlert.created_at)}
            </div>
          </div>

          {/* Situation Type */}
          <div className="space-y-2">
            <h3 className="font-semibold">Emergency Type</h3>
            <Badge variant="outline" className="text-sm">
              {panicAlert.situation_type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Message */}
          {panicAlert.message && (
            <div className="space-y-2">
              <h3 className="font-semibold">Message</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {panicAlert.message}
              </p>
            </div>
          )}

          {/* Location */}
          {panicAlert.address && (
            <div className="space-y-2">
              <h3 className="font-semibold">Location</h3>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{panicAlert.address}</span>
              </div>
            </div>
          )}

          {/* User Info */}
          {panicAlert.profiles && (
            <div className="space-y-2">
              <h3 className="font-semibold">Reported By</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={panicAlert.profiles.avatar_url} />
                  <AvatarFallback>
                    {panicAlert.profiles.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{panicAlert.profiles.full_name}</div>
                  {panicAlert.profiles.city && panicAlert.profiles.state && (
                    <div className="text-sm text-muted-foreground">
                      {panicAlert.profiles.city}, {panicAlert.profiles.state}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resolution Info */}
          {panicAlert.is_resolved && panicAlert.resolved_at && (
            <div className="space-y-2">
              <h3 className="font-semibold">Resolution</h3>
              <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-lg border border-green-200">
                Resolved on {new Date(panicAlert.resolved_at).toLocaleDateString()} at{' '}
                {new Date(panicAlert.resolved_at).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Status Manager */}
          <PanicAlertStatusManager
            panicAlert={panicAlert}
            onStatusUpdate={onStatusUpdate}
          />

          {/* Emergency Instructions */}
          <Alert className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Emergency Response:</strong> If this is an active emergency requiring 
              immediate assistance, contact local emergency services directly.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                if (panicAlert.latitude && panicAlert.longitude) {
                  const url = `https://www.google.com/maps?q=${panicAlert.latitude},${panicAlert.longitude}`;
                  window.open(url, '_blank');
                }
              }}
              variant="outline"
              className="flex-1"
              disabled={!panicAlert.latitude || !panicAlert.longitude}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View on Map
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PanicAlertManager;