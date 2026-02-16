import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import CommunityFeed from './CommunityFeed';
import HeroSection from './HeroSection';
import CreatePostDialog from './CreatePostDialog';
import { ScrollToTop } from './ScrollToTop';
import { FeedTabNavigation } from './community/feed/FeedTabNavigation';
import { BusinessCardCTA } from './home/BusinessCardCTA';
import { TrendingPostsCarousel } from './home/TrendingPostsCarousel';

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'for-you' | 'recent' | 'nearby' | 'trending'>('for-you');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedLocationScope, setSelectedLocationScope] = useState<'neighborhood' | 'city' | 'state' | null>(null);
  const [feedFilters, setFeedFilters] = useState({
    locationScope: 'neighborhood',
    tags: [] as string[],
    postTypes: 'all',
    sortBy: 'recommended',
    dateRange: 'all',
  });

  const handleTabChange = (tab: 'for-you' | 'recent' | 'nearby' | 'trending') => {
    setActiveTab(tab);
    setSelectedLocationScope(null); // Clear location pill when switching main tabs

    switch (tab) {
      case 'for-you':
        // Personalized feed using AI recommendations
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'recommended',
          dateRange: 'all',
        });
        break;
      case 'recent':
        // Most recent posts from entire platform
        setFeedFilters({
          locationScope: 'all',
          tags: [],
          postTypes: 'all',
          sortBy: 'recent',
          dateRange: 'all',
        });
        break;
      case 'nearby':
        // Posts from user's immediate neighborhood
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'recent',
          dateRange: 'all',
        });
        break;
      case 'trending':
        // Popular posts based on engagement
        setFeedFilters({
          locationScope: 'neighborhood',
          tags: [],
          postTypes: 'all',
          sortBy: 'popular',
          dateRange: 'week',
        });
        break;
    }
  };

  const handleLocationScopeChange = (scope: 'neighborhood' | 'city' | 'state' | null) => {
    setSelectedLocationScope(scope);

    if (scope) {
      setFeedFilters(prev => ({
        ...prev,
        locationScope: scope
      }));
    } else {
      // Reset to default neighborhood when clearing
      setFeedFilters(prev => ({
        ...prev,
        locationScope: 'neighborhood'
      }));
    }
  };

  // Keyboard shortcuts for tab navigation (1-4 keys)
  useKeyboardShortcuts([
    { key: '1', callback: () => handleTabChange('for-you') },
    { key: '2', callback: () => handleTabChange('recent') },
    { key: '3', callback: () => handleTabChange('nearby') },
    { key: '4', callback: () => handleTabChange('trending') },
  ]);


  // Prefetch common feed filter combinations for instant switching
  useEffect(() => {
    if (!user || !profile) return;

    // Prefetch common filter combinations users might switch to
    const commonFilters = [
      { locationScope: 'neighborhood' as const },
      { locationScope: 'city' as const },
      { locationScope: 'state' as const },
      { locationScope: 'all' as const },
    ];

    // Prefetch in the background after a short delay (don't block initial load)
    const prefetchTimeout = setTimeout(() => {
      commonFilters.forEach(filter => {
        const queryKey = ['feed', {
          userId: user.id,
          locationScope: filter.locationScope,
          tags: [],
          postType: undefined,
          sortBy: 'recent',
          searchQuery: '',
        }];

        // Only prefetch if not already cached
        const existing = queryClient.getQueryData(queryKey);
        if (!existing) {
          // Note: prefetchInfiniteQuery doesn't support 'pages' parameter
          // We just prefetch the first page by default
          queryClient.prefetchInfiniteQuery({
            queryKey,
            initialPageParam: 0,
          } as any); // Type assertion to bypass strict typing
        }
      });
    }, 2000); // Prefetch after 2 seconds

    return () => clearTimeout(prefetchTimeout);
  }, [user, profile, queryClient]);


  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 overflow-x-hidden">
      {/* Hero Section - with right margin for sidebar on desktop */}
      <div className="lg:mr-[352px]">
        <HeroSection />
      </div>

      {/* Trending Posts Carousel - with right margin for sidebar on desktop */}
      <div className="lg:mr-[352px]">
        <TrendingPostsCarousel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 overflow-x-clip relative">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <FeedTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onCreatePost={() => setCreatePostOpen(true)}
            selectedLocationScope={selectedLocationScope}
            onLocationScopeChange={handleLocationScopeChange}
          />

          {/* Feed Content */}
          <Card className="shadow-card border-0">
            <CardContent className="px-0 lg:px-6 pt-6" data-tutorial="community-feed">
              <CommunityFeed
                filters={feedFilters}
                onFiltersChange={setFeedFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Visible on desktop only due to space constraints */}
        <div className="hidden xl:block space-y-4 sm:space-y-5 md:space-y-6 fixed top-20 right-8 w-80 max-h-[calc(100vh-6rem)] overflow-x-hidden overflow-y-auto z-10">
          {/* Business CTA */}
          <BusinessCardCTA />
        </div>
      </div>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default HomeDashboard;