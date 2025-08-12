import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface UserSearchProps {
  onUserSelect: (user: {
    id: string;
    user_id: string;
    full_name: string | null;
  }) => void;
}

interface SearchResult {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (term: string) => {
    if (!term.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        .or(`display_name.ilike.%${term}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults((data || []).map((d: any) => ({ id: d.user_id, user_id: d.user_id, full_name: d.display_name ?? null, avatar_url: d.avatar_url ?? null })));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user]);

  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      )}

      {!loading && searchTerm && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No users found matching "{searchTerm}"</p>
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => onUserSelect(result)}
                className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={result.avatar_url || ''} />
                  <AvatarFallback>
                    {getInitials(result.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {result.full_name || 'Unknown User'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {!searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Start typing to search for users</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;