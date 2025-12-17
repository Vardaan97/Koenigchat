import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const vendor = searchParams.get('vendor');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    let query = supabase
      .from('kb_courses')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,course_code.ilike.%${search}%,vendor.ilike.%${search}%,certification.ilike.%${search}%`
      );
    }

    if (vendor) {
      query = query.eq('vendor', vendor);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Courses fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
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
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Upsert course data (for sync operations)
    const { data, error } = await supabase
      .from('kb_courses')
      .upsert(body, { onConflict: 'source_id' })
      .select()
      .single();

    if (error) {
      console.error('Course upsert error:', error);
      return NextResponse.json({ error: 'Failed to save course' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
