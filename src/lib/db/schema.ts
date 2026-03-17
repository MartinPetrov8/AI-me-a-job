import { pgTable, uuid, text, timestamp, integer, boolean, index, unique, vector } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  restoreToken: text('restore_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  cvFilename: text('cv_filename').notNull(),
  cvRawText: text('cv_raw_text'),
  yearsExperience: text('years_experience').notNull(),
  educationLevel: text('education_level').notNull(),
  fieldOfStudy: text('field_of_study').notNull(),
  sphereOfExpertise: text('sphere_of_expertise').notNull(),
  seniorityLevel: text('seniority_level').notNull(),
  industry: text('industry').notNull(),
  languages: text('languages').array().notNull(),
  keySkills: text('key_skills').array().notNull(),
  prefEmploymentType: text('pref_employment_type').array(),
  prefLocation: text('pref_location'),
  prefWorkMode: text('pref_work_mode'),
  prefRelocation: boolean('pref_relocation'),
  prefSalaryMin: integer('pref_salary_min'),
  prefSalaryMax: integer('pref_salary_max'),
  prefSalaryCurrency: text('pref_salary_currency'),
  lastSearchAt: timestamp('last_search_at', { withTimezone: true }),
  titleInferred: text('title_inferred'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').notNull(),
  source: text('source').notNull(),
  title: text('title').notNull(),
  company: text('company'),
  location: text('location'),
  country: text('country'),
  url: text('url').notNull(),
  descriptionRaw: text('description_raw').notNull(),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency'),
  employmentType: text('employment_type'),
  isRemote: boolean('is_remote'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  yearsExperience: text('years_experience'),
  educationLevel: text('education_level'),
  fieldOfStudy: text('field_of_study'),
  sphereOfExpertise: text('sphere_of_expertise'),
  seniorityLevel: text('seniority_level'),
  industry: text('industry'),
  languages: text('languages').array(),
  keySkills: text('key_skills').array(),
  classifiedAt: timestamp('classified_at', { withTimezone: true }),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  embedding: vector('embedding', { dimensions: 1536 }),
  // Cross-source dedup fields (Sprint A)
  canonicalUrl: text('canonical_url'),    // Normalized URL, UNIQUE WHERE NOT NULL
  contentHash: text('content_hash'),      // MD5(title+company+country+week), UNIQUE WHERE NOT NULL
}, (table) => ({
  uniqueSourceExternal: unique().on(table.source, table.externalId),
  keySkillsIdx: index('jobs_key_skills_idx').using('gin', table.keySkills),
  languagesIdx: index('jobs_languages_idx').using('gin', table.languages),
  canonicalUrlIdx: index('jobs_canonical_url_idx').on(table.canonicalUrl),
  contentHashIdx: index('jobs_content_hash_idx').on(table.contentHash),
}));

export const searches = pgTable('searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  searchedAt: timestamp('searched_at', { withTimezone: true }).notNull().defaultNow(),
  resultCount: integer('result_count').notNull(),
  isDelta: boolean('is_delta').notNull().default(false),
});

export const searchResults = pgTable('search_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  searchId: uuid('search_id').references(() => searches.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  matchScore: integer('match_score').notNull(),
  matchedCriteria: text('matched_criteria').array().notNull(),
  rank: integer('rank').notNull(),
}, (table) => ({
  uniqueSearchJob: unique().on(table.searchId, table.jobId),
}));
