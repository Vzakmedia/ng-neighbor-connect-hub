import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Eye, Check, X, Flag, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ContentItem {
  content_id: string;
  content_type: string;
  title: string;
  created_by: string;
  created_at: string;
  report_count: number;
  severity: string;
  status: string;
  last_action: string;
}

export const AdminContentModeration = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      // Mock data for now - replace with actual RPC call once function is available
      const mockData = [
        {
          content_id: '1',
          content_type: 'post',
          title: 'Sample flagged post',
          created_by: 'user123',
          created_at: new Date().toISOString(),
          report_count: 5,
          severity: 'medium',
          status: 'pending',
          last_action: 'flagged'
        },
        {
          content_id: '2',
          content_type: 'comment',
          title: 'Inappropriate comment',
          created_by: 'user456',
          created_at: new Date().toISOString(),
          report_count: 3,
          severity: 'high',
          status: 'pending',
          last_action: 'reported'
        }
      ];
      
      setContent(mockData);
    } catch (error) {
      console.error('Error fetching content moderation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content for moderation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select items to moderate",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // Mock action for now - replace with actual RPC call
      console.log(`Performing bulk ${action} on items:`, selectedItems);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: `${selectedItems.length} items ${action}ed successfully`,
      });

      setSelectedItems([]);
      fetchContent();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform moderation action",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'flagged':
        return <Badge variant="outline">Flagged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'post':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchContent();
  }, [statusFilter]);

  const filteredContent = content.filter(item => 
    statusFilter === 'all' || item.status?.toLowerCase() === statusFilter
  );

  const selectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContent.map(item => item.content_id));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
          <CardDescription>Loading content for review...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Review and moderate flagged content
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {selectedItems.length} items selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button 
                size="sm" 
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading}
                variant="default"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleBulkAction('reject')}
                disabled={actionLoading}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleBulkAction('flag')}
                disabled={actionLoading}
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-1" />
                Flag
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No content found for moderation</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.content_id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems.includes(item.content_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems([...selectedItems, item.content_id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.content_id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getContentIcon(item.content_type)}
                      <span className="capitalize">{item.content_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.title || 'Untitled'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.report_count > 5 ? "destructive" : "secondary"}>
                      {item.report_count} reports
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(item.severity)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Content Review</DialogTitle>
                          <DialogDescription>
                            Review this {item.content_type} for moderation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Title:</label>
                            <p className="text-sm text-muted-foreground">{item.title || 'Untitled'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Reports:</label>
                            <p className="text-sm text-muted-foreground">{item.report_count} user reports</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Last Action:</label>
                            <p className="text-sm text-muted-foreground">{item.last_action || 'None'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleBulkAction('approve')}
                              disabled={actionLoading}
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleBulkAction('reject')}
                              disabled={actionLoading}
                              variant="destructive"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};