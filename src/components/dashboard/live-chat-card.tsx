'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { MessageSquare, Clock, Globe, Bot, User, ArrowRight } from 'lucide-react';
import type { Conversation } from '@/types';

interface LiveChatCardProps {
  conversation: Conversation;
  onTakeover?: (id: string) => void;
  onView?: (id: string) => void;
}

export function LiveChatCard({ conversation, onTakeover, onView }: LiveChatCardProps) {
  const { visitor, status, is_bot_handling, message_count, source_url, started_at, last_message_at } =
    conversation;

  const statusColors = {
    active: 'success',
    waiting: 'warning',
    escalated: 'destructive',
    closed: 'secondary',
  } as const;

  const lastMessageTime = last_message_at
    ? formatDistanceToNow(new Date(last_message_at), { addSuffix: true })
    : 'No messages yet';

  // Extract page name from URL
  const pageName = source_url
    ? source_url.replace(/^https?:\/\/[^/]+/, '').split('?')[0] || '/'
    : 'Unknown';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(conversation.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-100 text-slate-600">
                {visitor?.name?.charAt(0) || visitor?.email?.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {visitor?.name || visitor?.email || `Visitor ${conversation.id.slice(0, 8)}`}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{pageName}</span>
              </div>
            </div>
          </div>

          <Badge variant={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{message_count} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{lastMessageTime}</span>
          </div>
          <div className="flex items-center gap-1">
            {is_bot_handling ? (
              <>
                <Bot className="h-3 w-3" />
                <span>AI handling</span>
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                <span>Human agent</span>
              </>
            )}
          </div>
        </div>

        {/* Last message preview */}
        {conversation.messages && conversation.messages.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-2 mb-3">
            <p className="text-xs text-slate-500 mb-1">
              {conversation.messages[conversation.messages.length - 1].role === 'visitor'
                ? 'Visitor:'
                : 'Assistant:'}
            </p>
            <p className="text-sm text-slate-700 line-clamp-2">
              {conversation.messages[conversation.messages.length - 1].content}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {is_bot_handling && status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onTakeover?.(conversation.id);
              }}
            >
              Take Over
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto">
            View Chat
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
