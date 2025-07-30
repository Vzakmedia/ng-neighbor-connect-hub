import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityEvent {
  actionType: string;
  resourceType: string;
  resourceId?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}

export const useSecurityAudit = () => {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    if (!user) return;

    setIsLogging(true);
    try {
      const { error } = await supabase.rpc('log_security_event', {
        _action_type: event.actionType,
        _resource_type: event.resourceType,
        _resource_id: event.resourceId || null,
        _risk_level: event.riskLevel || 'low',
        _details: event.details || {}
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security audit error:', error);
    } finally {
      setIsLogging(false);
    }
  }, [user]);

  const logLoginAttempt = useCallback((success: boolean, method: string) => {
    logSecurityEvent({
      actionType: success ? 'login_success' : 'login_failure',
      resourceType: 'auth',
      riskLevel: success ? 'low' : 'medium',
      details: { method, timestamp: new Date().toISOString() }
    });
  }, [logSecurityEvent]);

  const logRoleChange = useCallback((targetUserId: string, newRole: string, oldRole?: string) => {
    logSecurityEvent({
      actionType: 'role_change',
      resourceType: 'user_role',
      resourceId: targetUserId,
      riskLevel: 'high',
      details: { newRole, oldRole, timestamp: new Date().toISOString() }
    });
  }, [logSecurityEvent]);

  const logSensitiveAction = useCallback((action: string, resourceType: string, resourceId?: string) => {
    logSecurityEvent({
      actionType: action,
      resourceType,
      resourceId,
      riskLevel: 'medium',
      details: { timestamp: new Date().toISOString() }
    });
  }, [logSecurityEvent]);

  const logPanicButton = useCallback((location?: { lat: number; lng: number }) => {
    logSecurityEvent({
      actionType: 'panic_button_pressed',
      resourceType: 'emergency',
      riskLevel: 'critical',
      details: { 
        location,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  }, [logSecurityEvent]);

  return {
    logSecurityEvent,
    logLoginAttempt,
    logRoleChange,
    logSensitiveAction,
    logPanicButton,
    isLogging
  };
};