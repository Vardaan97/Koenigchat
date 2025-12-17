import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, action, operator_id } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get current conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (action === 'takeover') {
      // Human takes over from AI
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          is_bot_handling: false,
          assigned_operator_id: operator_id || null,
          escalated_at: new Date().toISOString(),
          escalation_reason: 'Manual takeover by operator',
        })
        .eq('id', conversation_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to takeover conversation' }, { status: 500 });
      }

      // Add system message
      await supabase.from('messages').insert({
        id: uuidv4(),
        conversation_id,
        role: 'system',
        content: 'A human agent has joined the conversation.',
        content_type: 'text',
      });

      return NextResponse.json({ data: { action: 'takeover', success: true } });
    }

    if (action === 'release') {
      // Release back to AI
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          is_bot_handling: true,
          assigned_operator_id: null,
        })
        .eq('id', conversation_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to release conversation' }, { status: 500 });
      }

      // Add system message
      await supabase.from('messages').insert({
        id: uuidv4(),
        conversation_id,
        role: 'system',
        content: 'The conversation has been returned to AI assistance.',
        content_type: 'text',
      });

      return NextResponse.json({ data: { action: 'release', success: true } });
    }

    if (action === 'close') {
      // Close conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          status: 'closed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', conversation_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to close conversation' }, { status: 500 });
      }

      return NextResponse.json({ data: { action: 'close', success: true } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Handoff API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
