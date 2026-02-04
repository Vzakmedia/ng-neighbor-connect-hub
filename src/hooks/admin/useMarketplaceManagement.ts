import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceItem {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    status: 'active' | 'sold' | 'pending' | 'flagged';
    seller_id: string;
    images?: string[];
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

interface MarketplaceFilters {
    search?: string;
    category?: string;
    status?: string;
}

export const useMarketplaceManagement = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(async (filters?: MarketplaceFilters) => {
        try {
            setLoading(true);

            let query = supabase
                .from('marketplace_items')
                .select(`
          *,
          profiles (
            full_name
          )
        `)
                .order('created_at', { ascending: false });

            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }

            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters?.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            setItems(data || []);
        } catch (error) {
            console.error('Error fetching marketplace items:', error);
            toast({
                title: 'Error',
                description: 'Failed to load marketplace items',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateItemStatus = useCallback(async (itemId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('marketplace_items')
                .update({ status: newStatus })
                .eq('id', itemId);

            if (error) throw error;

            toast({
                title: 'Status Updated',
                description: `Item status changed to ${newStatus}`,
            });

            await fetchItems();
            return true;
        } catch (error) {
            console.error('Error updating item status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update item status',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, fetchItems]);

    const deleteItem = useCallback(async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('marketplace_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            toast({
                title: 'Item Deleted',
                description: 'Marketplace item has been removed',
            });

            await fetchItems();
            return true;
        } catch (error) {
            console.error('Error deleting item:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete item',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, fetchItems]);

    const flagItem = useCallback(async (itemId: string, reason: string) => {
        try {
            const { error } = await supabase
                .from('marketplace_items')
                .update({ status: 'flagged' })
                .eq('id', itemId);

            if (error) throw error;

            // Log the flag
            await supabase.from('flagged_content').insert({
                content_type: 'marketplace_item',
                content_id: itemId,
                reason,
            });

            toast({
                title: 'Item Flagged',
                description: 'Item has been flagged for review',
            });

            await fetchItems();
            return true;
        } catch (error) {
            console.error('Error flagging item:', error);
            toast({
                title: 'Error',
                description: 'Failed to flag item',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, fetchItems]);

    const exportData = useCallback(async () => {
        try {
            const exportData = items.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                category: item.category,
                status: item.status,
                seller: item.profiles?.full_name,
                created_at: item.created_at,
            }));

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `marketplace-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            toast({
                title: 'Data Exported',
                description: 'Marketplace data has been downloaded',
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            toast({
                title: 'Error',
                description: 'Failed to export data',
                variant: 'destructive',
            });
        }
    }, [items, toast]);

    return {
        items,
        loading,
        fetchItems,
        updateItemStatus,
        deleteItem,
        flagItem,
        exportData,
    };
};
