import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const supabase = createAdminClient();

    let query = supabase
      .from('conversations')
      .select(
        `
        *,
        visitor:visitors(*),
        lead:leads(*),
        assigned_operator:users(*),
        messages(*)
      `,
        { count: 'exact' }
      )
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Filter by status (can be comma-separated)
    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }

    // Search by visitor email or conversation content
    if (search) {
      // This is a simplified search - in production, use full-text search
      query = query.or(`visitor.email.ilike.%${search}%,visitor.name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
