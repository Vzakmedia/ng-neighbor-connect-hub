/**
 * React Query-based profile hook with offline persistence
 * Replaces useState/useEffect pattern for automatic caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandling';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  interests: string[] | null;
  is_verified: boolean | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch user profile from Supabase
 */
const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Hook to fetch the current user's profile with offline persistence
 */
export function useProfileQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change often
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    networkMode: 'offlineFirst', // Use cached data first
    placeholderData: (previousData) => previousData, // Show cached while refetching
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch any user's profile by ID
 */
export function useUserProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes for other users' profiles
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    networkMode: 'offlineFirst',
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to update the current user's profile with optimistic updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', user?.id] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(['profile', user?.id]);

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(['profile', user?.id], {
          ...previousProfile,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProfile };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', user?.id], context.previousProfile);
      }
      handleApiError(error, { route: '/profile' });
    },
    onSuccess: () => {
      toast.success('Profile updated');
    },
    onSettled: () => {
      // Refetch to ensure we have the latest
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

/**
 * Hook to check if profile is complete (for onboarding)
 */
export function useProfileCompletion() {
  const { data: profile, isLoading } = useProfileQuery();

  const isComplete = !!(
    profile?.full_name &&
    profile?.city &&
    profile?.state
  );

  const missingFields: string[] = [];
  if (!profile?.full_name) missingFields.push('full_name');
  if (!profile?.city) missingFields.push('city');
  if (!profile?.state) missingFields.push('state');

  return {
    isComplete,
    isLoading,
    missingFields,
    profile,
  };
}
