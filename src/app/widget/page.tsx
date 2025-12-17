'use client';

import { ChatWidget } from '@/components/chat/chat-widget';

// This page serves the widget in an iframe for embedding
export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <ChatWidget
        config={{
          position: 'bottom-right',
          primaryColor: '#0066CC',
          greeting: 'Hi! Welcome to Koenig Solutions. How can I help you find the right IT training course today?',
          agentName: 'Koenig Assistant',
          companyName: 'Koenig Solutions',
          placeholder: 'Type your message...',
          collectEmail: true,
        }}
        pageContext={{
          url: typeof window !== 'undefined' ? window.location.href : '',
          title: typeof document !== 'undefined' ? document.title : '',
        }}
      />
    </div>
  );
}
