import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { classifyJob } from './classify-job';

export interface BatchResult {
  total: number;
  classified: number;
  failed: number;
  errors: string[];
}

export async function classifyUnclassifiedJobs(batchSize: number = 50): Promise<BatchResult> {
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
