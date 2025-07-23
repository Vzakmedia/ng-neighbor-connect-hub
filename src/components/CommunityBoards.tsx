import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare,
  Send,
  Pin,
  Users,
  Crown,
  Heart,
  Reply,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: 'admin' | 'moderator' | 'member';
    location: string;
  };
  content: string;
  timestamp: string;
  type: 'message' | 'announcement' | 'poll';
  isPinned?: boolean;
  likes: number;
  replies: number;
  isLiked: boolean;
}

interface ChatGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  isPrivate: boolean;
  lastActivity: string;
  unreadCount: number;
}

const CommunityBoards = () => {
  const [selectedGroup, setSelectedGroup] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewScope, setViewScope] = useState<'neighborhood' | 'state'>('neighborhood');
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  // Dynamic chat groups based on user's location
  const getChatGroups = (): ChatGroup[] => {
    const baseGroups = [
      {
        id: 'general',
        name: 'General Discussion',
        description: `General chat for ${viewScope === 'neighborhood' ? profile?.neighborhood || 'your neighborhood' : profile?.state || 'your state'}`,
        category: 'general',
        isPrivate: false,
      },
      {
        id: 'safety',
        name: 'Safety & Security',
        description: 'Report incidents and safety concerns',
        category: 'safety',
        isPrivate: false,
      },
      {
        id: 'marketplace',
        name: 'Buy & Sell',
        description: 'Local marketplace for neighbors',
        category: 'marketplace',
        isPrivate: false,
      },
      {
        id: 'events',
        name: 'Events & Gatherings',
        description: 'Organize and discover community events',
        category: 'events',
        isPrivate: false,
      }
    ];

    return baseGroups.map(group => ({
      ...group,
      members: 0, // We'll implement member counting later
      lastActivity: '...',
      unreadCount: 0
    }));
  };

  const fetchMessages = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      // Fetch community posts as "messages" for the chat view
      let query = supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          post_type,
          title,
          content,
          created_at,
          profiles!community_posts_user_id_fkey (
            full_name,
            avatar_url,
            neighborhood,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by selected group type
      if (selectedGroup !== 'general') {
        query = query.eq('post_type', selectedGroup);
      }

      const { data: postsData, error: postsError } = await query;
      
      if (postsError) {
        console.error('Error fetching messages:', postsError);
        return;
      }

      // Get all unique user IDs from posts
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user_id to profile for easy lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Transform posts to chat messages and apply location filtering
      const transformedMessages = (postsData || [])
        .map(post => {
          const userProfile = profilesMap.get(post.user_id);
          return {
            ...post,
            profiles: userProfile || null
          };
        })
        .filter(post => {
          // Apply location filtering
          if (viewScope === 'neighborhood' && profile.neighborhood) {
            return post.profiles?.neighborhood === profile.neighborhood;
          } else if (viewScope === 'state' && profile.state) {
            return post.profiles?.state === profile.state;
          }
          return true;
        })
        .map(post => ({
          id: post.id,
          author: {
            name: post.profiles?.full_name || 'Anonymous User',
            avatar: post.profiles?.avatar_url || undefined,
            role: 'member' as const,
            location: post.profiles?.neighborhood || post.profiles?.city || 'Unknown Location'
          },
          content: post.title ? `${post.title}\n\n${post.content}` : post.content,
          timestamp: formatTimeAgo(post.created_at),
          type: 'message' as const,
          isPinned: false,
          likes: 0,
          replies: 0,
          isLiked: false
        }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  useEffect(() => {
    fetchMessages();
  }, [user, profile, selectedGroup, viewScope]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('community_board_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, selectedGroup, viewScope]);

  const chatGroups = getChatGroups();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator':
        return <Crown className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="text-xs">Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-xs">Mod</Badge>;
      default:
        return null;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !profile) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          post_type: selectedGroup === 'general' ? 'general' : selectedGroup,
          content: newMessage,
          title: null,
          location: null,
          image_urls: []
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: "Failed to send your message.",
          variant: "destructive",
        });
        return;
      }

      setNewMessage('');
      // The real-time subscription will automatically update the messages
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleLike = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, isLiked: !msg.isLiked, likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1 }
        : msg
    ));
  };

  const currentGroup = chatGroups.find(group => group.id === selectedGroup);

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-background">
      {/* Groups Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Community Boards</h2>
          </div>
          
          {/* View Scope Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={viewScope === 'neighborhood' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewScope('neighborhood')}
              className="text-xs flex-1"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Neighborhood
            </Button>
            <Button
              variant={viewScope === 'state' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewScope('state')}
              className="text-xs flex-1"
            >
              <Globe className="h-3 w-3 mr-1" />
              State
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search groups..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto">
          {chatGroups
            .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-4 cursor-pointer transition-colors border-b hover:bg-muted/50 ${
                selectedGroup === group.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{group.name}</h3>
                {group.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {group.unreadCount}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{group.description}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {group.members} members
                </div>
                <span>{group.lastActivity}</span>
              </div>
              
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="outline" className="text-xs">{group.category}</Badge>
                {group.isPrivate && (
                  <Badge variant="secondary" className="text-xs">Private</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{currentGroup?.name}</h2>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {currentGroup?.members || 0} members
                <MapPin className="h-4 w-4 ml-3 mr-1" />
                {viewScope === 'neighborhood' ? profile?.neighborhood || 'Your Neighborhood' : profile?.state || 'Your State'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Pin className="h-4 w-4 mr-1" />
                Pinned
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No messages in this board yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
            <div key={message.id} className={`relative ${message.isPinned ? 'bg-primary/5 rounded-lg p-3' : ''}`}>
              {message.isPinned && (
                <div className="flex items-center text-xs text-primary mb-2">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned message
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {message.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{message.author.name}</span>
                    {getRoleIcon(message.author.role)}
                    {getRoleBadge(message.author.role)}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {message.author.location}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {message.timestamp}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 leading-relaxed">{message.content}</p>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(message.id)}
                      className={`h-7 px-2 ${message.isLiked ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`h-3 w-3 mr-1 ${message.isLiked ? 'fill-current' : ''}`} />
                      {message.likes}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                      <Reply className="h-3 w-3 mr-1" />
                      {message.replies}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-end space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">You</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder={`Message ${currentGroup?.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[40px] max-h-32 resize-none"
              />
            </div>
            
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBoards;