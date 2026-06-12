import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, RefreshCw } from '@/lib/icons';

interface AuditEntry {
    id: string;
    admin_user_id: string;
    action_type: string;
    target_user_id: string | null;
    target_resource_id: string | null;
    target_resource_type: string | null;
    action_details: Record<string, unknown> | null;
    user_agent: string | null;
    created_at: string;
    admin_profile?: { full_name: string | null; email: string | null } | null;
}

const ACTION_BADGE_COLORS: Record<string, string> = {
    admin_role_change:     'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20',
    admin_user_delete:     'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
    admin_user_suspend:    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20',
    admin_user_verify:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
    admin_config_update:   'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20',
    admin_content_remove:  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
    admin_content_approve: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
    admin_login:           'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    admin_logout:          'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    admin_session_start:   'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    admin_2fa_bypass:      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20',
    admin_sensitive_action:'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20',
};

const PAGE_SIZE = 50;

export const AuditLog = () => {
    const { toast } = useToast();
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            // admin_action_logs has no FK to profiles (admin_user_id references
            // auth.users), so PostgREST cannot embed — fetch and merge instead.
            let query = supabase
                .from('admin_action_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (actionFilter !== 'all') {
                query = query.eq('action_type', actionFilter);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            const logs = data || [];
            const adminIds = [...new Set(logs.map((l) => l.admin_user_id).filter(Boolean))];

            let profilesById = new Map<string, { full_name: string | null; email: string | null }>();
            if (adminIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, email')
                    .in('user_id', adminIds);
                profilesById = new Map((profiles || []).map((p) => [p.user_id, { full_name: p.full_name, email: p.email }]));
            }

            const merged = logs.map((l) => ({
                ...l,
                admin_profile: profilesById.get(l.admin_user_id) ?? null,
            }));

            setEntries(merged as unknown as AuditEntry[]);
            setTotal(count ?? 0);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to load audit log', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, toast]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const filteredEntries = entries.filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            e.action_type.includes(q) ||
            (e.admin_profile?.full_name?.toLowerCase().includes(q) ?? false) ||
            (e.admin_profile?.email?.toLowerCase().includes(q) ?? false) ||
            (e.target_resource_type?.toLowerCase().includes(q) ?? false)
        );
    });

    const exportCsv = () => {
        const headers = ['Timestamp', 'Admin', 'Action', 'Resource Type', 'Resource ID', 'Details'];
        const rows = filteredEntries.map(e => [
            new Date(e.created_at).toISOString(),
            e.admin_profile?.email ?? e.admin_user_id,
            e.action_type,
            e.target_resource_type ?? '',
            e.target_resource_id ?? e.target_user_id ?? '',
            JSON.stringify(e.action_details ?? {}),
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Audit Log</h1>
                <p className="text-muted-foreground text-sm mt-1">Complete record of all admin actions on the platform</p>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Action Logs</CardTitle>
                            <CardDescription>Filter and export activity history</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => fetchEntries()}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportCsv}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by admin, action, or resource..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                            <SelectTrigger className="w-full sm:w-56">
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="admin_role_change">Role Change</SelectItem>
                                <SelectItem value="admin_user_suspend">User Suspend</SelectItem>
                                <SelectItem value="admin_user_verify">User Verify</SelectItem>
                                <SelectItem value="admin_user_delete">User Delete</SelectItem>
                                <SelectItem value="admin_content_remove">Content Remove</SelectItem>
                                <SelectItem value="admin_content_approve">Content Approve</SelectItem>
                                <SelectItem value="admin_config_update">Config Update</SelectItem>
                                <SelectItem value="admin_login">Admin Login</SelectItem>
                                <SelectItem value="admin_2fa_bypass">2FA Bypass</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Admin</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEntries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No audit entries found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEntries.map(entry => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {new Date(entry.created_at).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {entry.admin_profile?.full_name ?? entry.admin_user_id.slice(0, 8) + '…'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={ACTION_BADGE_COLORS[entry.action_type] ?? 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'}>
                                                            {entry.action_type.replace('admin_', '')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {entry.target_resource_type && (
                                                            <span className="text-muted-foreground">{entry.target_resource_type}</span>
                                                        )}
                                                        {(entry.target_resource_id || entry.target_user_id) && (
                                                            <span className="ml-1 font-mono text-xs">
                                                                {((entry.target_resource_id || entry.target_user_id) ?? '').slice(0, 8)}…
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                                        {entry.action_details
                                                            ? JSON.stringify(entry.action_details)
                                                            : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <span>
                                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page + 1) * PAGE_SIZE >= total}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLog;
