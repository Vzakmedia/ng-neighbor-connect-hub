import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  bio: string | null;
  is_verified: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(data || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    return user?.email || 'User';
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .slice(0, 2)
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase();
    }
    return user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'U';
  };

  const getLocation = () => {
    if (profile?.neighborhood && profile?.city) {
      return `${profile.neighborhood}, ${profile.city}`;
    }
    if (profile?.city && profile?.state) {
      return `${profile.city}, ${profile.state}`;
    }
    if (profile?.city) return profile.city;
    if (profile?.state) return profile.state;
    return 'Location not set';
  };

  return {
    profile,
    loading,
    getDisplayName,
    getInitials,
    getLocation,
  };
}