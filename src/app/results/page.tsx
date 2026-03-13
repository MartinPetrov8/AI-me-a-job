'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

function ScoreBadge({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 8);
  const color = score >= 7 ? '#10B981' : score >= 5 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex-shrink-0 relative w-12 h-12">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 24 24)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
        {score}/8
      </span>
    </div>
  );
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const curr = currency || 'USD';
  if (min && max) return `${curr} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `${curr} ${min.toLocaleString()}+`;
  return `Up to ${curr} ${max!.toLocaleString()}`;
}

function formatLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ['bg-violet-500','bg-pink-500','bg-amber-500','bg-teal-500','bg-sky-500'];

function JobCard({ job, index }: { job: MatchedJob; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start gap-4">
        <ScoreBadge score={job.match_score} />
        <div className={`w-10 h-10 rounded-xl ${AVATAR_COLORS[index % 5]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {job.company?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-lg leading-tight">{job.title}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {job.company && <span className="text-gray-600 text-sm font-medium">{job.company}</span>}
            {job.location && (
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {job.location}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {salary && (
              <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {salary}
              </span>
            )}
            {job.employment_type && (
              <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {job.employment_type}
              </span>
            )}
            {job.is_remote && (
              <span className="inline-flex items-center bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                Remote
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {job.matched_criteria.map(c => (
              <span key={c} className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {formatLabel(c)}
              </span>
            ))}
            {job.unmatched_criteria.map(c => (
              <span key={c} className="bg-red-50 text-red-500 text-xs px-2.5 py-1 rounded-full font-medium">
                {formatLabel(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
        >
          View Job →
        </a>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
        >
          {expanded ? 'Hide' : 'Why matched?'}
        </button>
      </div>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profile_id');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchedJob[]>([]);
  const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (profileId) performSearch(false); }, [profileId]);

  const performSearch = async (delta: boolean) => {
    if (!profileId) return;
    setLoading(true); setError(null);
    try {
      const endpoint = delta ? '/api/search/delta' : '/api/search';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ profile_id: profileId }),
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

  if (!profileId) return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <p className="text-red-600">No profile ID provided.</p>
      <Link href="/" className="text-[#6366F1] underline mt-2 inline-block">Start over</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#6366F1]">aimeajob</Link>
          <button
            onClick={() => performSearch(true)}
            disabled={loading}
            className="text-sm text-[#6366F1] hover:text-indigo-600 font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Finding your matches...' : results.length > 0 ? `${results.length} Matches Found` : 'Job Matches'}
          </h1>
          {meta && !meta.is_delta && (
            <span className="text-sm text-gray-400">Threshold {meta.threshold}/{meta.max_score}</span>
          )}
          {meta?.is_delta && meta.since && (
            <span className="text-sm text-gray-400">New since {new Date(meta.since).toLocaleDateString()}</span>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700">
            {error}
            <button onClick={() => performSearch(false)} className="block mt-2 text-sm underline">Try again</button>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your preferences or check back as new jobs are added.</p>
            <Link href="/" className="inline-block bg-[#6366F1] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">Start a new search</Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((job, index) => <JobCard key={job.job_id} job={job} index={index} />)}
          </div>
        )}

        {profileId && (
          <div className="mt-8">
            <SaveProfileCard profileId={profileId} />
          </div>
        )}
      </div>
    </div>
  );
}

function SaveProfileCard({ profileId }: { profileId: string }) {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'conflict' | 'error'>('idle');
  const [restoreToken, setRestoreToken] = React.useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, email }),
      });
      const data = await res.json();
      if (res.ok) { setRestoreToken(data.data.restore_token); setStatus('success'); }
      else if (res.status === 409) setStatus('conflict');
      else setStatus('error');
    } catch { setStatus('error'); }
  }

  if (status === 'success' && restoreToken) return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
      <p className="font-semibold text-emerald-800 mb-1">Profile saved!</p>
      <p className="text-emerald-700 text-sm">Your restore code: <span className="font-mono font-bold">{restoreToken}</span></p>
      <p className="text-emerald-600 text-xs mt-1">Keep this to access your profile later.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Save your profile</h2>
      <p className="text-sm text-gray-500 mb-4">Return anytime without re-uploading your CV.</p>
      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="your@email.com"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        />
        <button type="submit" disabled={status === 'loading'}
          className="px-5 py-3 bg-[#6366F1] text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors">
          {status === 'loading' ? '...' : 'Save'}
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
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
