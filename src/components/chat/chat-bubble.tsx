'use client';

import { cn } from '@/lib/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean;
  agentName?: string;
}

export function ChatBubble({ message, showAvatar = true, agentName = 'Koenig Assistant' }: ChatBubbleProps) {
  const isVisitor = message.role === 'visitor';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2 mb-4',
        isVisitor ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          {isVisitor ? (
            <>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/koenig-avatar.png" alt={agentName} />
              <AvatarFallback className="bg-blue-600 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isVisitor
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        {!isVisitor && (
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {message.role === 'operator' ? 'Support Agent' : agentName}
          </p>
        )}
        <div className="text-sm whitespace-pre-wrap break-words">
          {formatMessageContent(message.content)}
        </div>
        <p
          className={cn(
            'text-[10px] mt-1',
            isVisitor ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatMessageContent(content: string): React.ReactNode {
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
