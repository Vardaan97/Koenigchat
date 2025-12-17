import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/openai';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('kb_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { title, content, category, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { data: null, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate embedding for the article content
    let embedding = null;
    try {
      embedding = await generateEmbedding(`${title}\n\n${content}`);
    } catch (e) {
      console.warn('Failed to generate embedding, continuing without:', e);
    }

    // Insert the article
    const { data: article, error: articleError } = await supabase
      .from('kb_articles')
      .insert({
        title,
        content,
        category: category || 'General',
        tags: tags || [],
        is_active: true,
      })
      .select()
      .single();

    if (articleError) throw articleError;

    // Also create a document chunk for RAG retrieval
    if (embedding) {
      await supabase.from('kb_document_chunks').insert({
        source_type: 'article',
        source_id: article.id,
        content: `${title}\n\n${content}`,
        embedding,
        metadata: { category, tags },
      });
    }

    return NextResponse.json({ data: article, error: null });
  } catch (error) {
    console.error('Failed to create article:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
