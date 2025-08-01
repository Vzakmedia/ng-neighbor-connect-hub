import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users } from 'lucide-react';
import EventFeed from '@/components/EventFeed';
import CreateEventDialog from '@/components/CreateEventDialog';
import MyEventsPanel from '@/components/MyEventsPanel';

const Events = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Community Events</h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            {/* Desktop tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="my-events">My Events</TabsTrigger>
            </TabsList>
            
            {/* Mobile tabs - using buttons instead of TabsTrigger */}
            <div className="md:hidden w-full mb-4">
              <div className="flex justify-center gap-1 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {/* handled by Tabs component */}}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  All Events
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {/* handled by Tabs component */}}
                >
                  <Users className="h-3 w-3 mr-1" />
                  My Events
                </Button>
              </div>
            </div>
            
            <TabsContent value="all">
              <EventFeed key={refreshKey} />
            </TabsContent>
            
            <TabsContent value="my-events">
              <MyEventsPanel />
            </TabsContent>
          </Tabs>
          
          <CreateEventDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onEventCreated={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </main>
    </div>
  );
};

export default Events;