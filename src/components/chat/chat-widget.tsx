'use client';

import { useState, useEffect } from 'react';
import { ChatWindow } from './chat-window';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { MessageCircle, X } from 'lucide-react';
import type { PageContext, WidgetSettings } from '@/types';

interface ChatWidgetProps {
  config?: Partial<WidgetSettings>;
  pageContext?: PageContext;
  className?: string;
}

export function ChatWidget({ config = {}, pageContext, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { position = 'bottom-right', primaryColor = '#0066CC' } = config;

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open after delay (optional)
  useEffect(() => {
    if (mounted) {
      const hasOpenedBefore = sessionStorage.getItem('koenig_chat_opened');
      if (!hasOpenedBefore) {
        // Show notification dot after 5 seconds
        const timer = setTimeout(() => {
          setHasNewMessage(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [mounted]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMessage(false);
    sessionStorage.setItem('koenig_chat_opened', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  if (!mounted) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn('fixed z-50', positionClasses[position], className)}
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="mb-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <ChatWindow
            config={config}
            pageContext={pageContext}
            onClose={handleClose}
            onMinimize={handleMinimize}
          />
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={isOpen ? handleClose : handleOpen}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          'hover:scale-105 transition-transform duration-200',
          'bg-primary hover:bg-primary/90'
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </>
        )}
        <span className="sr-only">{isOpen ? 'Close chat' : 'Open chat'}</span>
      </Button>

      {/* Minimized indicator */}
      {isMinimized && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background border rounded-full px-3 py-1 shadow-md cursor-pointer"
          onClick={handleOpen}
        >
          <span className="text-xs font-medium">Chat minimized</span>
        </div>
      )}
    </div>
  );
}
