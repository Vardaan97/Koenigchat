import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message_id,
      rating,
      flagged,
      flag_reason,
      suggested_response,
      reviewed_by,
    } = body;

    if (!message_id) {
      return NextResponse.json({ error: 'message_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      reviewed_at: new Date().toISOString(),
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (flagged !== undefined) {
      updateData.flagged = flagged;
    }

    if (flag_reason !== undefined) {
      updateData.flag_reason = flag_reason;
    }

    if (suggested_response !== undefined) {
      updateData.suggested_response = suggested_response;
    }

    if (reviewed_by !== undefined) {
      updateData.reviewed_by = reviewed_by;
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', message_id)
      .select()
      .single();

    if (error) {
      console.error('Message feedback error:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    // If flagged, also create a training example for review
    if (flagged && data) {
      // Get the previous user message for context
      const { data: conversation } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('conversation_id', data.conversation_id)
        .lt('created_at', data.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (conversation && conversation.role === 'visitor') {
        await supabase.from('ai_training_examples').insert({
          message_id,
          user_input: conversation.content,
          original_response: data.content,
          improved_response: suggested_response || null,
          quality_rating: rating || null,
          feedback_notes: flag_reason || null,
          is_approved: false,
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get feedback stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const supabase = createAdminClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get average rating
    const { data: ratingStats } = await supabase
      .from('messages')
      .select('rating')
      .eq('role', 'assistant')
      .not('rating', 'is', null)
      .gte('created_at', startDate.toISOString());

    const avgRating =
      ratingStats && ratingStats.length > 0
        ? ratingStats.reduce((acc, m) => acc + (m.rating || 0), 0) / ratingStats.length
        : 0;

    // Get flagged count
    const { count: flaggedCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('flagged', true)
      .gte('created_at', startDate.toISOString());

    // Get unreviewed count
    const { count: unreviewedCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assistant')
      .is('rating', null)
      .gte('created_at', startDate.toISOString());

    return NextResponse.json({
      data: {
        avg_rating: Math.round(avgRating * 10) / 10,
        flagged_count: flaggedCount || 0,
        unreviewed_count: unreviewedCount || 0,
        period_days: days,
      },
    });
  } catch (error) {
    console.error('Feedback stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
