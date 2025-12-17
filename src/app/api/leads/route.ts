import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      conversation_id,
      visitor_id,
      interested_courses = [],
      source_page,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if lead already exists with this email
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingLead) {
      // Update existing lead
      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update({
          name,
          phone,
          company,
          conversation_id,
          interested_courses,
          source_page,
          utm_source,
          utm_medium,
          utm_campaign,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) {
        console.error('Lead update error:', error);
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
      }

      return NextResponse.json({ data: updatedLead, updated: true });
    }

    // Create new lead
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        id: uuidv4(),
        name,
        email,
        phone,
        company,
        visitor_id,
        conversation_id,
        interested_courses,
        source_page,
        utm_source,
        utm_medium,
        utm_campaign,
        status: 'new',
        lead_score: calculateLeadScore({ name, email, phone, company, interested_courses }),
      })
      .select()
      .single();

    if (error) {
      console.error('Lead creation error:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    // Update conversation with lead info if conversation_id provided
    if (conversation_id) {
      await supabase
        .from('conversations')
        .update({
          lead_captured: true,
          lead_id: newLead.id,
        })
        .eq('id', conversation_id);
    }

    // Update visitor with lead info if visitor_id provided
    if (visitor_id) {
      await supabase
        .from('visitors')
        .update({
          name,
          email,
          phone,
          company,
        })
        .eq('id', visitor_id);
    }

    // TODO: Trigger CRM webhook here
    // await triggerCRMWebhook(newLead);

    return NextResponse.json({ data: newLead, created: true });
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    let query = supabase
      .from('leads')
      .select('*, visitor:visitors(*), conversation:conversations(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Leads fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
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
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateLeadScore(lead: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interested_courses?: { id: string }[];
}): number {
  let score = 0;

  // Basic info
  if (lead.name) score += 10;
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 15;

  // Email domain scoring
  if (lead.email) {
    const domain = lead.email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      score += 20; // Corporate email
    }
  }

  // Course interest
  if (lead.interested_courses && lead.interested_courses.length > 0) {
    score += Math.min(lead.interested_courses.length * 10, 30);
  }

  return Math.min(score, 100);
}
