import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/admin/useUserManagement';
import { Search, Filter, MoreHorizontal, UserPlus, Download, CheckCircle, XCircle } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface UsersTabProps {
    isSuperAdmin: boolean;
}

export const UsersTab = ({ isSuperAdmin }: UsersTabProps) => {
    const {
        users,
        loading,
        fetchUsers,
        updateUserRole,
        toggleVerification,
        exportUserData,
    } = useUserManagement(isSuperAdmin);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.user_roles?.[0]?.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleRoleChange = async (user: any) => {
        const currentRole = user.user_roles?.[0]?.role || 'user';
        const baseRoles = ['user', 'moderator', 'manager', 'support', 'staff'];
        const validRoles = isSuperAdmin ? [...baseRoles, 'admin', 'super_admin'] : baseRoles;

        const newRole = prompt(`Enter new role for ${user.full_name} (${validRoles.join(', ')}):`, currentRole);
        if (newRole) {
            await updateUserRole(user.user_id, currentRole, newRole, user.full_name);
        }
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Users Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
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
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{user.full_name || 'Unknown'}</span>
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
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                                                            Change Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleVerification(user.user_id, user.is_verified)}>
                                                            {user.is_verified ? 'Unverify' : 'Verify'} User
                                                        </DropdownMenuItem>
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

                    {/* Summary */}
                    <div className="mt-4 text-sm text-muted-foreground">
                        Showing {filteredUsers.length} of {users.length} users
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
