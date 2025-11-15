import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { SparklesIcon } from "@heroicons/react/24/outline";

export const HomeHero = () => {
  const { profile } = useProfile();
  const stats = useDashboardStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Neighbor'}!
        </h1>
      </div>
      <p className="text-muted-foreground mb-4">
        Here's what's happening in your community
      </p>
      
      {!stats.loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.activeNeighbors}</div>
            <div className="text-xs text-muted-foreground">Active Neighbors</div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.postsToday}</div>
            <div className="text-xs text-muted-foreground">Posts Today</div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.upcomingEvents}</div>
            <div className="text-xs text-muted-foreground">Upcoming Events</div>
          </div>
        </div>
      )}
    </div>
  );
};
