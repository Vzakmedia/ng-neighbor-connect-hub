import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';

interface User {
    user_id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    city?: string;
    state?: string;
    is_verified: boolean;
    user_roles?: Array<{ role: string }>;
    created_at: string;
}

interface UserFilters {
    search?: string;
    role?: string;
    state?: string;
    city?: string;
    viewMode?: 'list' | 'grouped' | 'deleted' | 'incomplete';
}

export const useUserManagement = (isSuperAdmin: boolean) => {
    const { toast } = useToast();
    const { logRoleChange, logUserAction } = useAdminAuditLog();

    const [users, setUsers] = useState<User[]>([]);
    const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
    const [usersWithoutAddress, setUsersWithoutAddress] = useState<User[]>([]);
    const [groupedUsers, setGroupedUsers] = useState<Record<string, User[]>>({});
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('profiles')
                .select(`
          user_id,
          full_name,
          email,
          phone_number,
          city,
          state,
          is_verified,
          created_at,
          user_roles (role)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const activeUsers = data?.filter(u => !u.deleted_at) || [];
            setUsers(activeUsers);

            // Group users by state and city
            const grouped = activeUsers.reduce((acc, user) => {
                const key = `${user.state || 'Unknown'}_${user.city || 'Unknown'}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(user);
                return acc;
            }, {} as Record<string, User[]>);
            setGroupedUsers(grouped);

            // Users without complete address
            const incomplete = activeUsers.filter(u => !u.city || !u.state);
            setUsersWithoutAddress(incomplete);

        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchDeletedUsers = useCallback(async () => {
        try {
            const { data: deleted } = await supabase.functions.invoke('get-deleted-users');
            setDeletedUsers(deleted?.users || []);
        } catch (error) {
            console.error('Error fetching deleted users:', error);
        }
    }, []);

    const updateUserRole = useCallback(async (userId: string, currentRole: string, newRole: string, userName: string) => {
        // Privilege escalation prevention
        const baseRoles = ['user', 'moderator', 'manager', 'support', 'staff'];
        const validRoles = isSuperAdmin
            ? [...baseRoles, 'admin', 'super_admin']
            : baseRoles;

        // Prevent regular admins from modifying admin/super_admin users
        if (!isSuperAdmin && (currentRole === 'admin' || currentRole === 'super_admin')) {
            toast({
                title: 'Permission Denied',
                description: 'Only super admins can modify admin roles',
                variant: 'destructive',
            });
            return false;
        }

        if (!validRoles.includes(newRole)) {
            toast({
                title: 'Invalid Role',
                description: `Role must be one of: ${validRoles.join(', ')}`,
                variant: 'destructive',
            });
            return false;
        }

        // Prevent privilege escalation
        if (!isSuperAdmin && (newRole === 'admin' || newRole === 'super_admin')) {
            toast({
                title: 'Permission Denied',
                description: 'Only super admins can assign admin roles',
                variant: 'destructive',
            });
            return false;
        }

        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ role: newRole as any })
                .eq('user_id', userId);

            if (error) throw error;

            await logRoleChange(userId, currentRole, newRole, 'Admin panel role update');

            toast({
                title: 'Role Updated',
                description: `User role updated to ${newRole}`,
            });

            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Error updating user role:', error);
            toast({
                title: 'Error',
                description: 'Failed to update user role',
                variant: 'destructive',
            });
            return false;
        }
    }, [isSuperAdmin, toast, logRoleChange, fetchUsers]);

    const toggleVerification = useCallback(async (userId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;

            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: newStatus })
                .eq('user_id', userId);

            if (error) throw error;

            toast({
                title: 'Verification Updated',
                description: `User ${newStatus ? 'verified' : 'unverified'} successfully`,
            });

            // Update local state
            setUsers(prev => prev.map(u =>
                u.user_id === userId ? { ...u, is_verified: newStatus } : u
            ));

            await fetchUsers();
            return true;
        } catch (error) {
            console.error('Error toggling verification:', error);
            toast({
                title: 'Error',
                description: 'Failed to update verification status',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, fetchUsers]);

    const exportUserData = useCallback(async (user: User) => {
        try {
            const userData = {
                profile: user,
                exported_at: new Date().toISOString(),
            };

            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `user-${user.user_id}-data.json`;
            link.click();
            URL.revokeObjectURL(url);

            toast({
                title: 'Data Exported',
                description: 'User data has been downloaded',
            });
        } catch (error) {
            console.error('Error exporting user data:', error);
            toast({
                title: 'Error',
                description: 'Failed to export user data',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const bulkUpdateRoles = useCallback(async (userIds: string[], newRole: string) => {
        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ role: newRole as any })
                .in('user_id', userIds);

            if (error) throw error;

            toast({
                title: 'Bulk Update Complete',
                description: `Updated ${userIds.length} users to ${newRole}`,
            });

            await fetchUsers();
            setSelectedUsers([]);
            return true;
        } catch (error) {
            console.error('Error bulk updating roles:', error);
            toast({
                title: 'Error',
                description: 'Failed to bulk update roles',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, fetchUsers]);

    return {
        users,
        deletedUsers,
        usersWithoutAddress,
        groupedUsers,
        loading,
        selectedUsers,
        setSelectedUsers,
        fetchUsers,
        fetchDeletedUsers,
        updateUserRole,
        toggleVerification,
        exportUserData,
        bulkUpdateRoles,
    };
};
