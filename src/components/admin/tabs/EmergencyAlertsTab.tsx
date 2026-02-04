import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEmergencyAlerts } from '@/hooks/admin/useEmergencyAlerts';
import { Search, Filter, MapPin, Clock, AlertTriangle } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';

export const EmergencyAlertsTab = () => {
    const {
        alerts,
        loading,
        fetchAlerts,
        updateAlertStatus,
        getAlertTypeLabel,
        formatLocation,
    } = useEmergencyAlerts();

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAlerts({ type: typeFilter, status: statusFilter, search: searchQuery });
    }, [fetchAlerts, typeFilter, statusFilter, searchQuery]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            active: { variant: 'destructive', className: 'bg-red-600' },
            investigating: { variant: 'default', className: 'bg-yellow-600' },
            resolved: { variant: 'default', className: 'bg-green-600' },
            false_alarm: { variant: 'secondary', className: '' },
        };
        return variants[status] || variants.active;
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
                            <CardTitle>Emergency Alerts</CardTitle>
                            <CardDescription>Monitor and manage emergency situations</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-sm">
                                {alerts.filter(a => a.status === 'active').length} Active
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search alerts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="fire">Fire</SelectItem>
                                <SelectItem value="medical">Medical</SelectItem>
                                <SelectItem value="crime">Crime</SelectItem>
                                <SelectItem value="accident">Accident</SelectItem>
                                <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="false_alarm">False Alarm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Alerts Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No emergency alerts found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    alerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                    <span className="text-sm font-medium">{getAlertTypeLabel(alert)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {alert.profiles?.full_name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-32">{formatLocation(alert)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="text-sm truncate">{alert.description || 'No description'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge {...getStatusBadge(alert.status)}>
                                                    {alert.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {alert.status === 'active' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateAlertStatus(alert.id, 'investigating')}
                                                        >
                                                            Investigate
                                                        </Button>
                                                    )}
                                                    {alert.status === 'investigating' && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing {alerts.length} alerts</span>
                        <div className="flex items-center gap-4">
                            <span>{alerts.filter(a => a.status === 'active').length} Active</span>
                            <span>{alerts.filter(a => a.status === 'investigating').length} Investigating</span>
                            <span>{alerts.filter(a => a.status === 'resolved').length} Resolved</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
