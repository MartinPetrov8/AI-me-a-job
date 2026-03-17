import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, inArray, isNull } from 'drizzle-orm';
import { classifyJob } from './classify-job';
import { embedText, buildJobEmbeddingText } from '../embedding/embed';

export interface BatchResult {
  total: number;
  classified: number;
  failed: number;
  errors: string[];
}

/**
 * Classify a specific list of job IDs immediately after ingest.
 * Processes in chunks of 20 to avoid overwhelming the LLM.
 */
export async function classifyJobsById(ids: string[]): Promise<BatchResult> {
  const result: BatchResult = { total: ids.length, classified: 0, failed: 0, errors: [] };
  if (ids.length === 0) return result;

  const CLASSIFY_CHUNK_SIZE = 20;

  // Classify in chunks of 20
  for (let i = 0; i < ids.length; i += CLASSIFY_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CLASSIFY_CHUNK_SIZE);
    const jobBatch = await db.select().from(jobs).where(inArray(jobs.id, chunk));
    
    for (const job of jobBatch) {
      try {
        const classified = await classifyJob(job.title, job.descriptionRaw);

        // AC-9: Embed job for hybrid scoring
        let embedding: number[] | null = null;
        try {
          const embeddingText = buildJobEmbeddingText({
            title: job.title,
            company: job.company,
            location: job.location,
            descriptionRaw: job.descriptionRaw,
          });
          embedding = await embedText(embeddingText);
        } catch (embedError) {
          console.error(`[classify] Failed to embed job ${job.id}:`, embedError);
        }

        await db.update(jobs).set({
          yearsExperience: classified.years_experience,
          educationLevel: classified.education_level,
          fieldOfStudy: classified.field_of_study,
          sphereOfExpertise: classified.sphere_of_expertise,
          seniorityLevel: classified.seniority_level,
          languages: classified.languages,
          industry: classified.industry,
          keySkills: classified.key_skills,
          embedding: embedding,
          classifiedAt: new Date(),
        }).where(eq(jobs.id, job.id));
        result.classified++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return result;
}

export async function classifyUnclassifiedJobs(batchSize: number = 500): Promise<BatchResult> {
  const unclassifiedJobs = await db
    .select()
    .from(jobs)
    .where(isNull(jobs.classifiedAt))
    .limit(batchSize);

  const result: BatchResult = {
    total: unclassifiedJobs.length,
    classified: 0,
    failed: 0,
    errors: [],
  };

  for (const job of unclassifiedJobs) {
    try {
      const classified = await classifyJob(job.title, job.descriptionRaw);

      // AC-9: Embed job for hybrid scoring
      let embedding: number[] | null = null;
      try {
        const embeddingText = buildJobEmbeddingText({
          title: job.title,
          company: job.company,
          location: job.location,
          descriptionRaw: job.descriptionRaw,
        });
        embedding = await embedText(embeddingText);
      } catch (embedError) {
        console.error(`[classify] Failed to embed job ${job.id}:`, embedError);
      }

      await db
        .update(jobs)
        .set({
          yearsExperience: classified.years_experience,
          educationLevel: classified.education_level,
          fieldOfStudy: classified.field_of_study,
          sphereOfExpertise: classified.sphere_of_expertise,
          seniorityLevel: classified.seniority_level,
          languages: classified.languages,
          industry: classified.industry,
          keySkills: classified.key_skills,
          embedding: embedding,
          classifiedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      result.classified++;
    } catch (error) {
      result.failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Job ${job.id}: ${errorMessage}`);
    }
  }

  return result;
}
