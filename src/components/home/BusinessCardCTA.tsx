import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BuildingOffice2Icon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const BusinessCardCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: hasBusiness, isLoading } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  if (isLoading) return null;

  if (hasBusiness) {
    return (
      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20">
        <div className="flex items-start gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Business Profile Active</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Manage your business profile and reach more customers
            </p>
            <Button
              onClick={() => navigate("/business")}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Manage Business
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <BuildingOffice2Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Start Your Business Profile</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Showcase your business and connect with local customers
          </p>
          <ul className="text-sm text-muted-foreground mb-3 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-primary" />
              Reach local customers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-primary" />
              Build trust in your community
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-primary" />
              Grow your business
            </li>
          </ul>
          <Button
            onClick={() => navigate("/business")}
            size="sm"
          >
            Create Business Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
