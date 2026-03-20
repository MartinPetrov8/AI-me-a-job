import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, profiles, searches, searchResults, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [dbUser] = await db.select().from(users).where(eq(users.authId, user.id)).limit(1);
  
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, dbUser.id)).limit(1);

  const exportData: Record<string, unknown> = {
    user: {
      email: dbUser.email,
      created_at: dbUser.createdAt,
    },
  };

  if (profile) {
    exportData.profile = {
      years_experience: profile.yearsExperience,
      education_level: profile.educationLevel,
      field_of_study: profile.fieldOfStudy,
      sphere_of_expertise: profile.sphereOfExpertise,
      seniority_level: profile.seniorityLevel,
      industry: profile.industry,
      languages: profile.languages,
      key_skills: profile.keySkills,
    };

    exportData.preferences = {
      employment_type: profile.prefEmploymentType,
      location: profile.prefLocation,
      work_mode: profile.prefWorkMode,
      relocation: profile.prefRelocation,
      salary_min: profile.prefSalaryMin,
      salary_max: profile.prefSalaryMax,
      salary_currency: profile.prefSalaryCurrency,
    };

    const userSearches = await db.select().from(searches).where(eq(searches.profileId, profile.id));

    exportData.searches = userSearches.map((s) => ({
      date: s.searchedAt,
      result_count: s.resultCount,
    }));

    const matches = [];
    for (const search of userSearches) {
      const results = await db
        .select({
          jobId: searchResults.jobId,
          matchScore: searchResults.matchScore,
        })
        .from(searchResults)
        .where(eq(searchResults.searchId, search.id));

      for (const result of results) {
        if (result.jobId) {
          const [job] = await db.select().from(jobs).where(eq(jobs.id, result.jobId)).limit(1);
          if (job) {
            matches.push({
              job_title: job.title,
              company: job.company,
              score: result.matchScore,
              matched_at: search.searchedAt,
            });
          }
        }
      }
    }

    exportData.matches = matches;
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="aimeajob-data-export.json"',
    },
  });
}
