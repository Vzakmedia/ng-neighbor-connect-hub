import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, XCircle, Clock, Eye, User, MapPin, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PendingService {
  id: string;
  title: string;
  description: string;
  base_price?: number;
  hourly_rate?: number;
  category: string;
  location: string;
  images: string[];
  created_at: string;
  approval_status: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface PendingMarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  created_at: string;
  approval_status: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export default function ContentModerationPanel() {
  const { user } = useAuth();
  const [pendingServices, setPendingServices] = useState<PendingService[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingMarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'service' | 'item'>('service');

  useEffect(() => {
    if (user) {
      fetchPendingContent();
    }
  }, [user]);

  const fetchPendingContent = async () => {
    try {
      // Fetch pending services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch pending marketplace items  
      const { data: items, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch profiles for services
      let servicesWithProfiles = services || [];
      if (services && services.length > 0) {
        const serviceUserIds = services.map(s => s.user_id);
        const { data: serviceProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', serviceUserIds);

        servicesWithProfiles = services.map(service => ({
          ...service,
          profiles: serviceProfiles?.find(p => p.user_id === service.user_id)
        }));
      }

      // Fetch profiles for marketplace items
      let itemsWithProfiles = items || [];
      if (items && items.length > 0) {
        const itemUserIds = items.map(i => i.user_id);
        const { data: itemProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', itemUserIds);

        itemsWithProfiles = items.map(item => ({
          ...item,
          profiles: itemProfiles?.find(p => p.user_id === item.user_id)
        }));
      }

      setPendingServices(servicesWithProfiles);
      setPendingItems(itemsWithProfiles);
    } catch (error) {
      console.error('Error fetching pending content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (itemId: string, type: 'service' | 'item', status: 'approved' | 'rejected') => {
    try {
      if (type === 'service') {
        const { error } = await supabase.rpc('approve_service', {
          _service_id: itemId,
          _approval_status: status,
          _rejection_reason: status === 'rejected' ? rejectionReason : null
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('approve_marketplace_item', {
          _item_id: itemId,
          _approval_status: status,
          _rejection_reason: status === 'rejected' ? rejectionReason : null
        });
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${type === 'service' ? 'Service' : 'Item'} ${status} successfully`,
      });

      // Refresh the content
      await fetchPendingContent();
      
      // Reset form
      setRejectionReason('');
      setSelectedItemId(null);
    } catch (error) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'approved' ? 'approve' : 'reject'} ${type}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary';
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const RejectionDialog = ({ children, onConfirm }: { children: React.ReactNode, onConfirm: () => void }) => (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Content</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this content. This will be sent to the user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectionReason('')}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={!rejectionReason.trim()}
            >
              Reject Content
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending content...</p>
        </div>
      </div>
    );
  }

  const renderServiceCard = (service: PendingService) => (
    <Card key={service.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {service.profiles?.full_name || 'Unknown User'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {service.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(service.created_at).toLocaleDateString()}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(service.approval_status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">
                {service.base_price ? formatPrice(service.base_price) : 
                 service.hourly_rate ? `${formatPrice(service.hourly_rate)}/hour` : 'Price TBD'}
              </span>
              <Badge variant="outline" className="ml-2">{service.category}</Badge>
            </div>
          </div>

          {service.images && service.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {service.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Service image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ))}
              {service.images.length > 3 && (
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  +{service.images.length - 3}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleApproval(service.id, 'service', 'approved')}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <RejectionDialog
              onConfirm={() => handleApproval(service.id, 'service', 'rejected')}
            >
              <Button variant="destructive" className="flex-1" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </RejectionDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderItemCard = (item: PendingMarketplaceItem) => (
    <Card key={item.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {item.profiles?.full_name || 'Unknown User'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {item.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(item.approval_status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">{formatPrice(item.price)}</span>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{item.category}</Badge>
                <Badge variant="secondary">{item.condition}</Badge>
              </div>
            </div>
          </div>

          {item.images && item.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {item.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Item image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ))}
              {item.images.length > 3 && (
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  +{item.images.length - 3}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleApproval(item.id, 'item', 'approved')}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            
            <RejectionDialog
              onConfirm={() => handleApproval(item.id, 'item', 'rejected')}
            >
              <Button variant="destructive" className="flex-1" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </RejectionDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-muted-foreground">Review and approve services and marketplace items</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingServices.length}</div>
            <div className="text-sm text-muted-foreground">Pending Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingItems.length}</div>
            <div className="text-sm text-muted-foreground">Pending Items</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Services ({pendingServices.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Marketplace Items ({pendingItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {pendingServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Services Reviewed</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  There are no pending services to review at the moment. New services will appear here when submitted.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingServices.map(renderServiceCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Items Reviewed</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  There are no pending marketplace items to review at the moment. New items will appear here when submitted.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingItems.map(renderItemCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}