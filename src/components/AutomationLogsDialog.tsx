import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Calendar, 
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';

interface AutomationLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: any;
}

const AutomationLogsDialog = ({ 
  open, 
  onOpenChange, 
  automation 
}: AutomationLogsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Simulate API call to fetch logs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sampleLogs = [
        {
          id: '1',
          timestamp: new Date('2024-01-15T10:30:00'),
          status: 'success',
          duration: 2340,
          message: 'Automation executed successfully',
          details: 'Processed 15 items, sent 3 notifications'
        },
        {
          id: '2',
          timestamp: new Date('2024-01-15T09:30:00'),
          status: 'success',
          duration: 1890,
          message: 'Automation executed successfully',
          details: 'Processed 12 items, sent 2 notifications'
        },
        {
          id: '3',
          timestamp: new Date('2024-01-15T08:30:00'),
          status: 'failed',
          duration: 5000,
          message: 'Automation failed due to timeout',
          details: 'Error: Connection timeout after 30 seconds',
          error: 'TIMEOUT_ERROR'
        },
        {
          id: '4',
          timestamp: new Date('2024-01-14T10:30:00'),
          status: 'success',
          duration: 2100,
          message: 'Automation executed successfully',
          details: 'Processed 18 items, sent 4 notifications'
        },
        {
          id: '5',
          timestamp: new Date('2024-01-14T09:30:00'),
          status: 'warning',
          duration: 3200,
          message: 'Automation completed with warnings',
          details: 'Processed 10 items, 2 items skipped due to validation errors'
        }
      ];
      
      setLogs(sampleLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch automation logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && automation) {
      fetchLogs();
    }
  }, [open, automation]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportLogs = () => {
    toast({
      title: "Exporting Logs",
      description: "Automation logs are being exported to CSV",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!automation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Automation Logs: {automation.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Executions</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={fetchLogs}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportLogs}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Logs</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search in messages and details..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="filter">Filter by Status</Label>
                    <select 
                      id="filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading logs...</p>
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs found matching your criteria
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(log.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{log.message}</span>
                                <Badge className={getStatusColor(log.status)}>
                                  {log.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {log.details}
                              </p>
                              {log.error && (
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                  Error: {log.error}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{log.timestamp.toLocaleString()}</div>
                            <div>Duration: {log.duration}ms</div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {logs.filter(l => l.status === 'success').length} of {logs.length} executions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(logs.reduce((acc, log) => acc + log.duration, 0) / logs.length)}ms
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Across all executions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {logs.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    In the last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['success', 'failed', 'warning'].map(status => {
                    const count = logs.filter(l => l.status === status).length;
                    const percentage = Math.round((count / logs.length) * 100);
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count} executions</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationLogsDialog;