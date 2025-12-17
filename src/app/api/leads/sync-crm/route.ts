import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lead, CRMWebhookPayload } from '@/types';

// CRM Webhook endpoint for syncing leads
// This can be called manually or triggered after lead creation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, webhook_url, force = false } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, conversation:conversations(*, messages(*))')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if already synced (unless force)
    if (lead.crm_synced && !force) {
      return NextResponse.json({
        data: { synced: false, reason: 'Already synced', crm_id: lead.crm_id },
      });
    }

    // Get webhook URL from environment if not provided
    const targetWebhook = webhook_url || process.env.CRM_WEBHOOK_URL;

    if (!targetWebhook) {
      // If no webhook configured, mark as synced but log
      console.log('No CRM webhook configured, skipping sync for lead:', lead_id);
      return NextResponse.json({
        data: { synced: false, reason: 'No CRM webhook configured' },
      });
    }

    // Prepare conversation summary
    const conversationSummary = lead.conversation?.messages
      ? summarizeConversation(lead.conversation.messages)
      : undefined;

    // Prepare webhook payload
    const payload: CRMWebhookPayload = {
      event: lead.crm_synced ? 'lead.updated' : 'lead.created',
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        interested_courses: lead.interested_courses,
        interested_learning_paths: lead.interested_learning_paths,
        budget_range: lead.budget_range,
        timeline: lead.timeline,
        lead_score: lead.lead_score,
        status: lead.status,
        source_page: lead.source_page,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        notes: lead.notes,
        crm_synced: false,
        visitor_id: lead.visitor_id,
        conversation_id: lead.conversation_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      },
      conversation_summary: conversationSummary,
      timestamp: new Date().toISOString(),
    };

    // Send to CRM webhook
    const response = await fetch(targetWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.CRM_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Update lead with error
      await supabase
        .from('leads')
        .update({
          crm_sync_error: `HTTP ${response.status}: ${errorText}`,
        })
        .eq('id', lead_id);

      return NextResponse.json(
        { error: 'CRM webhook failed', details: errorText },
        { status: 502 }
      );
    }

    // Parse CRM response (expecting { crm_id: string })
    let crmResponse: { crm_id?: string } = {};
    try {
      crmResponse = await response.json();
    } catch {
      // CRM might not return JSON
    }

    // Update lead as synced
    await supabase
      .from('leads')
      .update({
        crm_synced: true,
        crm_id: crmResponse.crm_id || null,
        crm_synced_at: new Date().toISOString(),
        crm_sync_error: null,
      })
      .eq('id', lead_id);

    return NextResponse.json({
      data: {
        synced: true,
        crm_id: crmResponse.crm_id,
      },
    });
  } catch (error) {
    console.error('CRM sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch sync unsycned leads
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get unsynced leads
    const { data: unsyncedLeads, error } = await supabase
      .from('leads')
      .select('id')
      .eq('crm_synced', false)
      .limit(100);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!unsyncedLeads || unsyncedLeads.length === 0) {
      return NextResponse.json({ data: { synced: 0, message: 'No leads to sync' } });
    }

    // Sync each lead
    const results = await Promise.allSettled(
      unsyncedLeads.map((lead) =>
        fetch(`${request.nextUrl.origin}/api/leads/sync-crm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id }),
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      data: {
        synced: successful,
        failed,
        total: unsyncedLeads.length,
      },
    });
  } catch (error) {
    console.error('Batch CRM sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function summarizeConversation(
  messages: { role: string; content: string; created_at: string }[]
): string {
  // Create a brief summary of the conversation
  const visitorMessages = messages.filter((m) => m.role === 'visitor');
  const topics: string[] = [];

  // Extract key topics from visitor messages
  const techKeywords = [
    'Azure',
    'AWS',
    'Microsoft',
    'Cisco',
    'Oracle',
    'Google Cloud',
    'Power BI',
    'Python',
    'Java',
    'DevOps',
    'Security',
    'AI',
    'Machine Learning',
    'Data',
    'Cloud',
    'Kubernetes',
    'Docker',
  ];

  visitorMessages.forEach((m) => {
    techKeywords.forEach((keyword) => {
      if (m.content.toLowerCase().includes(keyword.toLowerCase()) && !topics.includes(keyword)) {
        topics.push(keyword);
      }
    });
  });

  const summary = [
    `Conversation started: ${new Date(messages[0]?.created_at).toLocaleString()}`,
    `Total messages: ${messages.length}`,
    topics.length > 0 ? `Topics discussed: ${topics.join(', ')}` : '',
    visitorMessages.length > 0 ? `First inquiry: "${visitorMessages[0].content.slice(0, 100)}..."` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return summary;
}
