import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AdminActionType = 
  | 'admin_role_change'
  | 'admin_user_delete'
  | 'admin_user_suspend'
  | 'admin_user_verify'
  | 'admin_config_update'
  | 'admin_content_remove'
  | 'admin_content_approve'
  | 'admin_alert_create'
  | 'admin_alert_update'
  | 'admin_login'
  | 'admin_logout'
  | 'admin_2fa_bypass'
  | 'admin_session_start'
  | 'admin_sensitive_action';

interface AuditLogDetails {
  targetUserId?: string;
  targetResourceId?: string;
  targetResourceType?: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  metadata?: Record<string, any>;
}

export const useAdminAuditLog = () => {
  const { user } = useAuth();

  const logAdminAction = useCallback(async (
    actionType: AdminActionType,
    details: AuditLogDetails
  ) => {
    if (!user) {
      console.error('Cannot log admin action: no user');
      return;
    }

    try {
      // Get user agent and other info
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('admin_action_logs')
        .insert({
          admin_user_id: user.id,
          action_type: actionType,
          target_user_id: details.targetUserId || null,
          target_resource_id: details.targetResourceId || null,
          target_resource_type: details.targetResourceType || null,
          action_details: {
            previousValue: details.previousValue,
            newValue: details.newValue,
            reason: details.reason,
            ...details.metadata
          },
          user_agent: userAgent,
          requires_confirmation: ['admin_role_change', 'admin_user_delete', 'admin_config_update'].includes(actionType)
        });

      if (error) {
        console.error('Failed to log admin action:', error);
      }

      // Also log to activity_logs for general audit trail
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action_type: actionType,
          resource_type: details.targetResourceType || 'admin_action',
          resource_id: details.targetResourceId || details.targetUserId || null,
          details: {
            ...details,
            timestamp: new Date().toISOString()
          },
          user_agent: userAgent
        });

    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  }, [user]);

  const logRoleChange = useCallback((
    targetUserId: string,
    previousRole: string,
    newRole: string,
    reason?: string
  ) => {
    return logAdminAction('admin_role_change', {
      targetUserId,
      targetResourceType: 'user_role',
      previousValue: previousRole,
      newValue: newRole,
      reason
    });
  }, [logAdminAction]);

  const logUserAction = useCallback((
    actionType: 'admin_user_delete' | 'admin_user_suspend' | 'admin_user_verify',
    targetUserId: string,
    details?: Record<string, any>
  ) => {
    return logAdminAction(actionType, {
      targetUserId,
      targetResourceType: 'user',
      metadata: details
    });
  }, [logAdminAction]);

  const logConfigChange = useCallback((
    configKey: string,
    previousValue: any,
    newValue: any
  ) => {
    return logAdminAction('admin_config_update', {
      targetResourceId: configKey,
      targetResourceType: 'app_configuration',
      previousValue,
      newValue
    });
  }, [logAdminAction]);

  const logContentModeration = useCallback((
    actionType: 'admin_content_remove' | 'admin_content_approve',
    contentId: string,
    contentType: string,
    reason?: string
  ) => {
    return logAdminAction(actionType, {
      targetResourceId: contentId,
      targetResourceType: contentType,
      reason
    });
  }, [logAdminAction]);

  const logAdminSession = useCallback((
    actionType: 'admin_login' | 'admin_logout' | 'admin_session_start'
  ) => {
    return logAdminAction(actionType, {
      metadata: {
        sessionTime: new Date().toISOString()
      }
    });
  }, [logAdminAction]);

  return {
    logAdminAction,
    logRoleChange,
    logUserAction,
    logConfigChange,
    logContentModeration,
    logAdminSession
  };
};
