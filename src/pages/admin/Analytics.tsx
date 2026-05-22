import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, FileText, AlertTriangle, TrendingUp, ShoppingCart, Activity } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';

interface DailyPoint {
  date: string;
  value: number;
}

async function fetchDailyCounts(
  table: string,
  dateCol: string,
  days: number,
  filter?: Record<string, string>,
): Promise<DailyPoint[]> {
  const points: DailyPoint[] = [];
  const now = new Date();

  const promises = Array.from({ length: days }, (_, i) => {
    const day = startOfDay(subDays(now, days - 1 - i));
    const nextDay = startOfDay(subDays(now, days - 2 - i));
    let q = (supabase as any)
      .from(table)
      .select('id', { count: 'exact', head: true })
      .gte(dateCol, day.toISOString())
      .lt(dateCol, nextDay.toISOString());
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => { q = q.eq(k, v); });
    }
    return q.then(({ count }: { count: number | null }) => ({
      date: format(day, 'MMM d'),
      value: count ?? 0,
    }));
  });

  const results = await Promise.all(promises);
  return results;
}

const STAT_CARDS = [
  { key: 'totalUsers',      label: 'Total Users',        icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50' },
  { key: 'activePosts',     label: 'Active Posts',       icon: FileText,       color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'emergencyAlerts', label: 'Active Alerts',      icon: AlertTriangle,  color: 'text-rose-600',   bg: 'bg-rose-50' },
  { key: 'marketplaceItems',label: 'Marketplace Items',  icon: ShoppingCart,   color: 'text-amber-600',  bg: 'bg-amber-50' },
  { key: 'dailyActiveUsers',label: 'Daily Active Users', icon: Activity,       color: 'text-emerald-600',bg: 'bg-emerald-50' },
  { key: 'postsPerDay',     label: 'Posts / Day',        icon: TrendingUp,     color: 'text-cyan-600',   bg: 'bg-cyan-50' },
];

export default function AdminAnalytics() {
  const { stats, loading: statsLoading } = useAdminStats();
  const [signups, setSignups]     = useState<DailyPoint[]>([]);
  const [posts, setPosts]         = useState<DailyPoint[]>([]);
  const [alerts, setAlerts]       = useState<DailyPoint[]>([]);
  const [dau, setDau]             = useState<DailyPoint[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setChartsLoading(true);
      try {
        const [s, p, a, d] = await Promise.all([
          fetchDailyCounts('profiles',       'created_at', 30),
          fetchDailyCounts('community_posts','created_at', 30),
          fetchDailyCounts('safety_alerts',  'created_at', 14),
          fetchDailyCounts('profiles',       'updated_at', 14),
        ]);
        if (!cancelled) {
          setSignups(s);
          setPosts(p);
          setAlerts(a);
          setDau(d);
        }
      } catch (e) {
        console.error('Analytics fetch error:', e);
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const isLoading = statsLoading || chartsLoading;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform growth and activity trends</p>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${bg} p-2 rounded-lg shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{label}</p>
                <p className="text-xl font-bold text-slate-900">
                  {isLoading ? '—' : ((stats as any)[key] ?? 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 30-day signups + posts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">New Signups — 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={signups} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={6} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Signups" stroke="#0B8E67" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Posts Published — 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={posts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={6} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Posts" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 14-day alerts + active users side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Emergency Alerts — 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={alerts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Alerts" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Profile Activity (DAU proxy) — 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dau} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Active" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
