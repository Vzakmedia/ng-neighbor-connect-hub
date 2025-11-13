import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateAdCampaignDialog } from '@/components/advertising/CreateAdCampaignDialog';
import { Megaphone } from '@/lib/icons';

interface PromotePostButtonProps {
  postId: string;
  postType: 'community_post' | 'event';
  postTitle: string;
  postDescription?: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const PromotePostButton = ({ 
  postId, 
  postType, 
  postTitle,
  postDescription, 
  variant = "outline", 
  size = "sm",
  className = "" 
}: PromotePostButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <CreateAdCampaignDialog 
      onCampaignCreated={() => setDialogOpen(false)}
      preSelectedContent={{
        id: postId,
        type: postType,
        title: postTitle,
        description: postDescription
      }}
    >
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        onClick={() => setDialogOpen(true)}
      >
        <Megaphone className="h-4 w-4" />
        Promote
      </Button>
    </CreateAdCampaignDialog>
  );
};