import React from "react";
import { CommunityFeedHeader } from "./CommunityFeedHeader";
import { CommunityFeedContent } from "./CommunityFeedContent";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import { useCommunitySubscriptions } from "@/hooks/useCommunitySubscriptions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const CommunityFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const {
    events,
    loading,
    refreshing,
    hasNewContent,
    searchQuery,
    unreadCounts,
    filters,
    availableTags,
    activeFiltersCount,
    setSearchQuery,
    setFilters,
    setHasNewContent,
    setUnreadCounts,
    handleLike,
    handleSave,
    handleRefresh,
    updatePostLikes,
    updatePostComments,
    fetchPosts
  } = useCommunityFeed();

  // Set up real-time subscriptions
  useCommunitySubscriptions({
    user,
    profile,
    onNewContent: () => setHasNewContent(true),
    onUpdateUnreadCounts: setUnreadCounts,
    onRefreshPosts: fetchPosts,
    onUpdatePostLikes: updatePostLikes,
    onUpdatePostComments: updatePostComments
  });

  return (
    <div className="max-w-2xl mx-auto">
      <CommunityFeedHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasNewContent={hasNewContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        unreadCount={unreadCounts.community}
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        activeFiltersCount={activeFiltersCount}
      />
      
      <div className="p-4">
        <CommunityFeedContent
          events={events}
          loading={loading}
          onLike={handleLike}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default CommunityFeed;