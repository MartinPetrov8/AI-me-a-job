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
  const color = score >= 7 ? 'bg-emerald-500' : score === 6 ? 'bg-amber-400' : 'bg-orange-400';
  return (
    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
      <span className="text-white font-bold text-sm">{score}/8</span>
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

function JobCard({ job }: { job: MatchedJob }) {
  const [expanded, setExpanded] = useState(false);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start gap-4">
        <ScoreBadge score={job.match_score} />
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
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matched</p>
            {job.matched_criteria.map(c => (
              <div key={c} className="flex items-center gap-1.5 text-sm text-emerald-700 mb-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {formatLabel(c)}
              </div>
            ))}
          </div>
          {job.unmatched_criteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unmatched</p>
              {job.unmatched_criteria.map(c => (
                <div key={c} className="flex items-center gap-1.5 text-sm text-red-500 mb-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {formatLabel(c)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
        >
          View Job →
        </a>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
        >
          {expanded ? 'Hide details' : 'Why matched?'}
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
    <div className="max-w-2xl mx-auto p-6 text-center">
      <p className="text-red-600">No profile ID provided.</p>
      <Link href="/" className="text-blue-600 underline mt-2 inline-block">Start over</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">aimeajob</Link>
          <button
            onClick={() => performSearch(true)}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Finding matches...' : results.length > 0 ? `${results.length} Job Matches` : 'Job Matches'}
          </h1>
          {meta && !meta.is_delta && (
            <span className="text-sm text-gray-400">Threshold {meta.threshold}/{meta.max_score}</span>
          )}
          {meta?.is_delta && meta.since && (
            <span className="text-sm text-gray-400">New since {new Date(meta.since).toLocaleDateString()}</span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700">
            {error}
            <button onClick={() => performSearch(false)} className="block mt-2 text-sm underline">Try again</button>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No matches above threshold</h3>
            <p className="text-gray-500 text-sm">Try broadening your profile or check back as new jobs are added daily.</p>
            <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline text-sm">Start a new search</Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map(job => <JobCard key={job.job_id} job={job} />)}
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
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" disabled={status === 'loading'}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
