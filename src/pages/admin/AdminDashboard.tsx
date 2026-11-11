import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/db/supabase';
import { Users, FileText, Share2, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DreamverseInlineLoader } from '@/components/dreamverse';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeToday: number;
  signupsToday: number;
  totalNotes: number;
  notesToday: number;
  totalShared: number;
  sharedToday: number;
}

interface Activity {
  id: string;
  action: string;
  user_id: string | null;
  resource_type: string;
  created_at: string;
  details: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user stats (SECURITY DEFINER — admin only)
      const { data: userStats, error: userErr } = await supabase.rpc('get_user_stats');
      if (userErr) console.error('get_user_stats error:', userErr);

      // Load notes stats (SECURITY DEFINER — admin only)
      const { data: notesStats, error: notesErr } = await supabase.rpc('get_notes_stats');
      if (notesErr) console.error('get_notes_stats error:', notesErr);

      // Load recent system activities
      const { data: recentActivities } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const us = userStats as Record<string, number> | null;
      const ns = notesStats as Record<string, number> | null;

      setStats({
        totalUsers:      us?.total_users      ?? 0,
        verifiedUsers:   us?.verified_users   ?? 0,
        unverifiedUsers: us?.unverified_users ?? 0,
        activeToday:     us?.active_today     ?? 0,
        signupsToday:    us?.signups_today    ?? 0,
        totalNotes:      ns?.total_notes      ?? 0,
        notesToday:      ns?.notes_today      ?? 0,
        totalShared:     ns?.total_shared     ?? 0,
        sharedToday:     ns?.shared_today     ?? 0,
      });

      setActivities(recentActivities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <DreamverseInlineLoader statusText="Loading dashboard metrics…" className="max-w-xs" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: `+${stats?.signupsToday || 0} today`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active Today',
      value: stats?.activeToday || 0,
      change: `${stats?.verifiedUsers || 0} verified`,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Total Notes',
      value: stats?.totalNotes || 0,
      change: `+${stats?.notesToday || 0} today`,
      icon: FileText,
      color: 'text-purple-500',
    },
    {
      title: 'Shared Links',
      value: stats?.totalShared || 0,
      change: `+${stats?.sharedToday || 0} today`,
      icon: Share2,
      color: 'text-orange-500',
    },
    {
      title: 'Unverified',
      value: stats?.unverifiedUsers || 0,
      change: 'Pending verification',
      icon: AlertCircle,
      color: 'text-yellow-500',
    },
    {
      title: 'Guest Sessions',
      value: '—',
      change: 'Coming soon',
      icon: UserCheck,
      color: 'text-gray-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Overview of your BlackBook workspace
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title} className="dreamverse-shoji border-border/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-semibold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Feed */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-normal">Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-normal">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.resource_type} • {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-normal">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <button className="rounded-md border border-border p-4 text-left transition-colors hover:bg-muted">
                <p className="text-sm font-normal">View Pending Verifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.unverifiedUsers || 0} users waiting
                </p>
              </button>
              <button className="rounded-md border border-border p-4 text-left transition-colors hover:bg-muted">
                <p className="text-sm font-normal">System Health Check</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Run diagnostics
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
