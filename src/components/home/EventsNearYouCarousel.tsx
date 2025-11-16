import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUpcomingEvents } from "@/hooks/useDashboardSections";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

export const EventsNearYouCarousel = () => {
  const navigate = useNavigate();
  const { profile, getInitials } = useProfile();
  const { events, loading } = useUpcomingEvents();

  const displayEvents = events.slice(0, 5);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 px-4">Events Near You</h2>
      
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-3 pb-2">
          {/* Find Event Card */}
          <div
            onClick={() => navigate('/events')}
            className="relative flex-shrink-0 w-[140px] h-[200px] bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            {/* Avatar Image Background */}
            <div className="absolute inset-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <div className="text-6xl text-white/40 font-bold">
                    {getInitials()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* Plus Button at Bottom Center */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
              <div className="bg-blue-600 rounded-full p-3 shadow-lg">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {/* Find Event Text */}
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-sm font-medium text-white">Find Event</span>
            </div>
          </div>

          {/* Event Cards */}
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[160px] h-[200px] bg-muted rounded-xl animate-pulse"
                />
              ))}
            </>
          ) : displayEvents.length > 0 ? (
            displayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="relative flex-shrink-0 w-[160px] h-[200px] rounded-xl overflow-hidden cursor-pointer group"
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{ 
                    backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)'
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Creator Avatar */}
                <div className="absolute top-2 left-2">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs">
                      {event.title?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Event Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/90 mb-0.5">
                    <ClockIcon className="h-3 w-3" />
                    <span className="line-clamp-1">
                      {event.date && event.time ? `${event.date}, ${event.time}` : 'Date TBA'}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-white/90">
                      <MapPinIcon className="h-3 w-3" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-[160px] h-[200px] bg-card border border-border rounded-xl flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center px-4">
                No events nearby
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
