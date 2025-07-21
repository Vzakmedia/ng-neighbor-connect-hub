import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  MapPin, 
  Clock,
  BarChart3,
  Zap
} from 'lucide-react';

const NeighborhoodInsights = () => {
  const insights = [
    {
      title: 'Community Engagement',
      value: 85,
      change: +12,
      icon: Users,
      description: 'Active participation in the last 30 days',
      color: 'text-community-blue'
    },
    {
      title: 'Safety Score',
      value: 92,
      change: +5,
      icon: Activity,
      description: 'Based on incident reports and community watch',
      color: 'text-community-green'
    },
    {
      title: 'Event Attendance',
      value: 76,
      change: -3,
      icon: MapPin,
      description: 'Average attendance for community events',
      color: 'text-community-yellow'
    },
    {
      title: 'Response Time',
      value: 68,
      change: +8,
      icon: Clock,
      description: 'Community support response time (minutes)',
      color: 'text-primary'
    }
  ];

  const quickFacts = [
    { label: 'Most Active Day', value: 'Saturday', icon: BarChart3 },
    { label: 'Peak Hours', value: '6-8 PM', icon: Clock },
    { label: 'Top Category', value: 'Safety', icon: Activity },
    { label: 'Growth Rate', value: '+18%', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Neighborhood Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const isPositive = insight.change > 0;
              
              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${insight.color}`} />
                      <span className="font-medium">{insight.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{insight.value}%</span>
                      <Badge 
                        variant={isPositive ? "default" : "secondary"}
                        className={`text-xs flex items-center ${
                          isPositive ? 'bg-community-green/20 text-community-green' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(insight.change)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={insight.value} className="h-2" />
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-community-yellow" />
            Quick Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {quickFacts.map((fact, index) => {
              const Icon = fact.icon;
              return (
                <div key={index} className="text-center p-3 rounded-lg bg-muted/30">
                  <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="font-semibold text-sm">{fact.value}</div>
                  <div className="text-xs text-muted-foreground">{fact.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeighborhoodInsights;