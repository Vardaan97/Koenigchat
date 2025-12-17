'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { LeadCaptureForm } from './lead-capture-form';
import { cn } from '@/lib/utils/cn';
import type { Message, PageContext, WidgetSettings } from '@/types';

interface ChatWindowProps {
  config?: Partial<WidgetSettings>;
  pageContext?: PageContext;
  onClose?: () => void;
  onMinimize?: () => void;
  className?: string;
  apiEndpoint?: string;
}

export function ChatWindow({
  config = {},
  pageContext,
  onClose,
  onMinimize,
  className,
  apiEndpoint = '/api/chat/message',
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const {
    greeting = 'Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?',
    agentName = 'Koenig Assistant',
    companyName = 'Koenig Solutions',
    placeholder = 'Type your message...',
    collectEmail = true,
  } = config;

  // Initialize visitor and show greeting
  useEffect(() => {
    // Get or create visitor ID from localStorage
    let storedVisitorId = localStorage.getItem('koenig_visitor_id');
    if (!storedVisitorId) {
      storedVisitorId = uuidv4();
      localStorage.setItem('koenig_visitor_id', storedVisitorId);
    }
    setVisitorId(storedVisitorId);

    // Show greeting message
    const greetingMessage: Message = {
      id: uuidv4(),
      conversation_id: '',
      role: 'assistant',
      content: greeting,
      content_type: 'text',
      sources_used: [],
      flagged: false,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages([greetingMessage]);
  }, [greeting]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!visitorId) return;

      // Add user message to UI immediately
      const userMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId || '',
        role: 'visitor',
        content,
        content_type: 'text',
        sources_used: [],
        flagged: false,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            visitor_id: visitorId,
            message: content,
            page_context: pageContext,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        // Update conversation ID if new
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id);
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: data.message?.id || uuidv4(),
          conversation_id: data.conversation_id,
          role: 'assistant',
          content: data.message?.content || 'I apologize, but I encountered an issue. Please try again.',
          content_type: 'text',
          model_used: data.message?.model_used,
          sources_used: data.message?.sources_used || [],
          flagged: false,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Check if we should show lead capture form
        if (collectEmail && !leadCaptured && data.lead_ready && messages.length >= 4) {
          setTimeout(() => setShowLeadForm(true), 1000);
        }
      } catch (error) {
        console.error('Chat error:', error);

        // Add error message
        const errorMessage: Message = {
          id: uuidv4(),
          conversation_id: conversationId || '',
          role: 'assistant',
          content: 'Sorry, I encountered a connection issue. Please try again in a moment.',
          content_type: 'text',
          sources_used: [],
          flagged: false,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, visitorId, pageContext, apiEndpoint, collectEmail, leadCaptured, messages.length]
  );

  const handleLeadSubmit = async (data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  }) => {
    setIsSubmittingLead(true);

    try {
      await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          conversation_id: conversationId,
          visitor_id: visitorId,
        }),
      });

      setLeadCaptured(true);
      setShowLeadForm(false);

      // Add thank you message
      const thankYouMessage: Message = {
        id: uuidv4(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: `Thanks ${data.name}! I've noted your details. Our training advisor will reach out to you soon. Meanwhile, feel free to continue exploring courses with me!`,
        content_type: 'text',
        sources_used: [],
        flagged: false,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, thankYouMessage]);
    } catch (error) {
      console.error('Lead capture error:', error);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-background rounded-xl shadow-2xl border overflow-hidden',
        'w-[380px] h-[600px] max-h-[80vh]',
        className
      )}
    >
      <ChatHeader
        companyName={companyName}
        agentName={agentName}
        status="online"
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          agentName={agentName}
          className="h-full"
        />
      </div>

      {showLeadForm && !leadCaptured ? (
        <LeadCaptureForm
          onSubmit={handleLeadSubmit}
          onSkip={() => setShowLeadForm(false)}
          isLoading={isSubmittingLead}
          className="border-t"
        />
      ) : (
        <ChatInput
          onSend={sendMessage}
          disabled={isTyping}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
