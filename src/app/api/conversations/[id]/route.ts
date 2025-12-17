import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        visitor:visitors(*),
        lead:leads(*),
        assigned_operator:users(*),
        messages(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Conversation fetch error:', error);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Sort messages by created_at
    if (data.messages) {
      data.messages.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('conversations')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Conversation update error:', error);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
