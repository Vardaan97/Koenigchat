import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const supabase = createAdminClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStartDateStr = prevStartDate.toISOString();

    // Get current period stats
    const [
      conversationsResult,
      messagesResult,
      leadsResult,
      visitorsResult,
      ratingsResult,
      prevConversationsResult,
      prevLeadsResult,
    ] = await Promise.all([
      // Current period conversations
      supabase
        .from('conversations')
        .select('id, avg_response_time_ms', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Current period messages
      supabase
        .from('messages')
        .select('tokens_input, tokens_output', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Current period leads
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', startDateStr),

      // Unique visitors
      supabase
        .from('conversations')
        .select('visitor_id')
        .gte('created_at', startDateStr),

      // Ratings
      supabase
        .from('messages')
        .select('rating')
        .eq('role', 'assistant')
        .not('rating', 'is', null)
        .gte('created_at', startDateStr),

      // Previous period conversations for comparison
      supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .gte('created_at', prevStartDateStr)
        .lt('created_at', startDateStr),

      // Previous period leads
      supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .gte('created_at', prevStartDateStr)
        .lt('created_at', startDateStr),
    ]);

    // Calculate stats
    const currentConversations = conversationsResult.count || 0;
    const prevConversations = prevConversationsResult.count || 0;
    const currentLeads = leadsResult.count || 0;
    const prevLeads = prevLeadsResult.count || 0;

    const avgResponseTime =
      conversationsResult.data && conversationsResult.data.length > 0
        ? conversationsResult.data.reduce((acc, c) => acc + (c.avg_response_time_ms || 0), 0) /
          conversationsResult.data.length
        : 0;

    const avgSatisfaction =
      ratingsResult.data && ratingsResult.data.length > 0
        ? ratingsResult.data.reduce((acc, r) => acc + (r.rating || 0), 0) / ratingsResult.data.length
        : 0;

    // Unique visitors count
    const uniqueVisitors = new Set(visitorsResult.data?.map((v) => v.visitor_id) || []).size;

    // Calculate AI cost (rough estimate)
    const totalTokens = messagesResult.data?.reduce(
      (acc, m) => acc + (m.tokens_input || 0) + (m.tokens_output || 0),
      0
    ) || 0;
    const aiCost = (totalTokens / 1000) * 0.003; // Rough Claude pricing

    // Calculate trends
    const conversationsChange =
      prevConversations > 0
        ? Math.round(((currentConversations - prevConversations) / prevConversations) * 100)
        : 0;

    const leadsChange =
      prevLeads > 0 ? Math.round(((currentLeads - prevLeads) / prevLeads) * 100) : 0;

    // Get top topics (mock for now - would need topic classification)
    const topTopics = [
      { topic: 'Azure Certifications', count: Math.round(currentConversations * 0.2) },
      { topic: 'AWS Training', count: Math.round(currentConversations * 0.15) },
      { topic: 'Pricing Inquiries', count: Math.round(currentConversations * 0.12) },
      { topic: 'Course Schedule', count: Math.round(currentConversations * 0.1) },
      { topic: 'Power BI', count: Math.round(currentConversations * 0.08) },
    ];

    // Get top courses asked about (mock for now)
    const topCourses = [
      { course: 'AZ-104: Azure Administrator', count: Math.round(currentConversations * 0.12) },
      { course: 'PL-300: Power BI Data Analyst', count: Math.round(currentConversations * 0.1) },
      { course: 'AWS Solutions Architect', count: Math.round(currentConversations * 0.09) },
      { course: 'AZ-900: Azure Fundamentals', count: Math.round(currentConversations * 0.08) },
      { course: 'SC-200: Security Operations', count: Math.round(currentConversations * 0.06) },
    ];

    // Get daily stats
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // In production, query actual daily data
      dailyStats.push({
        date: dateStr,
        conversations: Math.round(currentConversations / days + Math.random() * 20 - 10),
        leads: Math.round(currentLeads / days + Math.random() * 5 - 2),
      });
    }

    return NextResponse.json({
      data: {
        overview: {
          total_conversations: currentConversations,
          total_messages: messagesResult.count || 0,
          unique_visitors: uniqueVisitors,
          leads_captured: currentLeads,
          avg_response_time_ms: Math.round(avgResponseTime),
          avg_satisfaction: Math.round(avgSatisfaction * 10) / 10,
          ai_cost_usd: Math.round(aiCost * 100) / 100,
        },
        trends: {
          conversations_change: conversationsChange,
          leads_change: leadsChange,
          response_time_change: 0, // Would need historical data
        },
        top_topics: topTopics,
        top_courses: topCourses,
        daily_stats: dailyStats,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
