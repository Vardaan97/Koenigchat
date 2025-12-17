'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubble } from './chat-bubble';
import { TypingIndicator } from './typing-indicator';
import type { Message } from '@/types';

interface ChatMessagesProps {
  messages: Message[];
  isTyping?: boolean;
  showAvatar?: boolean;
  agentName?: string;
  className?: string;
}

export function ChatMessages({
  messages,
  isTyping = false,
  showAvatar = true,
  agentName,
  className,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <ScrollArea className={className}>
      <div ref={scrollRef} className="flex flex-col p-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            showAvatar={showAvatar}
            agentName={agentName}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
