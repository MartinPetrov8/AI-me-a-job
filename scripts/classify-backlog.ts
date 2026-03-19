/**
 * Classify Backlog Script
 * 
 * One-time script to classify existing unclassified jobs in the database.
 * 
 * Usage:
 *   npx tsx scripts/classify-backlog.ts
 * 
 * What it does:
 * - Counts total jobs and unclassified jobs
 * - Classifies up to 500 unclassified jobs using Claude Haiku 4.5
 * - Processes jobs in batches of 20 (CLASSIFY_CHUNK_SIZE)
 * - Prints summary with success/failure counts
 * - Exits with code 0 on success, 1 if any jobs failed
 * 
 * Idempotency:
 * - Safe to re-run multiple times
 * - Already-classified jobs are skipped (checks classified_at timestamp)
 * - If interrupted, re-running will pick up where it left off
 * 
 * Requirements:
 * - ANTHROPIC_API_KEY must be set in .env
 * - Database connection must be configured (DATABASE_URL in .env)
 * 
 * Classification fields:
 * - seniority_level (Junior, Mid, Senior, Staff, Principal, C-level, Other)
 * - work_mode (Remote, Hybrid, On-site)
 * - employment_type (Full-time, Part-time, Contract, Internship, Other)
 * - requires_degree (boolean)
 * - visa_sponsorship (boolean)
 * - skills (array of technical skills)
 */

import { db } from '../src/lib/db';
import { jobs } from '../src/lib/db/schema';
import { isNull, count } from 'drizzle-orm';
import { classifyUnclassifiedJobs } from '../src/lib/llm/batch-classify';

async function main() {
  try {
    // Count total jobs
    const totalResult = await db.select({ count: count() }).from(jobs);
    const totalJobs = totalResult[0]?.count ?? 0;

    // Count unclassified jobs
    const unclassifiedResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.classifiedAt));
    const unclassifiedCount = unclassifiedResult[0]?.count ?? 0;

    process.stdout.write('Job Classification Backlog Report:\n');
    process.stdout.write(`Total jobs in database: ${totalJobs}\n`);
    process.stdout.write(`Unclassified jobs: ${unclassifiedCount}\n\n`);

    if (unclassifiedCount === 0) {
      process.stdout.write('No unclassified jobs found. Nothing to do.\n');
      process.exit(0);
    }

    process.stdout.write('Starting classification...\n');
    const result = await classifyUnclassifiedJobs(500);

    process.stdout.write('\nClassification Summary:\n');
    process.stdout.write(`Jobs processed: ${result.total}\n`);
    process.stdout.write(`Successfully classified: ${result.classified}\n`);
    process.stdout.write(`Failed: ${result.failed}\n`);

    if (result.errors.length > 0) {
      process.stdout.write('\nErrors:\n');
      result.errors.forEach(error => {
        process.stdout.write(`  - ${error}\n`);
      });
    }

    if (result.failed > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Fatal error: ${errorMessage}\n`);
    process.exit(1);
  }
}

main();
