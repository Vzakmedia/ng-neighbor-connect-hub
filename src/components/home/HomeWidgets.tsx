import { useState } from "react";
import { QuickPostInput } from "@/components/home/QuickPostInput";
import CreatePostDialog from "@/components/CreatePostDialog";
import { UnifiedFeed } from "@/components/home/UnifiedFeed";

/**
 * HomeWidgets - Mobile Facebook-style Feed
 * Unified vertical scrolling feed with mixed content (posts, ads, widgets)
 */
const HomeWidgets = () => {
  const [createPostOpen, setCreatePostOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <QuickPostInput onCreatePost={() => setCreatePostOpen(true)} />
        <UnifiedFeed />
      </div>
      
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </div>
  );
};

export default HomeWidgets;
