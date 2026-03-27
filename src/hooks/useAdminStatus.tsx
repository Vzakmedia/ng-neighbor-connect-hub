import { useAdminStatusContext } from '@/contexts/AdminStatusContext';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'manager' | 'support' | 'staff' | 'user' | null;

interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  isLoading: boolean;
  error: string | null;
  has2FAEnabled: boolean;
  refresh: () => Promise<void>;
}

/**
 * Returns the current user's admin status from the app-level AdminStatusContext.
 * The role is fetched once at startup and shared across all callers — no per-mount
 * fetches, no "Verifying access" spinner on navigation.
 */
export const useAdminStatus = (): AdminStatus => {
  return useAdminStatusContext();
};
