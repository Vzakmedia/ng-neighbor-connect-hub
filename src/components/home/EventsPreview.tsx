import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronRightIcon, MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useUpcomingEvents } from "@/hooks/useDashboardSections";

export const EventsPreview = () => {
  const navigate = useNavigate();
  const { events, loading } = useUpcomingEvents(2);

  if (loading || events.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Upcoming Events</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/events")}
          className="text-primary"
        >
          View All
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/?eventId=${event.id}`)}
            className="bg-background rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm mb-1">{event.title}</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{event.date} at {event.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPinIcon className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                  {event.attendees > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UsersIcon className="h-3 w-3" />
                      <span>{event.attendees} attending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
