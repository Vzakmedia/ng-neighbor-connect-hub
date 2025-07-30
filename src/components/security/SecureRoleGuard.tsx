import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureRoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: Array<{
    permission: string;
    accessType: 'read' | 'write' | 'delete';
  }>;
  fallbackComponent?: React.ReactNode;
  onUnauthorized?: () => void;
}

export const SecureRoleGuard: React.FC<SecureRoleGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackComponent,
  onUnauthorized
}) => {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = React.useState<boolean>(false);
  const [checking, setChecking] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setChecking(false);
        onUnauthorized?.();
        return;
      }

      try {
        // Check roles if specified
        if (requiredRoles.length > 0) {
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (roleError) {
            console.error('Error checking user roles:', roleError);
            setHasAccess(false);
            setChecking(false);
            return;
          }

          const userRoleNames = userRoles?.map(r => r.role as string) || [];
          const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));
          
          if (!hasRequiredRole) {
            setHasAccess(false);
            setChecking(false);
            onUnauthorized?.();
            return;
          }
        }

        // Check permissions if specified
        if (requiredPermissions.length > 0) {
          for (const { permission, accessType } of requiredPermissions) {
            const { data, error } = await supabase.rpc('has_staff_permission', {
              _user_id: user.id,
              _permission: permission,
              _access_type: accessType
            });

            if (error || !data) {
              console.error('Permission check failed:', error);
              setHasAccess(false);
              setChecking(false);
              onUnauthorized?.();
              return;
            }
          }
        }

        // Log security event for role/permission checks
        await supabase.rpc('log_security_event', {
          _action_type: 'access_check',
          _resource_type: 'role_guard',
          _risk_level: 'low',
          _details: {
            requiredRoles,
            requiredPermissions,
            granted: true
          }
        });

        setHasAccess(true);
      } catch (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
        onUnauthorized?.();
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, requiredRoles, requiredPermissions, onUnauthorized]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this resource.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};