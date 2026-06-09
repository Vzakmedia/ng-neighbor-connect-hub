import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WrenchScrewdriverIcon, ChevronRightIcon, StarIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const DiscoverServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: services, isLoading } = useQuery({
    queryKey: ['featured-services', profile?.city || 'global'],
    queryFn: async () => {
      if (!user) return [];

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, title, category, price_min, price_max, rating, user_id')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(profile?.city ? 10 : 3);

      const rows = servicesData || [];
      if (rows.length === 0) return [];

      const userIds = [...new Set(rows.map((s: any) => s.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, city')
        .in('user_id', userIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));
      const results = rows.map((s: any) => ({ ...s, profiles: profileMap.get(s.user_id) ?? null }));

      if (profile?.city) {
        const local = results.filter((s: any) => s.profiles?.city === profile.city);
        return local.length > 0 ? local.slice(0, 3) : results.slice(0, 3);
      }
      return results;
    },
    enabled: !!user,
  });

  if (isLoading || !services || services.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <WrenchScrewdriverIcon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Services Near You</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/services")}
          className="text-primary"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => navigate(`/services?id=${service.id}`)}
            className="bg-background rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                <WrenchScrewdriverIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm mb-1">{service.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                  {service.rating && (
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span>{service.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {(service.price_min != null || service.price_max != null) && (
                  <p className="text-sm text-muted-foreground">
                    {service.price_min != null && service.price_max != null
                      ? `₦${service.price_min.toLocaleString()} – ₦${service.price_max.toLocaleString()}`
                      : service.price_min != null
                      ? `From ₦${service.price_min.toLocaleString()}`
                      : `Up to ₦${service.price_max!.toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
