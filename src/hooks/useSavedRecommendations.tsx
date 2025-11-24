import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SavedRecommendation } from '@/types/recommendations';

export function useSavedRecommendations(collectionName?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-recommendations', user?.id, collectionName],
    queryFn: async () => {
      if (!user) throw new Error('Must be logged in');

      let query = supabase
        .from('saved_recommendations')
        .select(`
          *,
          recommendation:recommendations(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (collectionName) {
        query = query.eq('collection_name', collectionName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as SavedRecommendation[];
    },
    enabled: !!user,
  });
}

export function useUserCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-collections', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('saved_recommendations')
        .select('collection_name')
        .eq('user_id', user.id);

      if (error) throw error;

      // Get unique collection names with counts
      const collections = data.reduce((acc, item) => {
        const existing = acc.find(c => c.name === item.collection_name);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name: item.collection_name, count: 1 });
        }
        return acc;
      }, [] as { name: string; count: number }[]);

      return collections;
    },
    enabled: !!user,
  });
}
