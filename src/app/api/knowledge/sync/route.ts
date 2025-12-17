import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const supabase = createAdminClient();

    // This endpoint triggers a sync with external data sources
    // For now, it just updates the last_sync timestamp
    // In production, this would:
    // 1. Fetch latest course data from your database/API
    // 2. Update or insert courses
    // 3. Regenerate embeddings for changed courses

    // Update sync log
    await supabase.from('sync_log').insert({
      sync_type: 'manual',
      status: 'completed',
      items_processed: 0,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      data: { synced: true, timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { data: null, error: 'Sync failed' },
      { status: 500 }
    );
  }
}
