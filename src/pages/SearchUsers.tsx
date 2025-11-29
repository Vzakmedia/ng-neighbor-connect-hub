import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/lib/icons';
import UserSearch from '@/components/messaging/UserSearch';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SearchUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrFindConversation } = useConversations(user?.id);

  const handleUserSelect = async (user: {
    id: string;
    user_id: string;
    full_name: string | null;
  }) => {
    try {
      const conversationId = await createOrFindConversation(user.user_id);
      
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      } else {
        toast.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">New Message</h1>
        </div>
      </div>

      <div className="p-4">
        <UserSearch onUserSelect={handleUserSelect} />
      </div>
    </div>
  );
};

export default SearchUsers;
