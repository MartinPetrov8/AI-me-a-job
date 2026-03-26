import { db } from '../db/index';
import { users, profiles } from '../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { findMatches } from '../matching/engine';
import { buildDigestEmail, type DigestJob } from './digest-template';
import { sendEmail } from './client';

export interface DigestResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}

export async function runWeeklyDigest(): Promise<DigestResult> {
  const result: DigestResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Query Pro users with profiles
    const proUsers = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        restoreToken: users.restoreToken,
        profileId: profiles.id,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(
        and(
          eq(users.subscriptionStatus, 'pro'),
          isNotNull(users.email)
        )
      );

    console.log(`[digest] Found ${proUsers.length} Pro users with email`);

    for (const user of proUsers) {
      result.processed++;

      try {
        // Find new matches (delta mode)
        const matchResult = await findMatches(user.profileId, { delta: true });

        if (matchResult.results.length === 0) {
          result.skipped++;
          console.log(`[digest] User ${user.userEmail}: 0 new matches, skipping`);
          continue;
        }

        // Build email with top 10 matches
        const top10 = matchResult.results.slice(0, 10);
        const digestJobs: DigestJob[] = top10.map(match => ({
          title: match.title,
          company: match.company,
          location: match.location,
          url: match.url,
          score: match.match_score,
          maxScore: matchResult.max_score,
          restoreToken: user.restoreToken || undefined,
        }));

        const { subject, html } = buildDigestEmail(digestJobs, user.userEmail!);

        // Send email
        const sendResult = await sendEmail(user.userEmail!, subject, html);

        if (sendResult.ok) {
          result.sent++;
          console.log(`[digest] User ${user.userEmail}: sent ${top10.length} matches`);
        } else {
          result.errors.push(`${user.userEmail}: ${sendResult.error}`);
          console.error(`[digest] User ${user.userEmail}: send failed — ${sendResult.error}`);
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        result.errors.push(`${user.userEmail}: ${errorMsg}`);
        console.error(`[digest] User ${user.userEmail}: error — ${errorMsg}`);
        // Continue to next user
      }
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    result.errors.push(`Pipeline error: ${errorMsg}`);
    console.error(`[digest] Pipeline error — ${errorMsg}`);
  }

  return result;
}
