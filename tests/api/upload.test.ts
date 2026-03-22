import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn()
  }
}));

vi.mock('@/lib/cv-parser/extract-text', () => ({
  extractText: vi.fn(),
  UnsupportedFileTypeError: class UnsupportedFileTypeError extends Error {
    constructor(mimeType: string) {
      super(`Unsupported file type: ${mimeType}`);
      this.name = 'UnsupportedFileTypeError';
    }
  },
  EmptyDocumentError: class EmptyDocumentError extends Error {
    constructor() {
      super('Document is empty or contains insufficient text (< 50 characters)');
      this.name = 'EmptyDocumentError';
    }
  }
}));

vi.mock('@/lib/llm/extract-cv', () => ({
  extractCvCriteria: vi.fn(),
  LLMExtractionError: class LLMExtractionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LLMExtractionError';
    }
  }
}));

vi.mock('@/lib/embedding/embed', () => ({
  embedText: vi.fn(),
  buildProfileEmbeddingText: vi.fn((profile: any) => {
    return [
      profile.titleInferred,
      profile.sphereOfExpertise,
      profile.seniorityLevel,
      profile.industry,
      profile.keySkills?.join(', '),
    ].filter(Boolean).join(' ').trim();
  })
}));

import { POST } from '@/app/api/upload/route';
import { extractText, EmptyDocumentError } from '@/lib/cv-parser/extract-text';
import { extractCvCriteria, LLMExtractionError } from '@/lib/llm/extract-cv';
import { embedText } from '@/lib/embedding/embed';
import { db } from '@/lib/db';

describe('POST /api/upload', () => {
  let mockReturning: any;
  let mockUpdate: any;

  beforeEach(() => {
    mockReturning = vi.fn();
    const mockValues = vi.fn(() => ({
      returning: mockReturning
    }));
    const mockInsert = vi.fn(() => ({
      values: mockValues
    }));

    const mockSet = vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined)
    }));
    mockUpdate = vi.fn(() => ({
      set: mockSet
    }));

    vi.mocked(db.insert).mockImplementation(mockInsert as any);
    (db as any).update = mockUpdate;

    vi.mocked(extractText).mockResolvedValue('Sample CV text with more than fifty characters for testing');
    vi.mocked(extractCvCriteria).mockResolvedValue({
      title_inferred: null,
      years_experience: '5-9',
      education_level: 'Masters',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Senior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['Python', 'Go']
    });

    vi.mocked(embedText).mockResolvedValue(new Array(1536).fill(0.1));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when no file is provided', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });

  it('should return 400 for invalid MIME type', async () => {
    const formData = new FormData();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });

  it('should return 400 for file too large', async () => {
    const oversizeBytes = 11 * 1024 * 1024;

    // Send Content-Length header so the pre-flight check fires before formData() is called
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----boundary',
        'content-length': String(oversizeBytes),
      },
      body: '----boundary--', // minimal body — pre-flight check fires before parsing
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too large');
  });

  it('should successfully upload valid PDF and return user and profile data', async () => {
    const mockUserId = 'user-123';
    const mockProfileId = 'profile-456';

    mockReturning
      .mockResolvedValueOnce([{ id: mockUserId }])
      .mockResolvedValueOnce([{ id: mockProfileId }]);

    const formData = new FormData();
    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user_id).toBe(mockUserId);
    expect(data.data.profile_id).toBe(mockProfileId);
    expect(data.data.extracted).toEqual({
      title_inferred: null,
      years_experience: '5-9',
      education_level: 'Masters',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Senior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['Python', 'Go']
    });
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it('should return 422 on extraction error', async () => {
    vi.mocked(extractText).mockRejectedValue(
      new EmptyDocumentError()
    );

    const formData = new FormData();
    const file = new File(['content'], 'empty.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBeDefined();
  });

  it('should return 503 on LLM extraction failure', async () => {
    vi.mocked(extractCvCriteria).mockRejectedValue(
      new LLMExtractionError('LLM timeout')
    );

    const formData = new FormData();
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Failed to extract CV criteria');
  });

  it('should compute and store profile embedding after upload', async () => {
    const mockUserId = 'user-embed-123';
    const mockProfileId = 'profile-embed-456';
    const fakeEmbedding = new Array(1536).fill(0.25);

    mockReturning
      .mockResolvedValueOnce([{ id: mockUserId }])
      .mockResolvedValueOnce([{ id: mockProfileId }]);

    vi.mocked(embedText).mockResolvedValue(fakeEmbedding);

    const formData = new FormData();
    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user_id).toBe(mockUserId);
    expect(data.data.profile_id).toBe(mockProfileId);
    expect(embedText).toHaveBeenCalledTimes(1);
    expect(embedText).toHaveBeenCalledWith('Engineering Senior Technology Python, Go');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('should gracefully handle embedding failure without failing upload', async () => {
    const mockUserId = 'user-no-embed-123';
    const mockProfileId = 'profile-no-embed-456';

    mockReturning
      .mockResolvedValueOnce([{ id: mockUserId }])
      .mockResolvedValueOnce([{ id: mockProfileId }]);

    vi.mocked(embedText).mockRejectedValue(new Error('OpenAI API down'));

    const formData = new FormData();
    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user_id).toBe(mockUserId);
    expect(data.data.profile_id).toBe(mockProfileId);
    expect(embedText).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
