import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart2, MessagesSquare, Star } from 'lucide-react';
import { EventsModerationPanel } from '@/components/admin/moderation/EventsModerationPanel';
import { PollsModerationPanel } from '@/components/admin/moderation/PollsModerationPanel';
import { BoardsModerationPanel } from '@/components/admin/moderation/BoardsModerationPanel';
import { RecommendationsModerationPanel } from '@/components/admin/moderation/RecommendationsModerationPanel';

export default function AdminCommunity() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate events, polls, discussion boards, and recommendations</p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" />Events</TabsTrigger>
          <TabsTrigger value="polls"><BarChart2 className="h-4 w-4 mr-2" />Polls</TabsTrigger>
          <TabsTrigger value="boards"><MessagesSquare className="h-4 w-4 mr-2" />Boards</TabsTrigger>
          <TabsTrigger value="recommendations"><Star className="h-4 w-4 mr-2" />Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4"><EventsModerationPanel /></TabsContent>
        <TabsContent value="polls" className="mt-4"><PollsModerationPanel /></TabsContent>
        <TabsContent value="boards" className="mt-4"><BoardsModerationPanel /></TabsContent>
        <TabsContent value="recommendations" className="mt-4"><RecommendationsModerationPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
