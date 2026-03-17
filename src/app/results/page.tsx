'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface MatchedJob {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  posted_at: Date | null;
  match_score: number;
  matched_criteria: string[];
  unmatched_criteria: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  employment_type: string | null;
  is_remote: boolean | null;
}

interface SearchResponse {
  data: { results: MatchedJob[]; total: number; search_id: string };
  meta: { threshold: number; max_score: number; searched_at: string; is_delta?: boolean; since?: string };
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function CompanyAvatar({ company }: { company: string | null }) {
  const letter = company ? company.charAt(0).toUpperCase() : '?';
  const color = getAvatarColor(company || '?');
  return (
    <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
      <span className="text-white font-bold text-base">{letter}</span>
    </div>
  );
}

function ScoreRing({ score, max = 8 }: { score: number; max?: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / max) * circumference;
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#f97316';
  return (
    <div className="flex-shrink-0 relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round"
          transform="rotate(-90 28 28)" />
      </svg>
      <span className="text-xs font-bold text-gray-700 z-10">{score}/{max}</span>
    </div>
  );
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const curr = currency || 'USD';
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  if (min && max) return `${curr} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${curr} ${fmt(min)}+`;
  return `Up to ${curr} ${fmt(max!)}`;
}

function formatLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function JobCard({ job, index, maxScore }: { job: MatchedJob; index: number; maxScore: number }) {
  const [expanded, setExpanded] = useState(false);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <div className="isolate bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-start gap-3">
        <ScoreRing score={job.match_score} max={maxScore} />
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CompanyAvatar company={job.company} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
              {job.company && <span className="text-gray-600 text-sm font-medium">{job.company}</span>}
              {job.location && <span className="text-gray-400 text-sm">· {job.location}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {salary && <Badge variant="green">{salary}</Badge>}
              {job.employment_type && <Badge variant="indigo">{job.employment_type}</Badge>}
              {job.is_remote && <Badge variant="purple">Remote</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.matched_criteria.map(c => (
          <span key={c} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {formatLabel(c)}
          </span>
        ))}
        {job.unmatched_criteria.map(c => (
          <span key={c} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
            {formatLabel(c)}
          </span>
        ))}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">✅ Matched</p>
            <div className="space-y-1">{job.matched_criteria.map(c => <div key={c} className="text-sm text-emerald-700 font-medium">{formatLabel(c)}</div>)}</div>
          </div>
          {job.unmatched_criteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">❌ Unmatched</p>
              <div className="space-y-1">{job.unmatched_criteria.map(c => <div key={c} className="text-sm text-gray-500">{formatLabel(c)}</div>)}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5">
          View Job
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button onClick={() => setExpanded(v => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap">
          {expanded ? 'Hide details' : 'Details'}
        </button>
      </div>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profile_id');
  const userId = searchParams.get('user_id');
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchedJob[]>([]);
  const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filterRemote, setFilterRemote] = useState<boolean | null>(null);
  const [filterMinScore, setFilterMinScore] = useState<number>(5);
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('');

  const [sortBy, setSortBy] = useState<'score' | 'posted_at' | 'salary_max'>('score');

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLocation, setPanelLocation] = useState<string>('');
  const [panelWorkMode, setPanelWorkMode] = useState<'remote' | 'hybrid' | 'onsite' | null>(null);
  const [panelEmploymentType, setPanelEmploymentType] = useState<'full-time' | 'part-time' | 'contract' | null>(null);
  const [panelSalaryMin, setPanelSalaryMin] = useState<number | null>(null);
  const [panelSalaryMax, setPanelSalaryMax] = useState<number | null>(null);
  const [panelPostedWithin, setPanelPostedWithin] = useState<number | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (profileId) {
      // Seed localStorage with the token from the URL if not already present.
      // This handles the fresh flow: preferences → results, where the token is
      // passed as a URL param (?token=...) but localStorage is still empty.
      if (token && !localStorage.getItem('restore_token')) {
        localStorage.setItem('restore_token', token);
      }
      initialLoadDone.current = false;
      performSearch(false).then(() => { initialLoadDone.current = true; });
    }
  }, [profileId]);

  // Re-fetch when sort changes, but only after initial load completes to avoid race condition
  useEffect(() => {
    if (profileId && sortBy !== 'score' && initialLoadDone.current) {
      performSearch(false);
    }
  }, [sortBy]);

  // Track whether panel prefs have been loaded from the profile
  const panelPrefsLoaded = useRef(false);

  useEffect(() => {
    if (!panelOpen) return;
    if (panelPrefsLoaded.current) return; // Already loaded once — don't reset user edits

    // Fetch stored profile preferences to pre-fill the panel
    const restoreToken = localStorage.getItem('restore_token');
    if (profileId && restoreToken) {
      fetch(`/api/preferences?profile_id=${encodeURIComponent(profileId)}`, {
        headers: { 'X-Restore-Token': restoreToken },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.data) return;
          const prefs = data.data;
          if (prefs.pref_location) setPanelLocation(prefs.pref_location);
          if (prefs.pref_work_mode && ['remote', 'hybrid', 'onsite'].includes(prefs.pref_work_mode.toLowerCase())) {
            setPanelWorkMode(prefs.pref_work_mode.toLowerCase() as 'remote' | 'hybrid' | 'onsite');
          }
          const empTypes = prefs.pref_employment_type;
          if (Array.isArray(empTypes) && empTypes.length > 0) {
            const first = empTypes[0].toLowerCase();
            if (['full-time', 'part-time', 'contract'].includes(first)) {
              setPanelEmploymentType(first as 'full-time' | 'part-time' | 'contract');
            }
          }
          if (prefs.pref_salary_min) setPanelSalaryMin(prefs.pref_salary_min);
          if (prefs.pref_salary_max) setPanelSalaryMax(prefs.pref_salary_max);
          panelPrefsLoaded.current = true;
        })
        .catch(() => {
          // Fallback to URL params if API fails
          const locationParam = searchParams.get('location');
          if (locationParam) setPanelLocation(locationParam);
        });
    }
  }, [panelOpen, profileId, searchParams]);

  const performSearch = async (delta: boolean) => {
    if (!profileId) return;
    setLoading(true); setError(null);
    try {
      const restoreToken = localStorage.getItem('restore_token');
      if (!restoreToken) {
        window.location.href = '/restore';
        return;
      }
      const endpoint = delta ? '/api/search/delta' : '/api/search';
      const sortParam = sortBy !== 'score' ? `?sort=${sortBy}` : '';

      // Forward current panel filter state so delta search respects active filters
      const body: Record<string, unknown> = { profile_id: profileId };
      if (panelLocation) body.location = panelLocation;
      if (panelWorkMode) body.work_mode = panelWorkMode;
      if (panelEmploymentType) body.employment_type = panelEmploymentType;
      if (panelSalaryMin !== null) body.salary_min = panelSalaryMin;
      if (panelSalaryMax !== null) body.salary_max = panelSalaryMax;
      if (panelPostedWithin !== null) body.posted_within = panelPostedWithin;

      const response = await fetch(`${endpoint}${sortParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Restore-Token': restoreToken },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Search failed');
      const data: SearchResponse = await response.json();
      setResults(data.data.results);
      setMeta(data.meta);
    } catch {
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRerunSearch = async () => {
    if (!profileId) return;
    setPanelLoading(true);
    setPanelError(null);

    try {
      const restoreToken = localStorage.getItem('restore_token');
      if (!restoreToken) {
        window.location.href = '/restore';
        return;
      }

      const body: Record<string, unknown> = { profile_id: profileId };
      if (panelLocation) body.location = panelLocation;
      if (panelWorkMode) body.work_mode = panelWorkMode;
      if (panelEmploymentType) body.employment_type = panelEmploymentType;
      if (panelSalaryMin !== null) body.salary_min = panelSalaryMin;
      if (panelSalaryMax !== null) body.salary_max = panelSalaryMax;
      if (panelPostedWithin !== null) body.posted_within = panelPostedWithin;

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Restore-Token': restoreToken,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Re-run search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.data.results);
      setMeta(data.meta);
      setPanelOpen(false);
    } catch {
      setPanelError('Failed to re-run search. Please try again.');
    } finally {
      setPanelLoading(false);
    }
  };

  if (!profileId) return (
    <div className="max-w-2xl mx-auto p-6 text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-gray-600 mb-4">No profile found.</p>
      <Link href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">Start over</Link>
    </div>
  );

  const filteredResults = results
    .filter(j => filterRemote === null || j.is_remote === filterRemote)
    .filter(j => j.match_score >= filterMinScore)
    .filter(j => filterEmploymentType === '' || j.employment_type === filterEmploymentType);

  const sortedFilteredResults = filteredResults;

  const employmentTypes = Array.from(new Set(results.map(j => j.employment_type).filter(Boolean))) as string[];
  const hasFilters = filterRemote !== null || filterMinScore > 5 || filterEmploymentType !== '';

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">aimeajob</Link>
          <button onClick={() => performSearch(true)} disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New jobs
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          {['Upload', 'Profile', 'Preferences', 'Results'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 3 ? 'bg-indigo-600 text-white' : 'bg-indigo-200 text-indigo-700'}`}>
                {i < 3 ? '✓' : '4'}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === 3 ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {profileId && (userId || token) && (
          <div className="flex gap-4 text-xs text-gray-400 mb-5">
            {userId && (
              <Link href={`/profile?user_id=${userId}&profile_id=${profileId}&token=${token}`}
                className="hover:text-indigo-600 transition-colors">
                ✏️ Edit profile
              </Link>
            )}
            <Link href={`/preferences?user_id=${userId ?? ''}&profile_id=${profileId}&token=${token ?? ''}`}
              className="hover:text-indigo-600 transition-colors">
              🎛 Edit preferences
            </Link>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Finding your matches…' : results.length > 0 ? `${results.length} Matches` : 'Job Matches'}
          </h1>
          {!loading && results.length > 0 && (
            <button
              onClick={() => setPanelOpen(true)}
              aria-label="Edit search filters"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              🎛 Edit filters
            </button>
          )}
        </div>

        {/* Filter bar — 2-row responsive layout (Issue #38/#40 fix) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-2 -mx-4 mb-4">
          {/* Row 1: Sort controls + result count */}
          {!loading && results.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">{sortedFilteredResults.length} of {results.length}</span>
              <div className="flex gap-1.5">
                {([['score', 'Score'], ['posted_at', 'Date'], ['salary_max', 'Salary']] as const).map(([val, label]) => (
                  <button key={val}
                    onClick={() => setSortBy(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${sortBy === val ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Row 2: Filter pills — horizontally scrollable, no wrap (Issue #38 fix) */}
          <div className="flex overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
                <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
                <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
                <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
              </>
            ) : (
              <>
                <button
                  onClick={() => setFilterRemote(filterRemote === true ? null : true)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterRemote === true ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                >
                  🌍 Remote
                </button>

                {[6, 7, 8].map(s => (
                  <button key={s}
                    onClick={() => setFilterMinScore(filterMinScore === s ? 5 : s)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterMinScore === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                  >
                    {s}+
                  </button>
                ))}

                {employmentTypes.map(type => (
                  <button key={type}
                    onClick={() => setFilterEmploymentType(filterEmploymentType === type ? '' : type)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterEmploymentType === type ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                  >
                    {type}
                  </button>
                ))}

                {hasFilters && (
                  <button
                    onClick={() => { setFilterRemote(null); setFilterMinScore(5); setFilterEmploymentType(''); }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    ✕ Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {loading && <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button onClick={() => performSearch(false)} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Try again</button>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">No matches found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your preferences or uploading an updated CV.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPanelOpen(true)}
                aria-label="Edit search filters"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Edit filters
              </button>
              <Link
                href="/upload"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Upload new CV
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && results.length > 0 && sortedFilteredResults.length === 0 && (
          <p className="text-gray-500 text-sm">
            No matches with current filters —{' '}
            <button
              onClick={() => { setFilterRemote(null); setFilterMinScore(5); setFilterEmploymentType(''); }}
              className="text-indigo-600 font-medium hover:underline"
            >
              Clear filters
            </button>
          </p>
        )}

        {!loading && !error && sortedFilteredResults.length > 0 && (
          <div className="space-y-4">
            {sortedFilteredResults.map((job, i) => <JobCard key={job.job_id} job={job} index={i} maxScore={meta?.max_score ?? 8} />)}
          </div>
        )}

        {profileId && <div className="mt-8"><SaveProfileCard profileId={profileId} /></div>}
      </div>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Edit Preferences</h2>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={panelLocation}
                    onChange={(e) => setPanelLocation(e.target.value)}
                    placeholder="e.g., Berlin, Remote"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                  <div className="flex gap-2">
                    {(['remote', 'hybrid', 'onsite'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPanelWorkMode(panelWorkMode === mode ? null : mode)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          panelWorkMode === mode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <div className="flex flex-col gap-2">
                    {(['full-time', 'part-time', 'contract'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setPanelEmploymentType(panelEmploymentType === type ? null : type)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          panelEmploymentType === type
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary (optional)</label>
                  <input
                    type="number"
                    value={panelSalaryMin ?? ''}
                    onChange={(e) => setPanelSalaryMin(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="e.g., 50000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary (optional)</label>
                  <input
                    type="number"
                    value={panelSalaryMax ?? ''}
                    onChange={(e) => setPanelSalaryMax(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="e.g., 100000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date posted</label>
                  <select
                    value={panelPostedWithin ?? ''}
                    onChange={(e) => setPanelPostedWithin(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Any</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
                </div>

                {panelError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                    {panelError}
                  </div>
                )}

                <button
                  onClick={handleRerunSearch}
                  disabled={panelLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {panelLoading ? 'Re-running search...' : 'Re-run search'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SaveProfileCard({ profileId }: { profileId: string }) {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'conflict' | 'error'>('idle');
  const [restoreToken, setRestoreToken] = React.useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setStatus('loading');
    try {
      const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile_id: profileId, email }) });
      const data = await res.json();
      if (res.ok) { setRestoreToken(data.data.restore_token); setStatus('success'); }
      else if (res.status === 409) setStatus('conflict');
      else setStatus('error');
    } catch { setStatus('error'); }
  }

  if (status === 'success' && restoreToken) return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
      <p className="font-semibold text-emerald-800 mb-1">✅ Profile saved!</p>
      <p className="text-emerald-700 text-sm">Restore code: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded">{restoreToken}</span></p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Save your profile</h2>
      <p className="text-sm text-gray-500 mb-4">Return anytime without re-uploading your CV.</p>
      <form onSubmit={handleSave} className="flex gap-2">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" disabled={status === 'loading'}
          className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {status === 'loading' ? '…' : 'Save'}
        </button>
      </form>
      {status === 'conflict' && <p className="text-red-500 text-sm mt-2">Email already registered.</p>}
      {status === 'error' && <p className="text-red-500 text-sm mt-2">Something went wrong, try again.</p>}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F5]">
        <div className="bg-white border-b border-gray-100 px-6 py-4"><span className="text-xl font-bold text-indigo-600">aimeajob</span></div>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
