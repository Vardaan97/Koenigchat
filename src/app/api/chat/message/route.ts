import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateChatResponse, extractLeadInfo } from '@/lib/ai/orchestrator';
import type { Message, ChatRequest, ChatResponse, PageContext } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { conversation_id, visitor_id, message, page_context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const startTime = Date.now();

    // Get or create visitor
    let visitorData = { id: visitor_id || uuidv4() };

    if (visitor_id) {
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('id')
        .eq('id', visitor_id)
        .single();

      if (!existingVisitor) {
        // Create new visitor
        const { data: newVisitor } = await supabase
          .from('visitors')
          .insert({ id: visitor_id })
          .select()
          .single();

        if (newVisitor) {
          visitorData = newVisitor;
        }
      }
    } else {
      // Create anonymous visitor
      const { data: newVisitor } = await supabase
        .from('visitors')
        .insert({ id: uuidv4() })
        .select()
        .single();

      if (newVisitor) {
        visitorData = newVisitor;
      }
    }

    // Get or create conversation
    let currentConversationId = conversation_id;
    let conversationMessages: Message[] = [];

    if (conversation_id) {
      // Fetch existing conversation messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true });

      conversationMessages = messages || [];
    } else {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          visitor_id: visitorData.id,
          source_url: page_context?.url,
          source_page_title: page_context?.title,
          status: 'active',
        })
        .select()
        .single();

      if (newConversation) {
        currentConversationId = newConversation.id;
      }
    }

    if (!currentConversationId) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // Save user message
    const userMessageId = uuidv4();
    await supabase.from('messages').insert({
      id: userMessageId,
      conversation_id: currentConversationId,
      role: 'visitor',
      content: message,
      content_type: 'text',
    });

    // Generate AI response
    const aiResponse = await generateChatResponse(message, {
      messages: conversationMessages,
      page_context: page_context,
      collected_info: extractLeadInfo([...conversationMessages, { content: message } as Message]),
    });

    // Save assistant message
    const assistantMessageId = uuidv4();
    const assistantMessage = {
      id: assistantMessageId,
      conversation_id: currentConversationId,
      role: 'assistant' as const,
      content: aiResponse.content,
      content_type: 'text',
      model_used: aiResponse.model,
      tokens_input: aiResponse.tokens_input,
      tokens_output: aiResponse.tokens_output,
      response_time_ms: aiResponse.response_time_ms,
      sources_used: aiResponse.sources,
    };

    await supabase.from('messages').insert(assistantMessage);

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', currentConversationId);

    const response: ChatResponse = {
      conversation_id: currentConversationId,
      message: {
        id: assistantMessageId,
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse.content,
        content_type: 'text',
        model_used: aiResponse.model,
        response_time_ms: aiResponse.response_time_ms,
        sources_used: aiResponse.sources,
        flagged: false,
        metadata: {},
        created_at: new Date().toISOString(),
      },
    };

    // Add lead_ready flag if detected
    if (aiResponse.lead_ready) {
      (response as ChatResponse & { lead_ready?: boolean }).lead_ready = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
