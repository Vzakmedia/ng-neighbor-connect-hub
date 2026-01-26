/**
 * React Query-based emergency contacts hook with offline persistence
 * CRITICAL: This data must be available offline for the panic button feature
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  relationship: string | null;
  is_primary: boolean;
  notify_on_panic: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch emergency contacts for the current user
 */
const fetchEmergencyContacts = async (userId: string): Promise<EmergencyContact[]> => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Hook to fetch emergency contacts with MAXIMUM offline persistence
 * These contacts are critical for safety features and must always be available
 */
export function useEmergencyContactsQuery() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['emergency-contacts', userId],
    queryFn: () => fetchEmergencyContacts(userId!),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour - contacts don't change often
    gcTime: Infinity, // NEVER remove from cache - critical data
    networkMode: 'offlineFirst', // Always use cached data first
    placeholderData: (previousData) => previousData,
    retry: 3, // More retries for critical data
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch when online to ensure we have latest
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
}

/**
 * Hook to add a new emergency contact
 */
export function useAddEmergencyContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contact: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newContact) => {
      await queryClient.cancelQueries({ queryKey: ['emergency-contacts', user?.id] });

      const previousContacts = queryClient.getQueryData<EmergencyContact[]>(['emergency-contacts', user?.id]);

      // Optimistically add the contact
      const optimisticContact: EmergencyContact = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        ...newContact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<EmergencyContact[]>(
        ['emergency-contacts', user?.id],
        (old) => old ? [...old, optimisticContact] : [optimisticContact]
      );

      return { previousContacts };
    },
    onError: (error, variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['emergency-contacts', user?.id], context.previousContacts);
      }
      toast.error('Failed to add emergency contact');
      console.error('Add contact error:', error);
    },
    onSuccess: () => {
      toast.success('Emergency contact added');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', user?.id] });
    },
  });
}

/**
 * Hook to update an emergency contact
 */
export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmergencyContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['emergency-contacts', user?.id] });

      const previousContacts = queryClient.getQueryData<EmergencyContact[]>(['emergency-contacts', user?.id]);

      queryClient.setQueryData<EmergencyContact[]>(
        ['emergency-contacts', user?.id],
        (old) => old?.map(contact => 
          contact.id === id 
            ? { ...contact, ...updates, updated_at: new Date().toISOString() }
            : contact
        )
      );

      return { previousContacts };
    },
    onError: (error, variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['emergency-contacts', user?.id], context.previousContacts);
      }
      toast.error('Failed to update contact');
    },
    onSuccess: () => {
      toast.success('Contact updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', user?.id] });
    },
  });
}

/**
 * Hook to delete an emergency contact
 */
export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onMutate: async (contactId) => {
      await queryClient.cancelQueries({ queryKey: ['emergency-contacts', user?.id] });

      const previousContacts = queryClient.getQueryData<EmergencyContact[]>(['emergency-contacts', user?.id]);

      queryClient.setQueryData<EmergencyContact[]>(
        ['emergency-contacts', user?.id],
        (old) => old?.filter(contact => contact.id !== contactId)
      );

      return { previousContacts };
    },
    onError: (error, variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['emergency-contacts', user?.id], context.previousContacts);
      }
      toast.error('Failed to delete contact');
    },
    onSuccess: () => {
      toast.success('Contact deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', user?.id] });
    },
  });
}

/**
 * Hook to get primary emergency contact
 */
export function usePrimaryEmergencyContact() {
  const { data: contacts } = useEmergencyContactsQuery();
  return contacts?.find(c => c.is_primary) || contacts?.[0] || null;
}

/**
 * Hook to get contacts that should be notified on panic
 */
export function usePanicNotificationContacts() {
  const { data: contacts } = useEmergencyContactsQuery();
  return contacts?.filter(c => c.notify_on_panic) || [];
}
