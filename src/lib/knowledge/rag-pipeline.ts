import { createAdminClient } from '../supabase/admin';
import { generateEmbedding } from '../ai/openai';
import type { SearchResult } from '@/types';

interface SearchOptions {
  matchThreshold?: number;
  matchCount?: number;
  sourceTypes?: ('course' | 'learning_path' | 'article' | 'document')[];
}

export async function searchKnowledgeBase(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { matchThreshold = 0.7, matchCount = 10, sourceTypes } = options;

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search using Supabase function
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }

    // Filter by source types if specified
    let results = data as SearchResult[];

    if (sourceTypes && sourceTypes.length > 0) {
      results = results.filter((r) =>
        sourceTypes.includes(r.source_type as 'course' | 'learning_path' | 'article' | 'document')
      );
    }

    return results;
  } catch (error) {
    console.error('RAG pipeline error:', error);
    return [];
  }
}

export async function searchCourses(
  query: string,
  options: { matchThreshold?: number; matchCount?: number } = {}
): Promise<SearchResult[]> {
  const { matchThreshold = 0.7, matchCount = 5 } = options;

  try {
    const queryEmbedding = await generateEmbedding(query);
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('search_courses', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Course search error:', error);
      return [];
    }

    return (data || []).map((course: {
      id: string;
      title: string;
      vendor: string;
      description: string;
      page_url: string;
      price_info: string;
      similarity: number;
    }) => ({
      source_type: 'course' as const,
      source_id: course.id,
      title: course.title,
      content: `${course.vendor ? `[${course.vendor}] ` : ''}${course.description || ''}${course.price_info ? `\nPricing: ${course.price_info}` : ''}`,
      url: course.page_url,
      similarity: course.similarity,
    }));
  } catch (error) {
    console.error('Course search error:', error);
    return [];
  }
}

export async function getCourseLiveData(courseId: string): Promise<{
  price_info?: string;
  next_batch_date?: string;
  delivery_modes?: string[];
} | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('kb_courses')
      .select('price_info, next_batch_date, delivery_modes')
      .eq('id', courseId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Course live data fetch error:', error);
    return null;
  }
}

export async function getCourseBySlug(slug: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('kb_courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Course fetch error:', error);
    return null;
  }
}

export async function searchByVendor(vendor: string, limit = 10) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('kb_courses')
      .select('id, title, slug, description, page_url, price_info')
      .ilike('vendor', `%${vendor}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      return [];
    }

    return data;
  } catch (error) {
    console.error('Vendor search error:', error);
    return [];
  }
}

// Index new content
export async function indexCourse(course: {
  id: string;
  title: string;
  description?: string;
  vendor?: string;
  topics_covered?: string[];
}) {
  try {
    // Create text for embedding
    const textParts = [
      course.title,
      course.description,
      course.vendor,
      ...(course.topics_covered || []),
    ].filter(Boolean);

    const text = textParts.join(' ');
    const embedding = await generateEmbedding(text);

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('kb_courses')
      .update({ embedding })
      .eq('id', course.id);

    if (error) {
      console.error('Course indexing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Course indexing error:', error);
    return false;
  }
}

export async function indexArticle(article: { id: string; title: string; content: string }) {
  try {
    const text = `${article.title}\n${article.content}`;
    const embedding = await generateEmbedding(text);

    const supabase = createAdminClient();

    const { error } = await supabase.from('kb_articles').update({ embedding }).eq('id', article.id);

    if (error) {
      console.error('Article indexing error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Article indexing error:', error);
    return false;
  }
}
