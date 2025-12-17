'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Users,
  UserCheck,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_conversations: number;
    total_messages: number;
    unique_visitors: number;
    leads_captured: number;
    avg_response_time_ms: number;
    avg_satisfaction: number;
    ai_cost_usd: number;
  };
  trends: {
    conversations_change: number;
    leads_change: number;
    response_time_change: number;
  };
  top_topics: { topic: string; count: number }[];
  top_courses: { course: string; count: number }[];
  daily_stats: { date: string; conversations: number; leads: number }[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?days=${period}`);
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Mock data for demo
  const mockData: AnalyticsData = {
    overview: {
      total_conversations: 1247,
      total_messages: 8934,
      unique_visitors: 892,
      leads_captured: 156,
      avg_response_time_ms: 1200,
      avg_satisfaction: 4.2,
      ai_cost_usd: 45.67,
    },
    trends: {
      conversations_change: 12,
      leads_change: 8,
      response_time_change: -15,
    },
    top_topics: [
      { topic: 'Azure Certifications', count: 234 },
      { topic: 'AWS Training', count: 189 },
      { topic: 'Power BI', count: 145 },
      { topic: 'Pricing Inquiries', count: 132 },
      { topic: 'Course Schedule', count: 98 },
    ],
    top_courses: [
      { course: 'AZ-104: Azure Administrator', count: 156 },
      { course: 'PL-300: Power BI Data Analyst', count: 134 },
      { course: 'AWS Solutions Architect', count: 112 },
      { course: 'AZ-900: Azure Fundamentals', count: 98 },
      { course: 'SC-200: Security Operations', count: 76 },
    ],
    daily_stats: [
      { date: '2024-01-01', conversations: 145, leads: 18 },
      { date: '2024-01-02', conversations: 167, leads: 22 },
      { date: '2024-01-03', conversations: 189, leads: 25 },
      { date: '2024-01-04', conversations: 156, leads: 19 },
      { date: '2024-01-05', conversations: 178, leads: 24 },
      { date: '2024-01-06', conversations: 201, leads: 28 },
      { date: '2024-01-07', conversations: 211, leads: 20 },
    ],
  };

  const displayData = data || mockData;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Analytics"
        description="Chat performance and insights"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Conversations"
            value={displayData.overview.total_conversations.toLocaleString()}
            change={{
              value: displayData.trends.conversations_change,
              type: displayData.trends.conversations_change >= 0 ? 'increase' : 'decrease',
            }}
            icon={MessageSquare}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Leads Captured"
            value={displayData.overview.leads_captured}
            change={{
              value: displayData.trends.leads_change,
              type: displayData.trends.leads_change >= 0 ? 'increase' : 'decrease',
            }}
            icon={UserCheck}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Avg Response Time"
            value={`${(displayData.overview.avg_response_time_ms / 1000).toFixed(1)}s`}
            change={{
              value: Math.abs(displayData.trends.response_time_change),
              type: displayData.trends.response_time_change <= 0 ? 'increase' : 'decrease',
            }}
            icon={Clock}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Satisfaction Rating"
            value={displayData.overview.avg_satisfaction.toFixed(1)}
            icon={Star}
            iconColor="text-yellow-500"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Unique Visitors"
            value={displayData.overview.unique_visitors.toLocaleString()}
            icon={Users}
            iconColor="text-indigo-600"
          />
          <StatsCard
            title="Total Messages"
            value={displayData.overview.total_messages.toLocaleString()}
            icon={MessageSquare}
            iconColor="text-slate-600"
          />
          <StatsCard
            title="AI Cost (Period)"
            value={`$${displayData.overview.ai_cost_usd.toFixed(2)}`}
            icon={DollarSign}
            iconColor="text-emerald-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {displayData.daily_stats.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{
                        height: `${(day.conversations / 250) * 200}px`,
                      }}
                    >
                      <div
                        className="w-full bg-primary rounded-t transition-all"
                        style={{
                          height: `${(day.conversations / 250) * 200}px`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    label: 'Visitors',
                    value: displayData.overview.unique_visitors,
                    percent: 100,
                  },
                  {
                    label: 'Started Chat',
                    value: displayData.overview.total_conversations,
                    percent: Math.round(
                      (displayData.overview.total_conversations /
                        displayData.overview.unique_visitors) *
                        100
                    ),
                  },
                  {
                    label: 'Leads Captured',
                    value: displayData.overview.leads_captured,
                    percent: Math.round(
                      (displayData.overview.leads_captured /
                        displayData.overview.unique_visitors) *
                        100
                    ),
                  },
                ].map((stage, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{stage.label}</span>
                      <span className="font-medium">
                        {stage.value.toLocaleString()} ({stage.percent}%)
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${stage.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Topics and Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Topics Asked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayData.top_topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm">{topic.topic}</span>
                    </div>
                    <span className="text-sm font-medium">{topic.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Most Asked About Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayData.top_courses.map((course, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm truncate max-w-[200px]">{course.course}</span>
                    </div>
                    <span className="text-sm font-medium">{course.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
