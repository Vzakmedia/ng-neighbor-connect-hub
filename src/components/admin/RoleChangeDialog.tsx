import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLE_OPTIONS = [
  { value: 'user',        label: 'User',        description: 'Standard platform member' },
  { value: 'staff',       label: 'Staff',        description: 'Read-only monitoring access' },
  { value: 'moderator',   label: 'Moderator',    description: 'Content moderation & user warnings' },
  { value: 'support',     label: 'Support',      description: 'Ticket handling & emergency response' },
  { value: 'manager',     label: 'Manager',      description: 'Business ops & team management' },
];

const SUPER_ADMIN_ONLY_ROLES = [
  { value: 'admin',       label: 'Admin',        description: 'Full platform control (2FA required)' },
  { value: 'super_admin', label: 'Super Admin',  description: 'Unrestricted access (2FA required)' },
];

const ROLE_COLORS: Record<string, string> = {
  user:        'bg-slate-100 text-slate-700',
  staff:       'bg-blue-100 text-blue-700',
  moderator:   'bg-purple-100 text-purple-700',
  support:     'bg-amber-100 text-amber-700',
  manager:     'bg-teal-100 text-teal-700',
  admin:       'bg-orange-100 text-orange-700',
  super_admin: 'bg-red-100 text-red-700',
};

interface RoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentRole: string;
  isSuperAdmin: boolean;
  onConfirm: (newRole: string) => Promise<void>;
}

export const RoleChangeDialog = ({
  isOpen,
  onClose,
  userName,
  currentRole,
  isSuperAdmin,
  onConfirm,
}: RoleChangeDialogProps) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [submitting, setSubmitting] = useState(false);

  const allRoles = isSuperAdmin
    ? [...ROLE_OPTIONS, ...SUPER_ADMIN_ONLY_ROLES]
    : ROLE_OPTIONS;

  const isElevating =
    ['admin', 'super_admin'].includes(selectedRole) &&
    !['admin', 'super_admin'].includes(currentRole);

  const hasChanged = selectedRole !== currentRole;

  const handleConfirm = async () => {
    if (!hasChanged) { onClose(); return; }
    setSubmitting(true);
    try {
      await onConfirm(selectedRole);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) { setSelectedRole(currentRole); onClose(); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the platform role for <span className="font-semibold">{userName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground shrink-0">Current role:</span>
            <Badge className={ROLE_COLORS[currentRole] || 'bg-slate-100 text-slate-700'}>
              {currentRole}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isElevating && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Elevating to <strong>{selectedRole}</strong> grants sensitive platform access.
                The user will be required to set up 2FA before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChanged || submitting}
            variant={isElevating ? 'destructive' : 'default'}
          >
            {submitting ? 'Saving…' : `Confirm — ${allRoles.find(r => r.value === selectedRole)?.label ?? selectedRole}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
