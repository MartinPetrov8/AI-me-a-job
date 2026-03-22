import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../src/lib/db';
import { jobs, profiles, users } from '../../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { findMatches } from '../../src/lib/matching/engine';
import { GET as healthGET } from '../../src/app/api/health/embeddings/route';
import { POST as embedPOST, GET as embedGET } from '../../src/app/api/embed/route';

describe('Embedding Pipeline Integration', () => {
  const testUserId = 'test-user-embedding-pipeline';
  const testProfileId = 'test-profile-embedding-pipeline';
  const testJobIds: string[] = [];
  const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';

  beforeAll(async () => {
    process.env.CRON_SECRET = CRON_SECRET;

    await db.delete(profiles).where(eq(profiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.execute(sql`DELETE FROM jobs WHERE id LIKE 'test-job-embedding-%'`);

    await db.insert(users).values({
      id: testUserId,
      email: 'test-embedding-pipeline@example.com',
      restoreToken: 'test-restore-embedding-pipeline',
    });

    await db.insert(profiles).values({
      id: testProfileId,
      userId: testUserId,
      cvFilename: 'test-cv-1.pdf',
      yearsExperience: '5',
      educationLevel: 'bachelors',
      fieldOfStudy: 'computer_science',
      sphereOfExpertise: 'backend',
      seniorityLevel: 'mid',
      languages: ['english', 'german'],
      industry: 'it',
      keySkills: ['python', 'postgresql', 'fastapi'],
      embedding: null,
    });

    await db.insert(profiles).values({
      id: 'test-profile-embedding-pipeline-2',
      userId: testUserId,
      cvFilename: 'test-cv-2.pdf',
      yearsExperience: '3',
      educationLevel: 'masters',
      fieldOfStudy: 'data_science',
      sphereOfExpertise: 'data_science',
      seniorityLevel: 'junior',
      languages: ['english'],
      industry: 'finance',
      keySkills: ['machine learning', 'tensorflow'],
      embedding: null,
    });

    const jobsData = Array.from({ length: 10 }, (_, i) => ({
      id: `test-job-embedding-${i}`,
      externalId: `ext-job-embedding-${i}`,
      source: 'adzuna_us' as const,
      title: `Software Engineer ${i}`,
      company: `Company ${i}`,
      location: 'Remote',
      url: `https://example.com/job-${i}`,
      descriptionRaw: `Job description for position ${i}`,
      ingestedAt: new Date(),
      classifiedAt: new Date(),
      yearsExperience: '4',
      educationLevel: 'bachelors',
      fieldOfStudy: 'computer_science',
      sphereOfExpertise: 'backend',
      seniorityLevel: 'mid',
      languages: ['english'],
      industry: 'it',
      keySkills: ['python', 'postgresql'],
      embedding: null,
      postedAt: new Date(),
      salaryMin: 50000,
      salaryMax: 80000,
      salaryCurrency: 'USD',
    }));

    await db.insert(jobs).values(jobsData);
    testJobIds.push(...jobsData.map((j) => j.id));
  });

  afterAll(async () => {
    await db.delete(profiles).where(eq(profiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.execute(sql`DELETE FROM jobs WHERE id LIKE 'test-job-embedding-%'`);
  });

  it('should seed DB with 10 jobs and 2 profiles without embeddings', async () => {
    const profileCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.userId, testUserId));
    expect(profileCount[0].count).toBe(2);

    const jobCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(sql`id LIKE 'test-job-embedding-%'`);
    expect(jobCount[0].count).toBe(10);

    const profilesWithEmbeddings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(sql`user_id = ${testUserId} AND embedding IS NOT NULL`);
    expect(profilesWithEmbeddings[0].count).toBe(0);

    const jobsWithEmbeddings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(sql`id LIKE 'test-job-embedding-%' AND embedding IS NOT NULL`);
    expect(jobsWithEmbeddings[0].count).toBe(0);
  });

  it('should embed profile via POST /api/embed', async () => {
    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET,
      },
      body: JSON.stringify({ profile_id: testProfileId }),
    });

    const response = await embedPOST(request as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.embedded).toBe(true);
    expect(data.dimensions).toBe(1536);

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, testProfileId))
      .limit(1);
    expect(profile[0].embedding).toBeTruthy();
    expect(Array.isArray(profile[0].embedding)).toBe(true);
    expect((profile[0].embedding as number[]).length).toBe(1536);
  });

  it('should embed job via GET /api/embed?job_id=X', async () => {
    const testJobId = testJobIds[0];
    const request = new Request(`http://localhost:3000/api/embed?job_id=${testJobId}`, {
      method: 'GET',
      headers: {
        'x-cron-secret': CRON_SECRET,
      },
    });

    const response = await embedGET(request as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.embedded).toBe(true);
    expect(data.dimensions).toBe(1536);

    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, testJobId))
      .limit(1);
    expect(job[0].embedding).toBeTruthy();
    expect(Array.isArray(job[0].embedding)).toBe(true);
    expect((job[0].embedding as number[]).length).toBe(1536);
  });

  it('should report increased coverage in GET /api/health/embeddings', async () => {
    const request = new Request('http://localhost:3000/api/health/embeddings', {
      method: 'GET',
    });

    const response = await healthGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_profiles).toBeGreaterThanOrEqual(2);
    expect(data.embedded_profiles).toBeGreaterThanOrEqual(1);
    expect(data.total_jobs).toBeGreaterThanOrEqual(10);
    expect(data.embedded_jobs).toBeGreaterThanOrEqual(1);
    expect(typeof data.coverage_pct).toBe('number');
  });

  it('should return matches with cosine similarity when embeddings exist', async () => {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, testProfileId))
      .limit(1);
    
    expect(profile[0].embedding).toBeTruthy();

    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, testJobIds[0]))
      .limit(1);
    
    expect(job[0].embedding).toBeTruthy();

    const matchResult = await findMatches(testProfileId, {
      userId: testUserId,
    });

    expect(matchResult.results).toBeDefined();
    expect(Array.isArray(matchResult.results)).toBe(true);
    expect(matchResult.results.length).toBeGreaterThan(0);
    
    const firstMatch = matchResult.results[0];
    expect(firstMatch.job_id).toBeDefined();
    expect(firstMatch.match_score).toBeGreaterThanOrEqual(0);
    expect(typeof firstMatch.match_score).toBe('number');
  });
});
