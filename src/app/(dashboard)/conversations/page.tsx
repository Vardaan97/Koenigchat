'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, MessageSquare, Calendar, Clock, User, Bot } from 'lucide-react';
import type { Conversation } from '@/types';

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/conversations?${params}`);
      const data = await response.json();

      setConversations(data.data || []);
      setPagination((prev) => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter, pagination.offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchConversations();
  };

  const handleExport = async () => {
    // Export conversations as CSV
    const headers = ['ID', 'Visitor', 'Status', 'Messages', 'Started', 'Duration', 'Lead Captured'];
    const rows = conversations.map((c) => [
      c.id,
      c.visitor?.email || c.visitor?.name || 'Anonymous',
      c.status,
      c.message_count,
      format(new Date(c.started_at), 'yyyy-MM-dd HH:mm'),
      c.ended_at
        ? `${Math.round((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 60000)} min`
        : 'Ongoing',
      c.lead_captured ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const statusColors = {
    active: 'success',
    waiting: 'warning',
    escalated: 'destructive',
    closed: 'secondary',
  } as const;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Conversation Logs"
        description="View and search all chat conversations"
        actions={
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by visitor email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversations Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No conversations found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Visitor</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Messages</div>
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-1">Lead</div>
            </div>

            {/* Table Rows */}
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/conversations/${conversation.id}`)}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Visitor */}
                    <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {conversation.visitor?.name ||
                            conversation.visitor?.email ||
                            `Visitor ${conversation.id.slice(0, 8)}`}
                        </p>
                        {conversation.visitor?.email && conversation.visitor?.name && (
                          <p className="text-xs text-muted-foreground">
                            {conversation.visitor.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColors[conversation.status]}>
                          {conversation.status}
                        </Badge>
                        {conversation.is_bot_handling ? (
                          <Bot className="h-4 w-4 text-muted-foreground" title="AI handling" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" title="Human agent" />
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-1 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>{conversation.message_count}</span>
                      </div>
                    </div>

                    {/* Started */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(conversation.started_at), 'MMM d, HH:mm')}</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {conversation.ended_at
                            ? `${Math.round((new Date(conversation.ended_at).getTime() - new Date(conversation.started_at).getTime()) / 60000)} min`
                            : 'Ongoing'}
                        </span>
                      </div>
                    </div>

                    {/* Lead */}
                    <div className="col-span-12 md:col-span-1">
                      {conversation.lead_captured && (
                        <Badge variant="success" className="text-xs">
                          Lead
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1}-
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total} conversations
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset === 0}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      offset: Math.max(0, prev.offset - prev.limit),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      offset: prev.offset + prev.limit,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
