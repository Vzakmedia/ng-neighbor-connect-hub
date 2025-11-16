import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface QuickPostInputProps {
  onCreatePost: () => void;
}

export const QuickPostInput = ({ onCreatePost }: QuickPostInputProps) => {
  const { profile, getInitials } = useProfile();

  return (
    <div 
      className="mx-4 mt-4 mb-3 bg-card border border-border rounded-lg p-3 cursor-pointer hover:bg-card/80 transition-colors"
      onClick={onCreatePost}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-muted-foreground text-sm">
          What's on your mind?
        </div>
        
        <PhotoIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
};
