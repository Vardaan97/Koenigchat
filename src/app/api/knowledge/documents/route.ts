import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/openai';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('kb_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

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

    // Read file content
    const content = await file.text();
    const fileType = file.type || 'text/plain';
    const filename = file.name;

    // Insert document record
    const { data: document, error: docError } = await supabase
      .from('kb_documents')
      .insert({
        filename,
        file_type: fileType,
        size_bytes: file.size,
        content,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) throw docError;

    // Chunk the document and create embeddings
    const chunks = chunkText(content, 1000, 200);
    let processedChunks = 0;

    for (const [index, chunk] of chunks.entries()) {
      try {
        const embedding = await generateEmbedding(chunk);

        await supabase.from('kb_document_chunks').insert({
          source_type: 'document',
          source_id: document.id,
          chunk_index: index,
          content: chunk,
          embedding,
          metadata: { filename, chunk_index: index },
        });

        processedChunks++;
      } catch (e) {
        console.error(`Failed to process chunk ${index}:`, e);
      }
    }

    // Update document status
    await supabase
      .from('kb_documents')
      .update({
        status: processedChunks > 0 ? 'indexed' : 'failed',
        chunk_count: processedChunks,
      })
      .eq('id', document.id);

    return NextResponse.json({
      data: { ...document, chunk_count: processedChunks },
      error: null,
    });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Helper function to chunk text
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}
