import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Filter, Eye, MoreHorizontal, Shield, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  user_roles?: Array<{ role: string }>;
}

interface AdminUserManagementProps {
  isSuperAdmin: boolean;
}

const AdminUserManagement = ({ isSuperAdmin }: AdminUserManagementProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          avatar_url,
          is_verified,
          created_at,
          state,
          city,
          neighborhood
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;

      // Get user roles separately
      const userIds = profilesData?.map(p => p.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combine data
      const data = profilesData?.map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.user_id).map(r => ({ role: r.role })) || []
      })) || [];

      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      user.user_roles?.[0]?.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && user.is_verified) ||
      (statusFilter === 'unverified' && !user.is_verified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleVerification = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !user.is_verified })
        .eq('user_id', user.user_id);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === user.user_id 
          ? { ...u, is_verified: !u.is_verified }
          : u
      ));

      toast({
        title: "User Updated",
        description: `User ${user.is_verified ? 'unverified' : 'verified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{users.filter(u => u.is_verified).length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{users.filter(u => u.user_roles?.[0]?.role === 'admin').length}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{filteredUsers.length}</div>
              <div className="text-sm text-muted-foreground">Filtered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[250px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Location</TableHead>
                  <TableHead className="min-w-[120px]">Joined</TableHead>
                  <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{user.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              ID: {user.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm truncate">{user.email || 'No email'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {user.user_roles?.[0]?.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_verified ? 'default' : 'secondary'} className="text-xs">
                          {user.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm truncate">
                        {user.city && user.state ? `${user.city}, ${user.state}` : 'Not set'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVerification(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              {user.is_verified ? 'Unverify' : 'Verify'} User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;