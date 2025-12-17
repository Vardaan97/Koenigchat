/**
 * Course Data Sync Script
 *
 * This script syncs course data from a CSV/Google Sheets URL to the database.
 * Run with: npx ts-node scripts/sync-courses.ts
 *
 * Expected CSV format:
 * URL, Course Name, Course Code, Vendor, Certification, Duration, ...
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CourseData {
  url: string;
  course_name: string;
  course_code: string;
  vendor: string;
  certification: string;
  duration: string;
  delivery_mode: string;
  target_audience: string;
  key_features: string;
  prerequisites: string;
  course_highlights: string;
  usps: string;
  price_info: string;
  page_title: string;
  meta_description: string;
  primary_cta: string;
  secondary_cta: string;
  credibility_markers: string;
  last_updated: string;
  topics_covered: string;
}

async function fetchCSVData(url: string): Promise<CourseData[]> {
  console.log('Fetching CSV data from:', url);

  const response = await fetch(url);
  const text = await response.text();

  // Parse CSV
  const lines = text.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  const courses: CourseData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (for complex CSV, use a proper parser like papaparse)
    const values = line.split(',');
    const course: Record<string, string> = {};

    headers.forEach((header, index) => {
      course[header] = values[index]?.trim() || '';
    });

    courses.push(course as unknown as CourseData);
  }

  console.log(`Parsed ${courses.length} courses from CSV`);
  return courses;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function syncCourse(course: CourseData): Promise<boolean> {
  try {
    // Parse duration
    let durationHours = 0;
    if (course.duration) {
      const match = course.duration.match(/(\d+)\s*hours?/i);
      if (match) {
        durationHours = parseInt(match[1]);
      }
    }

    // Parse arrays from strings
    const parseArray = (str: string): string[] => {
      if (!str) return [];
      return str.split(';').map((s) => s.trim()).filter(Boolean);
    };

    // Create text for embedding
    const embeddingText = [
      course.course_name,
      course.vendor,
      course.certification,
      course.target_audience,
      course.course_highlights,
      course.topics_covered,
    ]
      .filter(Boolean)
      .join(' ');

    // Generate embedding
    console.log(`Generating embedding for: ${course.course_name}`);
    const embedding = await generateEmbedding(embeddingText);

    // Extract slug from URL
    const slug = course.url?.split('/').pop() || '';

    // Upsert course
    const { error } = await supabase.from('kb_courses').upsert(
      {
        source_id: course.url || course.course_code,
        title: course.course_name,
        slug,
        course_code: course.course_code,
        description: course.course_highlights,
        vendor: course.vendor,
        certification: course.certification,
        duration_hours: durationHours || null,
        prerequisites: course.prerequisites,
        target_audience: course.target_audience,
        objectives: parseArray(course.course_highlights),
        key_features: parseArray(course.key_features),
        topics_covered: parseArray(course.topics_covered),
        usps: parseArray(course.usps),
        delivery_modes: parseArray(course.delivery_mode),
        price_info: course.price_info,
        page_url: course.url,
        page_title: course.page_title,
        meta_description: course.meta_description,
        primary_cta: course.primary_cta,
        secondary_cta: course.secondary_cta,
        credibility_markers: parseArray(course.credibility_markers),
        embedding,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'source_id' }
    );

    if (error) {
      console.error(`Error syncing course ${course.course_name}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error processing course ${course.course_name}:`, error);
    return false;
  }
}

async function main() {
  console.log('Starting course sync...\n');

  // Get CSV URL from environment or command line
  const csvUrl = process.env.COURSE_CSV_URL || process.argv[2];

  if (!csvUrl) {
    console.error('Please provide a CSV URL via COURSE_CSV_URL env var or as command line argument');
    process.exit(1);
  }

  try {
    // Fetch and parse CSV
    const courses = await fetchCSVData(csvUrl);

    // Sync courses with rate limiting
    let synced = 0;
    let failed = 0;

    for (const course of courses) {
      const success = await syncCourse(course);
      if (success) {
        synced++;
      } else {
        failed++;
      }

      // Rate limit to avoid API limits
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Progress update every 50 courses
      if ((synced + failed) % 50 === 0) {
        console.log(`Progress: ${synced + failed}/${courses.length} (${synced} synced, ${failed} failed)`);
      }
    }

    console.log(`\nSync complete!`);
    console.log(`Total: ${courses.length}`);
    console.log(`Synced: ${synced}`);
    console.log(`Failed: ${failed}`);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
