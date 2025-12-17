import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { data: null, error: 'No file provided' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { data: null, error: 'CSV file must have headers and at least one row' },
        { status: 400 }
      );
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

    // Map common header variations
    const headerMap: Record<string, string> = {
      'url': 'page_url',
      'course name': 'title',
      'name': 'title',
      'code': 'course_code',
      'course code': 'course_code',
      'vendor': 'vendor',
      'certification': 'certification',
      'duration': 'duration_hours',
      'category': 'category',
      'price': 'price_info',
      'description': 'description',
    };

    // Find column indices
    const columnIndices: Record<string, number> = {};
    headers.forEach((header, index) => {
      const mappedKey = headerMap[header] || header;
      columnIndices[mappedKey] = index;
    });

    // Process rows
    let imported = 0;
    let errors = 0;
    const coursesToInsert: Array<Record<string, unknown>> = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);

        const title = values[columnIndices['title']]?.trim();
        if (!title) continue;

        const course = {
          title,
          slug: generateSlug(title),
          course_code: values[columnIndices['course_code']]?.trim() || null,
          vendor: values[columnIndices['vendor']]?.trim() || 'Unknown',
          certification: values[columnIndices['certification']]?.trim() || null,
          duration_hours: parseDuration(values[columnIndices['duration_hours']]),
          category: values[columnIndices['category']]?.trim() || null,
          price_info: values[columnIndices['price_info']]?.trim() || null,
          page_url: values[columnIndices['page_url']]?.trim() || null,
          description: values[columnIndices['description']]?.trim() || null,
          is_active: true,
        };

        coursesToInsert.push(course);
      } catch (e) {
        console.error(`Error processing row ${i}:`, e);
        errors++;
      }
    }

    // Batch insert courses
    if (coursesToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < coursesToInsert.length; i += batchSize) {
        const batch = coursesToInsert.slice(i, i + batchSize);

        const { data: insertedCourses, error: insertError } = await supabase
          .from('kb_courses')
          .upsert(batch, { onConflict: 'slug' })
          .select();

        if (insertError) {
          console.error('Batch insert error:', insertError);
          errors += batch.length;
        } else {
          imported += insertedCourses?.length || 0;

          // Generate embeddings for inserted courses (async, don't wait)
          generateCourseEmbeddings(supabase, insertedCourses || []).catch(console.error);
        }
      }
    }

    return NextResponse.json({
      data: { imported, errors, total: lines.length - 1 },
      error: null,
    });
  } catch (error) {
    console.error('CSV import failed:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line handling quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Parse duration string to hours
function parseDuration(duration?: string): number | null {
  if (!duration) return null;

  const cleaned = duration.toLowerCase().trim();

  // Try to extract number
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;

  const num = parseInt(match[1], 10);

  // Convert days to hours if needed
  if (cleaned.includes('day')) {
    return num * 8; // Assuming 8 hours per day
  }

  return num;
}

// Generate embeddings for courses asynchronously
async function generateCourseEmbeddings(
  supabase: ReturnType<typeof createAdminClient>,
  courses: Array<{ id: string; title: string; description?: string; vendor?: string }>
) {
  for (const course of courses) {
    try {
      const textToEmbed = [
        course.title,
        course.description,
        course.vendor,
      ].filter(Boolean).join(' ');

      const embedding = await generateEmbedding(textToEmbed);

      await supabase.from('kb_document_chunks').insert({
        source_type: 'course',
        source_id: course.id,
        content: textToEmbed,
        embedding,
        metadata: { title: course.title },
      });
    } catch (e) {
      console.error(`Failed to generate embedding for course ${course.id}:`, e);
    }
  }
}
