'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Header } from '@/components/dashboard/header';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Globe,
  Clock,
  MessageSquare,
  Star,
  Flag,
  Bot,
  Send,
} from 'lucide-react';
import type { Conversation, Message } from '@/types';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();
      setConversation(data.data);
      setIsTakenOver(!data.data?.is_bot_handling);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchConversation, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleTakeover = async () => {
    try {
      await fetch('/api/chat/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, action: 'takeover' }),
      });
      setIsTakenOver(true);
      fetchConversation();
    } catch (error) {
      console.error('Takeover failed:', error);
    }
  };

  const handleRelease = async () => {
    try {
      await fetch('/api/chat/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, action: 'release' }),
      });
      setIsTakenOver(false);
      fetchConversation();
    } catch (error) {
      console.error('Release failed:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setSending(true);

    try {
      await fetch('/api/chat/operator-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          content,
        }),
      });
      fetchConversation();
    } catch (error) {
      console.error('Send message failed:', error);
    } finally {
      setSending(false);
    }
  };

  const handleRateMessage = async (messageId: string, rating: number) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, rating }),
      });
      fetchConversation();
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  const handleFlagMessage = async (messageId: string, reason: string) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, flagged: true, flag_reason: reason }),
      });
      fetchConversation();
    } catch (error) {
      console.error('Flagging failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg font-medium">Conversation not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const statusColors = {
    active: 'success',
    waiting: 'warning',
    escalated: 'destructive',
    closed: 'secondary',
  } as const;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Conversation Details"
        actions={
          <div className="flex items-center gap-2">
            {conversation.is_bot_handling ? (
              <Button onClick={handleTakeover} variant="default">
                <User className="h-4 w-4 mr-2" />
                Take Over
              </Button>
            ) : (
              <Button onClick={handleRelease} variant="outline">
                <Bot className="h-4 w-4 mr-2" />
                Release to AI
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col border-r">
          {/* Back button and status */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to list
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant={statusColors[conversation.status]}>
                {conversation.status}
              </Badge>
              {conversation.is_bot_handling ? (
                <Badge variant="outline">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Handling
                </Badge>
              ) : (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  Human Agent
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden bg-slate-50">
            <ChatMessages
              messages={conversation.messages || []}
              className="h-full"
              showAvatar={true}
            />
          </div>

          {/* Input (only if taken over) */}
          {isTakenOver && conversation.status !== 'closed' && (
            <ChatInput
              onSend={handleSendMessage}
              disabled={sending}
              placeholder="Type your response as an operator..."
            />
          )}
        </div>

        {/* Sidebar - Visitor Info & Message Rating */}
        <div className="w-80 flex flex-col bg-white overflow-y-auto">
          {/* Visitor Info */}
          <Card className="m-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visitor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversation.visitor?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.visitor.name}</span>
                </div>
              )}
              {conversation.visitor?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.visitor.email}</span>
                </div>
              )}
              {conversation.visitor?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.visitor.phone}</span>
                </div>
              )}
              {conversation.visitor?.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{conversation.visitor.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{conversation.source_url || 'Unknown page'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(conversation.started_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>{conversation.message_count} messages</span>
              </div>
            </CardContent>
          </Card>

          {/* Lead Info */}
          {conversation.lead && (
            <Card className="mx-4 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Lead Captured
                  <Badge variant="success" className="text-xs">
                    Score: {conversation.lead.lead_score}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{conversation.lead.name}</p>
                <p className="text-sm text-muted-foreground">{conversation.lead.email}</p>
                {conversation.lead.interested_courses?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Interested in:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {conversation.lead.interested_courses.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {c.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Message Rating Section */}
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rate AI Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {conversation.messages
                ?.filter((m) => m.role === 'assistant')
                .slice(-5)
                .map((message) => (
                  <div key={message.id} className="border-b pb-2 last:border-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRateMessage(message.id, star)}
                          className={`p-1 hover:bg-slate-100 rounded ${
                            message.rating && message.rating >= star
                              ? 'text-yellow-500'
                              : 'text-slate-300'
                          }`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      ))}
                      <button
                        onClick={() => handleFlagMessage(message.id, 'Needs improvement')}
                        className={`p-1 hover:bg-slate-100 rounded ml-auto ${
                          message.flagged ? 'text-red-500' : 'text-slate-300'
                        }`}
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
