import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/admin/useUserManagement';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { Search, Filter, MoreHorizontal, UserPlus, Download, CheckCircle, XCircle, Ban, Shield } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { getDiceBearUrl } from '@/lib/dicebear';

interface UsersTabProps {
    isSuperAdmin: boolean;
}

const BULK_ROLE_OPTIONS = [
    { value: 'user', label: 'User' },
    { value: 'staff', label: 'Staff' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'support', label: 'Support' },
    { value: 'manager', label: 'Manager' },
];

export const UsersTab = ({ isSuperAdmin }: UsersTabProps) => {
    const {
        users,
        loading,
        selectedUsers,
        setSelectedUsers,
        fetchUsers,
        updateUserRole,
        toggleVerification,
        toggleSuspension,
        exportUserData,
        bulkUpdateRoles,
    } = useUserManagement(isSuperAdmin);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [roleDialogUser, setRoleDialogUser] = useState<typeof users[number] | null>(null);
    const [bulkRole, setBulkRole] = useState('user');

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.user_roles?.[0]?.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const allFilteredIds = filteredUsers.map(u => u.user_id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedUsers.includes(id));
    const someSelected = selectedUsers.length > 0;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelectedUsers(prev => [...new Set([...prev, ...allFilteredIds])]);
        }
    };

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkRoleApply = async () => {
        await bulkUpdateRoles(selectedUsers, bulkRole);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>Manage users, roles, and permissions</CardDescription>
                            </div>
                            <Button variant="outline">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite User
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="support">Support</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bulk action bar */}
                        {someSelected && (
                            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">{selectedUsers.length} selected</span>
                                <Select value={bulkRole} onValueChange={setBulkRole}>
                                    <SelectTrigger className="w-36 h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BULK_ROLE_OPTIONS.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                        {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleBulkRoleApply}>
                                    Apply Role
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedUsers([])}
                                    className="ml-auto"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        {/* Users Table */}
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow
                                                key={user.user_id}
                                                data-selected={selectedUsers.includes(user.user_id)}
                                                className="data-[selected=true]:bg-muted/50"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedUsers.includes(user.user_id)}
                                                        onCheckedChange={() => toggleSelectUser(user.user_id)}
                                                        aria-label={`Select ${user.full_name}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={getDiceBearUrl(user.user_id)} />
                                                            <AvatarFallback>
                                                                {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium leading-none">
                                                                {user.full_name || 'Unknown'}
                                                            </span>
                                                            {user.is_suspended && (
                                                                <span className="text-xs text-destructive mt-0.5">Suspended</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                                <TableCell className="text-sm">
                                                    {user.city && user.state ? `${user.city}, ${user.state}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {user.user_roles?.[0]?.role || 'user'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.is_verified ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Unverified
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setRoleDialogUser(user)}>
                                                                Change Role
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleVerification(user.user_id, user.is_verified)}>
                                                                {user.is_verified ? 'Unverify' : 'Verify'} User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => toggleSuspension(user.user_id, user.is_suspended ?? false)}
                                                                className={user.is_suspended ? '' : 'text-destructive focus:text-destructive'}
                                                            >
                                                                {user.is_suspended ? (
                                                                    <><Shield className="h-4 w-4 mr-2" />Reinstate User</>
                                                                ) : (
                                                                    <><Ban className="h-4 w-4 mr-2" />Suspend User</>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => exportUserData(user)}>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Export Data
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4 text-sm text-muted-foreground">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </CardContent>
                </Card>
            </div>

            {roleDialogUser && (
                <RoleChangeDialog
                    isOpen={true}
                    onClose={() => setRoleDialogUser(null)}
                    userName={roleDialogUser.full_name || 'Unknown'}
                    currentRole={roleDialogUser.user_roles?.[0]?.role || 'user'}
                    isSuperAdmin={isSuperAdmin}
                    onConfirm={async (newRole) => {
                        const currentRole = roleDialogUser.user_roles?.[0]?.role || 'user';
                        await updateUserRole(roleDialogUser.user_id, currentRole, newRole, roleDialogUser.full_name);
                    }}
                />
            )}
        </>
    );
};
