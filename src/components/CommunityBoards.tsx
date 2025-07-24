import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Globe,
  Hash
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  user_id: string;
  group_id: string;
  content: string;
  message_type: string;
  is_pinned: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  } | null;
  likes_count: number;
  is_liked_by_user: boolean;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      },
      {
        id: 'help',
        name: 'Help & Support',
        description: 'Ask for help from your neighbors',
        category: 'help',
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const fetchMessages = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      console.log('Fetching messages for group:', selectedGroup);
      
      // First fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, user_id, group_id, content, message_type, is_pinned, reply_to_id, created_at, updated_at')
        .eq('group_id', selectedGroup)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        toast({
          title: "Error loading messages",
          description: "Failed to load chat messages.",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched messages:', messagesData);

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Get user IDs and fetch profiles separately
      const userIds = [...new Set(messagesData.map(message => message.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, neighborhood, city, state')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get message IDs for like counting
      const messageIds = messagesData.map(message => message.id);
      
      // Fetch like counts for each message
      const { data: likesData, error: likesError } = await supabase
        .from('chat_message_likes')
        .select('message_id, user_id')
        .in('message_id', messageIds);

      if (likesError) {
        console.error('Error fetching message likes:', likesError);
      }

      // Create profiles map
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Process messages with like information and profiles
      const processedMessages = messagesData
        .map(message => {
          const userProfile = profilesMap.get(message.user_id);
          
          // Apply location filtering
          if (viewScope === 'neighborhood' && profile.neighborhood) {
            if (userProfile?.neighborhood !== profile.neighborhood) {
              return null;
            }
          } else if (viewScope === 'state' && profile.state) {
            if (userProfile?.state !== profile.state) {
              return null;
            }
          }

          return {
            ...message,
            profiles: userProfile || null,
            likes_count: likesData?.filter(like => like.message_id === message.id).length || 0,
            is_liked_by_user: likesData?.some(like => like.message_id === message.id && like.user_id === user.id) || false
          };
        })
        .filter(Boolean) as ChatMessage[];

      console.log('Processed messages:', processedMessages);
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, profile, selectedGroup, viewScope]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for group:', selectedGroup);

    const channel = supabase
      .channel(`chat_messages_${selectedGroup}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${selectedGroup}`
        },
        (payload) => {
          console.log('Chat message change:', payload);
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_likes'
        },
        (payload) => {
          console.log('Chat message like change:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, selectedGroup, viewScope]);

  const sendMessage = async (isReply = false) => {
    const content = isReply ? replyText : newMessage;
    if (!content.trim() || !user || !profile) return;

    try {
      console.log('Sending message:', {
        content,
        group_id: selectedGroup,
        user_id: user.id,
        reply_to_id: isReply ? replyingTo : null
      });

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          group_id: selectedGroup,
          content: content.trim(),
          message_type: 'message',
          is_pinned: false,
          reply_to_id: isReply ? replyingTo : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: "Failed to send your message.",
          variant: "destructive",
        });
        return;
      }

      console.log('Message sent successfully:', data);

      if (isReply) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewMessage('');
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleLike = async (messageId: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      if (message.is_liked_by_user) {
        // Unlike the message
        const { error } = await supabase
          .from('chat_message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setMessages(messages.map(m => 
          m.id === messageId 
            ? { ...m, is_liked_by_user: false, likes_count: m.likes_count - 1 }
            : m
        ));
      } else {
        // Like the message
        const { error } = await supabase
          .from('chat_message_likes')
          .insert({
            message_id: messageId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setMessages(messages.map(m => 
          m.id === messageId 
            ? { ...m, is_liked_by_user: true, likes_count: m.likes_count + 1 }
            : m
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePin = async (messageId: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_pinned: !message.is_pinned })
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, is_pinned: !m.is_pinned }
          : m
      ));

      toast({
        title: message.is_pinned ? "Message unpinned" : "Message pinned",
        description: message.is_pinned ? "Message has been unpinned." : "Message has been pinned.",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to pin/unpin message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (userId: string) => {
    // For now, treat the first user as admin - you can enhance this later
    if (userId === messages[0]?.user_id) {
      return <Crown className="h-3 w-3 text-yellow-500" />;
    }
    return null;
  };

  const getRoleBadge = (userId: string) => {
    // For now, treat the first user as admin - you can enhance this later
    if (userId === messages[0]?.user_id) {
      return <Badge variant="default" className="text-xs">Admin</Badge>;
    }
    return null;
  };

  const chatGroups = getChatGroups();
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

        <ScrollArea className="h-[calc(100%-120px)]">
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
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">{group.name}</h3>
                </div>
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
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{currentGroup?.name}</h2>
              </div>
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
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <Hash className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No messages in #{currentGroup?.name} yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to start a conversation!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`relative ${message.is_pinned ? 'bg-primary/5 rounded-lg p-3 border border-primary/20' : ''}`}>
                  {message.is_pinned && (
                    <div className="flex items-center text-xs text-primary mb-2">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned message
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={message.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {message.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{message.profiles?.full_name || 'Anonymous User'}</span>
                        {getRoleIcon(message.user_id)}
                        {getRoleBadge(message.user_id)}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {message.profiles?.neighborhood || message.profiles?.city || 'Unknown Location'}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(message.created_at)}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3 leading-relaxed break-words">{message.content}</p>
                      
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(message.id)}
                          className={`h-7 px-2 ${message.is_liked_by_user ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                        >
                          <Heart className={`h-3 w-3 mr-1 ${message.is_liked_by_user ? 'fill-current' : ''}`} />
                          {message.likes_count > 0 && message.likes_count}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                          className="h-7 px-2 text-muted-foreground hover:text-primary"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        
                        {message.user_id === user?.id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => togglePin(message.id)}
                            className="h-7 px-2 text-muted-foreground hover:text-primary"
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Reply input */}
                      {replyingTo === message.id && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">
                            Replying to {message.profiles?.full_name || 'Anonymous User'}
                          </p>
                          <div className="flex space-x-2">
                            <Textarea
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="min-h-[60px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage(true);
                                }
                              }}
                            />
                            <div className="flex flex-col space-y-2">
                              <Button 
                                size="sm" 
                                onClick={() => sendMessage(true)}
                                disabled={!replyText.trim()}
                                className="px-3"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm" 
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-3"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder={`Message #${currentGroup?.name.toLowerCase()}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityBoards;