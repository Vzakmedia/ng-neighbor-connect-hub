import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Phone, Mail, Shield, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileDialog } from './UserProfileDialog';
import { DirectMessageDialog } from './DirectMessageDialog';
import { useToast } from '@/hooks/use-toast';

interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  phone_masked: string | null;
  is_verified: boolean;
  created_at: string;
}

export const UserDirectory = () => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [searchTerm, profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .order('display_name');

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load user directory.",
          variant: "destructive",
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
      return;
    }

    const filtered = profiles.filter(profile => 
      profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProfiles(filtered);
  };

  const getLocation = (profile: PublicProfile) => {
    if (profile.neighborhood && profile.city) {
      return `${profile.neighborhood}, ${profile.city}`;
    }
    if (profile.city && profile.state) {
      return `${profile.city}, ${profile.state}`;
    }
    return profile.city || profile.state || 'Location not set';
  };

  const handleViewProfile = (profile: PublicProfile) => {
    setSelectedProfile(profile);
    setShowProfileDialog(true);
  };

  const handleSendMessage = (profile: PublicProfile) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages.",
        variant: "destructive",
      });
      return;
    }
    setSelectedProfile(profile);
    setShowMessageDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredProfiles.length} of {profiles.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredProfiles.map((profile) => (
          <Card key={profile.user_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{profile.display_name || 'Anonymous User'}</h3>
                      {profile.is_verified && (
                        <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{getLocation(profile)}</span>
                    </div>

                    {profile.phone_masked && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone_masked}</span>
                      </div>
                    )}

                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Member since {formatDate(profile.created_at)}
                    </div>
                  </div>
                </div>

                {user && user.id !== profile.user_id && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(profile)}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSendMessage(profile)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProfiles.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm.trim() 
                  ? `No users match "${searchTerm}"`
                  : "No users available in the directory"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile Dialog */}
      {selectedProfile && (
        <UserProfileDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          userName={selectedProfile.display_name || 'Anonymous User'}
          userAvatar={selectedProfile.avatar_url || undefined}
        />
      )}

      {/* Direct Message Dialog */}
      {selectedProfile && (
        <DirectMessageDialog
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          recipientId={selectedProfile.user_id}
          recipientName={selectedProfile.display_name || 'Anonymous User'}
          recipientAvatar={selectedProfile.avatar_url || undefined}
        />
      )}
    </div>
  );
};