import { NextRequest, NextResponse } from 'next/server';
import { extractText, UnsupportedFileTypeError, EmptyDocumentError } from '@/lib/cv-parser/extract-text';
import { extractCvCriteria, LLMExtractionError } from '@/lib/llm/extract-cv';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX are supported' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText: string;
    try {
      rawText = await extractText(buffer, file.type);
    } catch (error) {
      if (error instanceof UnsupportedFileTypeError || error instanceof EmptyDocumentError) {
        return NextResponse.json(
          { error: error.message },
          { status: 422 }
        );
      }
      throw error;
    }

    let extracted;
    try {
      extracted = await extractCvCriteria(rawText);
    } catch (error) {
      if (error instanceof LLMExtractionError) {
        return NextResponse.json(
          { error: 'Failed to extract CV criteria' },
          { status: 503 }
        );
      }
      throw error;
    }

    const [user] = await db.insert(users).values({}).returning();

    const [profile] = await db.insert(profiles).values({
      userId: user.id,
      cvFilename: file.name,
      cvRawText: rawText,
      yearsExperience: extracted.years_experience || '',
      educationLevel: extracted.education_level || '',
      fieldOfStudy: extracted.field_of_study || '',
      sphereOfExpertise: extracted.sphere_of_expertise || '',
      seniorityLevel: extracted.seniority_level || '',
      industry: extracted.industry || '',
      languages: extracted.languages || [],
      keySkills: extracted.key_skills || [],
    }).returning();

    return NextResponse.json({
      data: {
        user_id: user.id,
        profile_id: profile.id,
        extracted,
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
