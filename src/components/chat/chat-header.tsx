'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Bot } from 'lucide-react';

interface ChatHeaderProps {
  companyName?: string;
  agentName?: string;
  status?: 'online' | 'offline' | 'busy';
  onClose?: () => void;
  onMinimize?: () => void;
}

export function ChatHeader({
  companyName = 'Koenig Solutions',
  agentName = 'Koenig Assistant',
  status = 'online',
  onClose,
  onMinimize,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-xl">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
          <AvatarImage src="/koenig-avatar.png" alt={agentName} />
          <AvatarFallback className="bg-white/20 text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div>
          <h3 className="font-semibold text-sm">{agentName}</h3>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'online'
                  ? 'bg-green-400'
                  : status === 'busy'
                    ? 'bg-yellow-400'
                    : 'bg-gray-400'
              }`}
            />
            <span className="text-xs text-primary-foreground/80">
              {status === 'online'
                ? 'Online'
                : status === 'busy'
                  ? 'Busy'
                  : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onMinimize && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="h-8 w-8 text-primary-foreground hover:bg-white/10"
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-primary-foreground hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </div>
  );
}
