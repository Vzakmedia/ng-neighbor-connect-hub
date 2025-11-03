import { useState, useCallback } from 'react';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  contactId: string;
  displayName?: string;
  phoneNumbers?: Array<{ number?: string }>;
  emails?: Array<{ address?: string }>;
}

interface ContactMatch {
  userId: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export const useNativeContacts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      console.log('Contacts not available on web platform');
      return false;
    }

    try {
      setIsLoading(true);
      const result = await Contacts.requestPermissions();
      const granted = result.contacts === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        toast({
          title: 'Permission Denied',
          description: 'Please enable contacts access in Settings to find friends.',
          variant: 'destructive',
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request contacts permission',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, toast]);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      const result = await Contacts.checkPermissions();
      const granted = result.contacts === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      return false;
    }
  }, [isNative]);

  const getContacts = useCallback(async (): Promise<Contact[]> => {
    if (!isNative) {
      console.log('Contacts not available on web platform');
      return [];
    }

    try {
      setIsLoading(true);
      const hasAccess = await checkPermission() || await requestPermission();
      
      if (!hasAccess) {
        return [];
      }

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        },
      });

      return result.contacts || [];
    } catch (error) {
      console.error('Error getting contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to access contacts',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkPermission, requestPermission, toast]);

  // Hash phone number for privacy (simple hash for demo)
  const hashPhoneNumber = useCallback((phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Simple hash (in production, use a proper hashing algorithm on backend)
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }, []);

  const findFriends = useCallback(async (): Promise<ContactMatch[]> => {
    if (!isNative) {
      toast({
        title: 'Not Available',
        description: 'Contact sync is only available on mobile apps',
      });
      return [];
    }

    try {
      setIsLoading(true);
      const contacts = await getContacts();
      
      if (contacts.length === 0) {
        toast({
          title: 'No Contacts',
          description: 'No contacts found on your device',
        });
        return [];
      }

      // Extract and hash phone numbers
      const phoneHashes = contacts
        .flatMap(contact => 
          (contact.phoneNumbers || []).map(phone => ({
            hash: hashPhoneNumber(phone.number || ''),
            original: phone.number || '',
            name: contact.displayName || 'Unknown',
          }))
        )
        .filter(item => item.hash);

      // Call backend to match contacts
      const { data, error } = await supabase.functions.invoke('match-contacts', {
        body: { 
          phoneHashes: phoneHashes.map(p => p.hash),
        },
      });

      if (error) throw error;

      const matches: ContactMatch[] = data?.matches || [];
      
      toast({
        title: 'Friends Found',
        description: `Found ${matches.length} friend(s) from your contacts!`,
      });

      return matches;
    } catch (error) {
      console.error('Error finding friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to find friends from contacts',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isNative, getContacts, hashPhoneNumber, toast]);

  const addToContacts = useCallback(async (
    name: string,
    phoneNumber?: string,
    email?: string
  ): Promise<boolean> => {
    if (!isNative) {
      toast({
        title: 'Not Available',
        description: 'Adding contacts is only available on mobile apps',
      });
      return false;
    }

    try {
      setIsLoading(true);
      const hasAccess = await checkPermission() || await requestPermission();
      
      if (!hasAccess) {
        return false;
      }

      // Note: @capacitor-community/contacts doesn't support creating contacts yet
      // This is a placeholder for when it's supported or using native APIs
      toast({
        title: 'Add to Contacts',
        description: `Please manually add ${name} to your contacts`,
      });

      return true;
    } catch (error) {
      console.error('Error adding to contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkPermission, requestPermission, toast]);

  return {
    isLoading,
    isNative,
    hasPermission,
    requestPermission,
    checkPermission,
    getContacts,
    findFriends,
    addToContacts,
  };
};
