import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/cv-parser/extract-text';
import { extractCvCriteria } from '@/lib/llm/extract-cv';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Diagnostic endpoint: tests each step of the upload pipeline individually.
 * POST with multipart form data (file field).
 * Returns which step fails.
 */
export async function POST(request: NextRequest) {
  const steps: Record<string, { status: string; duration: number; detail?: string }> = {};
  
  // Step 1: Parse form data
  let file: File | null = null;
  try {
    const start = Date.now();
    const formData = await request.formData();
    file = formData.get('file') as File | null;
    steps['1_parse_form'] = { status: 'OK', duration: Date.now() - start, detail: `file: ${file?.name}, size: ${file?.size}` };
  } catch (e) {
    steps['1_parse_form'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  if (!file) {
    return NextResponse.json({ steps, error: 'No file' });
  }

  // Step 2: Read file to buffer
  let buffer: Buffer;
  try {
    const start = Date.now();
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
    steps['2_read_buffer'] = { status: 'OK', duration: Date.now() - start, detail: `${buffer.length} bytes` };
  } catch (e) {
    steps['2_read_buffer'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  // Step 3: Extract text from PDF
  let rawText: string;
  try {
    const start = Date.now();
    rawText = await extractText(buffer, file.type);
    steps['3_extract_text'] = { status: 'OK', duration: Date.now() - start, detail: `${rawText.length} chars, first 100: ${rawText.substring(0, 100)}` };
  } catch (e) {
    steps['3_extract_text'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  // Step 4: LLM extraction
  let extracted: any;
  try {
    const start = Date.now();
    extracted = await extractCvCriteria(rawText);
    steps['4_llm_extract'] = { status: 'OK', duration: Date.now() - start, detail: JSON.stringify(extracted).substring(0, 200) };
  } catch (e) {
    steps['4_llm_extract'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  // Step 5: DB write — users table
  let userId: string;
  let restoreToken: string;
  try {
    const start = Date.now();
    restoreToken = crypto.randomBytes(24).toString('base64url');
    const [user] = await db.insert(users).values({ restoreToken }).returning();
    userId = user.id;
    steps['5_db_users'] = { status: 'OK', duration: Date.now() - start, detail: `user_id: ${user.id}` };
  } catch (e) {
    steps['5_db_users'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  // Step 6: DB write — profiles table (this is where the real upload fails)
  try {
    const start = Date.now();
    const { profiles } = await import('@/lib/db/schema');
    const [profile] = await db.insert(profiles).values({
      userId,
      cvFilename: file!.name,
      cvRawText: rawText,
      yearsExperience: extracted.years_experience || '',
      educationLevel: extracted.education_level || '',
      fieldOfStudy: extracted.field_of_study || '',
      sphereOfExpertise: extracted.sphere_of_expertise || '',
      seniorityLevel: extracted.seniority_level || '',
      industry: extracted.industry || '',
      languages: extracted.languages || [],
      keySkills: extracted.key_skills || [],
      titleInferred: extracted.title_inferred,
    }).returning();
    steps['6_db_profiles'] = { status: 'OK', duration: Date.now() - start, detail: `profile_id: ${profile.id}` };
  } catch (e) {
    steps['6_db_profiles'] = { status: 'FAILED', duration: 0, detail: e instanceof Error ? e.message : String(e) };
    return NextResponse.json({ steps });
  }

  return NextResponse.json({ steps, allPassed: true });
}
