'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LiveChatCard } from '@/components/dashboard/live-chat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import type { Conversation } from '@/types';

export default function LiveMonitorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'escalated'>('all');

  // Fetch live conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations?status=active,waiting,escalated');
      const data = await response.json();
      setConversations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    filter === 'all' ? true : c.status === filter
  );

  // Stats
  const activeCount = conversations.filter((c) => c.status === 'active').length;
  const waitingCount = conversations.filter((c) => c.status === 'waiting').length;
  const avgResponseTime = conversations.length > 0
    ? Math.round(
        conversations.reduce((acc, c) => acc + (c.avg_response_time_ms || 0), 0) /
          conversations.length / 1000
      )
    : 0;

  const handleTakeover = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, action: 'takeover' }),
      });
      fetchConversations();
    } catch (error) {
      console.error('Takeover failed:', error);
    }
  };

  const handleViewConversation = (conversationId: string) => {
    window.location.href = `/conversations/${conversationId}`;
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Live Monitor"
        description="Real-time view of active conversations"
        actions={
          <Button onClick={fetchConversations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Active Chats"
            value={activeCount}
            icon={MessageSquare}
            iconColor="text-green-600"
          />
          <StatsCard
            title="Waiting for Response"
            value={waitingCount}
            icon={Clock}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Avg Response Time"
            value={`${avgResponseTime}s`}
            icon={CheckCircle}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Online Agents"
            value="1"
            icon={Users}
            iconColor="text-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          {(['all', 'active', 'waiting', 'escalated'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {conversations.filter((c) => c.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Conversations Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No active conversations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              New chats will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map((conversation) => (
              <LiveChatCard
                key={conversation.id}
                conversation={conversation}
                onTakeover={handleTakeover}
                onView={handleViewConversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
