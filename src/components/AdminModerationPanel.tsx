import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Flag, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star,
  MessageCircle,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTimeAgo } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter_id: string;
  reporter_profile: {
    full_name: string;
    avatar_url: string;
  };
  content_data?: any;
}

interface FlaggedContent {
  id: string;
  type: 'service_review' | 'marketplace_review' | 'service_comment' | 'marketplace_comment';
  content: string;
  author_id: string;
  created_at: string;
  is_flagged: boolean;
  author_profile: {
    full_name: string;
    avatar_url: string;
  };
}

const AdminModerationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [filteredFlaggedContent, setFilteredFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('review_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reporter profiles separately
      const reporterIds = [...new Set((data || []).map(report => report.reporter_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', reporterIds);

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      const reportsWithProfiles = (data || []).map(report => ({
        ...report,
        reporter_profile: profilesMap.get(report.reporter_id) || { full_name: 'Anonymous', avatar_url: '' }
      }));

      setReports(reportsWithProfiles);
      setFilteredReports(reportsWithProfiles);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    }
  };

  const fetchFlaggedContent = async () => {
    try {
      // Fetch flagged reviews and comments from different tables
      const [serviceReviews, marketplaceReviews, serviceComments, marketplaceComments] = await Promise.all([
        supabase
          .from('service_reviews')
          .select('id, review_text, reviewer_id, created_at, is_flagged')
          .eq('is_flagged', true),
        
        supabase
          .from('marketplace_reviews')
          .select('id, review_text, reviewer_id, created_at, is_flagged')
          .eq('is_flagged', true),
        
        supabase
          .from('service_comments')
          .select('id, comment_text, commenter_id, created_at, is_flagged')
          .eq('is_flagged', true),
        
        supabase
          .from('marketplace_comments')
          .select('id, comment_text, commenter_id, created_at, is_flagged')
          .eq('is_flagged', true)
      ]);

      // Get all unique user IDs
      const allUserIds = new Set([
        ...(serviceReviews.data || []).map(item => item.reviewer_id),
        ...(marketplaceReviews.data || []).map(item => item.reviewer_id),
        ...(serviceComments.data || []).map(item => item.commenter_id),
        ...(marketplaceComments.data || []).map(item => item.commenter_id)
      ]);

      // Fetch profiles for all users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', Array.from(allUserIds));

      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      const allFlaggedContent: FlaggedContent[] = [
        ...(serviceReviews.data || []).map(item => ({
          id: item.id,
          type: 'service_review' as const,
          content: item.review_text || '',
          author_id: item.reviewer_id,
          created_at: item.created_at,
          is_flagged: item.is_flagged,
          author_profile: profilesMap.get(item.reviewer_id) || { full_name: 'Anonymous', avatar_url: '' }
        })),
        ...(marketplaceReviews.data || []).map(item => ({
          id: item.id,
          type: 'marketplace_review' as const,
          content: item.review_text || '',
          author_id: item.reviewer_id,
          created_at: item.created_at,
          is_flagged: item.is_flagged,
          author_profile: profilesMap.get(item.reviewer_id) || { full_name: 'Anonymous', avatar_url: '' }
        })),
        ...(serviceComments.data || []).map(item => ({
          id: item.id,
          type: 'service_comment' as const,
          content: item.comment_text,
          author_id: item.commenter_id,
          created_at: item.created_at,
          is_flagged: item.is_flagged,
          author_profile: profilesMap.get(item.commenter_id) || { full_name: 'Anonymous', avatar_url: '' }
        })),
        ...(marketplaceComments.data || []).map(item => ({
          id: item.id,
          type: 'marketplace_comment' as const,
          content: item.comment_text,
          author_id: item.commenter_id,
          created_at: item.created_at,
          is_flagged: item.is_flagged,
          author_profile: profilesMap.get(item.commenter_id) || { full_name: 'Anonymous', avatar_url: '' }
        }))
      ];

      const sortedContent = allFlaggedContent.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setFlaggedContent(sortedContent);
      setFilteredFlaggedContent(sortedContent);
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      toast({
        title: "Error",
        description: "Failed to load flagged content",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchFlaggedContent()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter effects
  useEffect(() => {
    const filtered = reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporter_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesContentType = contentTypeFilter === 'all' || report.content_type === contentTypeFilter;
      
      const matchesDate = dateFilter === 'all' || (() => {
        const reportDate = new Date(report.created_at);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            return reportDate.toDateString() === now.toDateString();
          case 'week':
            return now.getTime() - reportDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return now.getTime() - reportDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesContentType && matchesDate;
    });
    setFilteredReports(filtered);
  }, [reports, searchQuery, statusFilter, contentTypeFilter, dateFilter]);

  useEffect(() => {
    const filtered = flaggedContent.filter(content => {
      const matchesSearch = !searchQuery || 
        content.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.author_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesContentType = contentTypeFilter === 'all' || content.type === contentTypeFilter;
      
      const matchesDate = dateFilter === 'all' || (() => {
        const contentDate = new Date(content.created_at);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            return contentDate.toDateString() === now.toDateString();
          case 'week':
            return now.getTime() - contentDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return now.getTime() - contentDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesContentType && matchesDate;
    });
    setFilteredFlaggedContent(filtered);
  }, [flaggedContent, searchQuery, contentTypeFilter, dateFilter]);

  const handleReportAction = async (reportId: string, action: 'reviewed' | 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('review_reports')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Updated",
        description: `Report marked as ${action}`,
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContent = async (contentId: string, contentType: string) => {
    try {
      let error;
      
      if (contentType === 'service_review') {
        const result = await supabase.from('service_reviews').delete().eq('id', contentId);
        error = result.error;
      } else if (contentType === 'marketplace_review') {
        const result = await supabase.from('marketplace_reviews').delete().eq('id', contentId);
        error = result.error;
      } else if (contentType === 'service_comment') {
        const result = await supabase.from('service_comments').delete().eq('id', contentId);
        error = result.error;
      } else if (contentType === 'marketplace_comment') {
        const result = await supabase.from('marketplace_comments').delete().eq('id', contentId);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Content Deleted",
        description: "The flagged content has been removed",
      });

      fetchFlaggedContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const handleUnflagContent = async (contentId: string, contentType: string) => {
    try {
      let error;
      
      if (contentType === 'service_review') {
        const result = await supabase.from('service_reviews').update({ is_flagged: false }).eq('id', contentId);
        error = result.error;
      } else if (contentType === 'marketplace_review') {
        const result = await supabase.from('marketplace_reviews').update({ is_flagged: false }).eq('id', contentId);
        error = result.error;
      } else if (contentType === 'service_comment') {
        const result = await supabase.from('service_comments').update({ is_flagged: false }).eq('id', contentId);
        error = result.error;
      } else if (contentType === 'marketplace_comment') {
        const result = await supabase.from('marketplace_comments').update({ is_flagged: false }).eq('id', contentId);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Content Unflagged",
        description: "The content has been marked as acceptable",
      });

      fetchFlaggedContent();
    } catch (error) {
      console.error('Error unflagging content:', error);
      toast({
        title: "Error",
        description: "Failed to unflag content",
        variant: "destructive",
      });
    }
  };

  const getContentTypeIcon = (type: string) => {
    if (type.includes('review')) return <Star className="h-4 w-4" />;
    if (type.includes('comment')) return <MessageCircle className="h-4 w-4" />;
    return <Flag className="h-4 w-4" />;
  };

  const getContentTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h2 className="text-2xl font-bold">Content Moderation</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="service_review">Service Review</SelectItem>
              <SelectItem value="marketplace_review">Marketplace Review</SelectItem>
              <SelectItem value="service_comment">Service Comment</SelectItem>
              <SelectItem value="marketplace_comment">Marketplace Comment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">
            Reports ({filteredReports.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged Content ({filteredFlaggedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-6">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No reports to review</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={report.reporter_profile.avatar_url} />
                        <AvatarFallback>
                          {report.reporter_profile.full_name?.charAt(0) || 'R'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getContentTypeIcon(report.content_type)}
                          {getContentTypeLabel(report.content_type)} Report
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Reported by {report.reporter_profile.full_name} • {formatTimeAgo(report.created_at)}
                        </p>
                        <Badge variant={
                          report.status === 'pending' ? 'destructive' :
                          report.status === 'resolved' ? 'default' : 'secondary'
                        }>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{report.reason}</p>
                    </div>
                    {report.description && (
                      <div>
                        <p className="text-sm font-medium">Description:</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    )}
                    
                    {report.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReportAction(report.id, 'reviewed')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Mark Reviewed
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReportAction(report.id, 'resolved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReportAction(report.id, 'dismissed')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4 mt-6">
          {filteredFlaggedContent.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No flagged content to review</p>
              </CardContent>
            </Card>
          ) : (
            filteredFlaggedContent.map((content) => (
              <Card key={`${content.type}-${content.id}`} className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={content.author_profile.avatar_url} />
                        <AvatarFallback>
                          {content.author_profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getContentTypeIcon(content.type)}
                          Flagged {getContentTypeLabel(content.type)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          By {content.author_profile.full_name} • {formatTimeAgo(content.created_at)}
                        </p>
                        <Badge variant="destructive">Flagged</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{content.content}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnflagContent(content.id, content.type)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve Content
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Content
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Content</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete this content? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteContent(content.id, content.type)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminModerationPanel;