/**
 * Offline Post Draft Hook
 * Allows creating posts while offline that auto-submit when back online
 */

import { useState, useEffect, useCallback } from 'react';
import { useNativeStorage } from '@/hooks/mobile/useNativeStorage';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';
import { useOfflineActions } from '@/hooks/useOfflineActions';
import { useToast } from '@/hooks/use-toast';

const DRAFTS_STORAGE_KEY = 'offline_post_drafts';

export interface PostDraft {
  id: string;
  title: string | null;
  content: string;
  post_type: string;
  tags: string[];
  location: string | null;
  image_urls: string[]; // Base64 for offline, URLs after upload
  created_at: number;
  updated_at: number;
  status: 'draft' | 'pending' | 'syncing' | 'failed';
  error?: string;
  retryCount: number;
}

export interface UseOfflinePostDraftReturn {
  drafts: PostDraft[];
  currentDraft: PostDraft | null;
  isLoading: boolean;
  saveDraft: (draft: Partial<PostDraft>) => Promise<string>;
  updateDraft: (id: string, updates: Partial<PostDraft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  submitDraft: (id: string) => Promise<boolean>;
  setCurrentDraft: (id: string | null) => void;
  hasPendingDrafts: boolean;
  syncAllDrafts: () => Promise<void>;
}

export function useOfflinePostDraft(): UseOfflinePostDraftReturn {
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getItem, setItem } = useNativeStorage();
  const { isOnline } = useNativeNetwork();
  const { performAction } = useOfflineActions();
  const { toast } = useToast();

  // Load drafts from storage on mount
  useEffect(() => {
    loadDrafts();
  }, []);

  // Auto-sync drafts when coming online
  useEffect(() => {
    if (isOnline && drafts.some(d => d.status === 'pending')) {
      syncAllDrafts();
    }
  }, [isOnline, drafts]);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      const stored = await getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDrafts(parsed);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistDrafts = async (newDrafts: PostDraft[]) => {
    try {
      await setItem(DRAFTS_STORAGE_KEY, JSON.stringify(newDrafts));
      setDrafts(newDrafts);
    } catch (error) {
      console.error('Failed to persist drafts:', error);
    }
  };

  const saveDraft = useCallback(async (draft: Partial<PostDraft>): Promise<string> => {
    const id = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newDraft: PostDraft = {
      id,
      title: draft.title || null,
      content: draft.content || '',
      post_type: draft.post_type || 'general',
      tags: draft.tags || [],
      location: draft.location || null,
      image_urls: draft.image_urls || [],
      created_at: draft.created_at || now,
      updated_at: now,
      status: 'draft',
      retryCount: 0,
    };

    const existingIndex = drafts.findIndex(d => d.id === id);
    const newDrafts = existingIndex >= 0
      ? drafts.map((d, i) => i === existingIndex ? newDraft : d)
      : [...drafts, newDraft];

    await persistDrafts(newDrafts);
    
    return id;
  }, [drafts, persistDrafts]);

  const updateDraft = useCallback(async (id: string, updates: Partial<PostDraft>): Promise<void> => {
    const newDrafts = drafts.map(d => 
      d.id === id 
        ? { ...d, ...updates, updated_at: Date.now() }
        : d
    );
    await persistDrafts(newDrafts);
  }, [drafts, persistDrafts]);

  const deleteDraft = useCallback(async (id: string): Promise<void> => {
    const newDrafts = drafts.filter(d => d.id !== id);
    await persistDrafts(newDrafts);
    
    if (currentDraftId === id) {
      setCurrentDraftId(null);
    }
  }, [drafts, currentDraftId, persistDrafts]);

  const submitDraft = useCallback(async (id: string): Promise<boolean> => {
    const draft = drafts.find(d => d.id === id);
    if (!draft) return false;

    // Mark as pending
    await updateDraft(id, { status: 'pending' });

    if (!isOnline) {
      toast({
        title: "Saved for later",
        description: "Your post will be submitted when you're back online",
      });
      return true;
    }

    // Try to submit
    await updateDraft(id, { status: 'syncing' });

    const result = await performAction(
      'post',
      {
        title: draft.title,
        content: draft.content,
        post_type: draft.post_type,
        tags: draft.tags,
        location: draft.location,
        image_urls: draft.image_urls,
      },
      async () => {
        // This would be the actual Supabase insert
        // For now, we're queueing it through the offline action system
        const { supabase } = await import('@/integrations/supabase/client');
        const { useAuth } = await import('@/hooks/useAuth');
        
        const { data, error } = await supabase
          .from('community_posts')
          .insert({
            title: draft.title,
            content: draft.content,
            post_type: draft.post_type,
            tags: draft.tags,
            location: draft.location,
            image_urls: draft.image_urls,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    );

    if (result.success) {
      // Remove draft on success
      await deleteDraft(id);
      toast({
        title: "Post published!",
        description: "Your post is now live",
      });
      return true;
    } else if (result.queued) {
      await updateDraft(id, { status: 'pending' });
      return true;
    } else {
      await updateDraft(id, { 
        status: 'failed', 
        error: result.error?.message,
        retryCount: draft.retryCount + 1,
      });
      toast({
        title: "Failed to publish",
        description: "We'll retry automatically",
        variant: "destructive",
      });
      return false;
    }
  }, [drafts, isOnline, performAction, updateDraft, deleteDraft, toast]);

  const syncAllDrafts = useCallback(async () => {
    const pendingDrafts = drafts.filter(d => d.status === 'pending');
    
    for (const draft of pendingDrafts) {
      await submitDraft(draft.id);
    }
  }, [drafts, submitDraft]);

  const setCurrentDraft = useCallback((id: string | null) => {
    setCurrentDraftId(id);
  }, []);

  const currentDraft = currentDraftId 
    ? drafts.find(d => d.id === currentDraftId) || null
    : null;

  const hasPendingDrafts = drafts.some(d => d.status === 'pending');

  return {
    drafts,
    currentDraft,
    isLoading,
    saveDraft,
    updateDraft,
    deleteDraft,
    submitDraft,
    setCurrentDraft,
    hasPendingDrafts,
    syncAllDrafts,
  };
}

export default useOfflinePostDraft;
