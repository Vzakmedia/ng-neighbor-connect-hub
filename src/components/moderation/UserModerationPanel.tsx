import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, User as LogOut, ShieldAlert, Trash2, Search as UserSearch } from '@/lib/icons';

type Role = "super_admin" | "admin" | "moderator" | "manager" | "support" | "staff" | "user" | "banned";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string;
  is_verified?: boolean | null;
  city?: string | null;
  state?: string | null;
  avatar_url?: string | null;
}

interface ModeratedUser extends Profile {
  roles: Role[];
}

const PAGE_SIZE = 50;

export default function UserModerationPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ModeratedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [showActivity, setShowActivity] = useState<boolean>(false);
  const [activityUser, setActivityUser] = useState<ModeratedUser | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false);

  const [deletedUsers, setDeletedUsers] = useState<Array<{ id: string; email: string | null; deleted_at: string; created_at: string }>>([]);
  const [loadingDeleted, setLoadingDeleted] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, created_at, is_verified, city, state, avatar_url")
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);
        if (pErr) throw pErr;

        const userIds = (profiles || []).map((p) => p.user_id);
        let rolesMap: Record<string, Role[]> = {};
        if (userIds.length) {
          const { data: roles, error: rErr } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds);
          if (rErr) throw rErr;
          rolesMap = (roles || []).reduce((acc, r) => {
            if (!acc[r.user_id]) acc[r.user_id] = [];
            acc[r.user_id].push(r.role as Role);
            return acc;
          }, {} as Record<string, Role[]>);
        }

        const merged: ModeratedUser[] = (profiles || []).map((p) => ({ ...p, roles: rolesMap[p.user_id] || ["user"] }));
        setUsers(merged);
      } catch (e: any) {
        console.error("Failed to load users", e);
        toast({ title: "Failed to load users", description: e.message || "Try again later", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const filtered = useMemo(() => {
    let arr = [...users];
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((u) =>
        (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      arr = arr.filter((u) => u.roles.includes(roleFilter as Role));
    }
    return arr;
  }, [users, query, roleFilter]);

  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    filtered.forEach((u) => (next[u.user_id] = checked));
    setSelected(next);
  };

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const handleForceLogout = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("logout-user", {
        body: { userId },
      });
      if (error) throw error;
      toast({ title: "Forced logout", description: "User sessions invalidated" });
    } catch (e: any) {
      toast({ title: "Failed to logout user", description: e.message || "", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast({ title: "User deleted", description: "The user account was deleted" });
    } catch (e: any) {
      toast({ title: "Failed to delete user", description: e.message || "", variant: "destructive" });
    }
  };

  const handleBulkAction = async (type: "logout" | "delete") => {
    if (selectedIds.length === 0) return;
    if (type === "delete" && !confirm(`Delete ${selectedIds.length} selected user(s)?`)) return;

    for (const id of selectedIds) {
      if (type === "logout") await handleForceLogout(id);
      if (type === "delete") await handleDeleteUser(id);
    }
    setSelected({});
  };

  const openActivity = async (u: ModeratedUser) => {
    setActivityUser(u);
    setShowActivity(true);
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("created_at, action_type, resource_type, details")
        .eq("user_id", u.user_id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      setActivityLogs(data || []);
    } catch (e: any) {
      setActivityLogs([]);
      toast({
        title: "Cannot load activity",
        description:
          e.message?.includes("permission")
            ? "Insufficient permissions to view activity logs"
            : e.message || "",
        variant: e.message?.includes("permission") ? "default" : "destructive",
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  const loadDeletedUsers = async () => {
    setLoadingDeleted(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-deleted-users", { body: {} });
      if (error) throw error;
      const users = (data as any)?.users || [];
      setDeletedUsers(users);
    } catch (e: any) {
      toast({ title: "Failed to fetch deleted users", description: e.message || "", variant: "destructive" });
    } finally {
      setLoadingDeleted(false);
    }
  };

  const restoreUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("restore-user", { body: { userId } });
      if (error) throw error;
      toast({ title: "Restore requested", description: "If eligible, the user will be restored" });
      // Optionally refresh deleted list
      loadDeletedUsers();
    } catch (e: any) {
      toast({ title: "Failed to restore user", description: e.message || "", variant: "destructive" });
    }
  };

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList>
        <TabsTrigger value="active">Active Users</TabsTrigger>
        <TabsTrigger value="deleted" onClick={loadDeletedUsers}>Deleted Users</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>User Moderation</CardTitle>
              <CardDescription>Search, review, and take action on user accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("logout")} disabled={!selectedIds.length}>
                <LogOut className="h-4 w-4 mr-2" /> Force logout selected
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")} disabled={!selectedIds.length}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete selected
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2">
                <UserSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="w-full md:w-56">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        onChange={(e) => toggleSelectAll(e.currentTarget.checked)}
                        checked={filtered.length > 0 && filtered.every((u) => selected[u.user_id])}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7}>Loading users...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">No users found</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={!!selected[u.user_id]}
                            onChange={(e) => setSelected((s) => ({ ...s, [u.user_id]: e.currentTarget.checked }))}
                            aria-label={`Select ${u.email || u.full_name || u.user_id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <Badge key={r} variant={r === "banned" ? "destructive" : "secondary"}>{r}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          {u.is_verified ? (
                            <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openActivity(u)}>Activity</Button>
                            <Button variant="outline" size="sm" onClick={() => handleForceLogout(u.user_id)}>
                              <LogOut className="h-4 w-4 mr-1" /> Logout
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.user_id)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="deleted" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Deleted Users</CardTitle>
            <CardDescription>Restore recently deleted user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDeleted ? (
                    <TableRow>
                      <TableCell colSpan={4}>Loading…</TableCell>
                    </TableRow>
                  ) : deletedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">No deleted users</TableCell>
                    </TableRow>
                  ) : (
                    deletedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>{u.deleted_at ? new Date(u.deleted_at).toLocaleString() : "—"}</TableCell>
                        <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => restoreUser(u.id)}>
                            <ShieldAlert className="h-4 w-4 mr-1" /> Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={showActivity} onOpenChange={setShowActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Activity{activityUser ? ` — ${activityUser.email || activityUser.full_name || ""}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto space-y-2">
            {loadingActivity ? (
              <p>Loading activity…</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-muted-foreground">No activity found or insufficient permissions.</p>
            ) : (
              activityLogs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-md border">
                  <div className="text-sm font-medium">{log.action_type} • {log.resource_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                  <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(log.details || {}, null, 2)}</pre>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
