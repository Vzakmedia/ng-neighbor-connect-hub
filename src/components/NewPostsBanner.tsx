import { motion, AnimatePresence } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";

interface NewPostsStore {
  hasNewPosts: boolean;
  setHasNewPosts: (value: boolean) => void;
}

export const useNewPostsStore = create<NewPostsStore>((set) => ({
  hasNewPosts: false,
  setHasNewPosts: (value) => set({ hasNewPosts: value }),
}));

export const NewPostsBanner = () => {
  const { hasNewPosts, setHasNewPosts } = useNewPostsStore();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Force refetch all active feed queries
    await queryClient.refetchQueries({ queryKey: ['feed'], type: 'active' });
    setHasNewPosts(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {hasNewPosts && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full px-4"
        >
          <button
            onClick={handleRefresh}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-lg px-4 py-3 flex items-center justify-center gap-2 transition-all hover:shadow-xl"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="font-medium">New posts available</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
