import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CreatePostDialog from '@/components/CreatePostDialog';
import { Plus } from 'lucide-react';

// Floating Create Post button shown across the app on mobile
const FloatingCreatePostButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="md:hidden fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-primary/20 backdrop-blur-md border border-white/20 hover:bg-primary/30 transition-all duration-300 z-50 animate-float"
        aria-label="Create Post"
      >
        <Plus className="h-5 w-5 text-white" />
      </Button>

      <CreatePostDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FloatingCreatePostButton;
