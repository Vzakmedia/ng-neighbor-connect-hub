import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { Megaphone, AlertTriangle, Send } from '@/lib/icons';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
    id: string;
    title: string;
    body: string;
    priority: Priority;
    target_roles: string[] | null;
    sent_at: string;
    sender_id: string;
    sender_profile?: { full_name: string | null } | null;
}

const PRIORITY_COLORS: Record<Priority, string> = {
    low:    'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

const ROLE_OPTIONS = ['user', 'staff', 'moderator', 'support', 'manager', 'admin', 'super_admin'];

export const Broadcast = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { logAdminAction } = useAdminAuditLog();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState<Priority>('normal');
    const [targetRoles, setTargetRoles] = useState<string[]>([]);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('platform_announcements')
                .select('*, sender_profile:profiles!platform_announcements_sender_id_fkey(full_name)')
                .order('sent_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setAnnouncements((data as unknown as Announcement[]) || []);
        } catch {
            // table may not exist yet — show empty state gracefully
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast({ title: 'Validation', description: 'Title and message are required', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('platform_announcements')
                .insert({
                    title: title.trim(),
                    body: body.trim(),
                    priority,
                    target_roles: targetRoles.length > 0 ? targetRoles : null,
                    sender_id: user!.id,
                });

            if (error) throw error;

            await logAdminAction('admin_sensitive_action', {
                targetResourceType: 'platform_announcement',
                reason: `Broadcast: ${title.trim()}`,
                metadata: { priority, targetRoles },
            });

            toast({ title: 'Announcement Sent', description: 'Platform announcement has been published' });
            setTitle('');
            setBody('');
            setPriority('normal');
            setTargetRoles([]);
            fetchAnnouncements();
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to send announcement', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRole = (role: string) => {
        setTargetRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    return (
        <div className="space-y-6">
            {/* Compose */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        New Announcement
                    </CardTitle>
                    <CardDescription>
                        Send a platform-wide broadcast to all users or a specific role group
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {priority === 'urgent' && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Urgent announcements are displayed prominently to all targeted users immediately.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                placeholder="Announcement title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={120}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                            placeholder="Write your announcement here..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={4}
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            Target Roles <span className="text-muted-foreground font-normal">(leave empty for all users)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                        targetRoles.includes(role)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-foreground border-border hover:bg-muted'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSend} disabled={submitting || !title.trim() || !body.trim()}>
                            <Send className="h-4 w-4 mr-2" />
                            {submitting ? 'Sending…' : 'Send Announcement'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>Announcement History</CardTitle>
                    <CardDescription>Past platform broadcasts</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sent</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Audience</TableHead>
                                        <TableHead>Sent by</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No announcements yet
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        announcements.map(a => (
                                            <TableRow key={a.id}>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {new Date(a.sent_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-medium">{a.title}</TableCell>
                                                <TableCell>
                                                    <Badge className={PRIORITY_COLORS[a.priority]}>
                                                        {a.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {a.target_roles?.join(', ') ?? 'All users'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {a.sender_profile?.full_name ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Broadcast;
