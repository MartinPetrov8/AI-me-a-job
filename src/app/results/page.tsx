'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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
  data: {
    results: MatchedJob[];
    total: number;
    search_id: string;
  };
  meta: {
    threshold: number;
    max_score: number;
    searched_at: string;
    is_delta?: boolean;
    since?: string;
  };
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profile_id');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchedJob[]>([]);
  const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profileId) {
      performSearch(false);
    }
  }, [profileId]);

  const performSearch = async (delta: boolean) => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = delta ? '/api/search/delta' : '/api/search';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.data.results);
      setMeta(data.meta);
    } catch (err) {
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score === 6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || 'USD';
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${curr} ${min.toLocaleString()}+`;
    if (max) return `Up to ${curr} ${max.toLocaleString()}`;
    return null;
  };

  const formatCriteriaLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!profileId) {
    return (
      <div className="max-w-[640px] mx-auto p-4">
        <p className="text-red-600">No profile ID provided</p>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Matches</h1>

      <button
        onClick={() => performSearch(true)}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Check for New Jobs
      </button>

      {meta?.is_delta && meta.since && (
        <p className="mb-4 text-sm text-gray-600">
          {results.length} new jobs since {new Date(meta.since).toLocaleDateString()}
        </p>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && results.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-gray-600">
            No matches found above 5/8 threshold. Try broadening your profile.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          {results.map(job => {
            const isExpanded = expandedJobs.has(job.job_id);
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

            return (
              <div key={job.job_id} className="bg-white rounded-lg shadow-sm p-4 mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{job.title}</h2>
                    {job.company && <p className="text-gray-700">{job.company}</p>}
                    {job.location && <p className="text-gray-600 text-sm">{job.location}</p>}
                  </div>
                  <div
                    className={`inline-flex rounded-full w-10 h-10 font-bold items-center justify-center text-white ml-4 ${getBadgeColor(
                      job.match_score
                    )}`}
                  >
                    {job.match_score}/8
                  </div>
                </div>

                {salary && <p className="text-gray-700 mt-2">{salary}</p>}

                {job.employment_type && (
                  <p className="text-gray-600 text-sm">{job.employment_type}</p>
                )}

                <button
                  onClick={() => toggleExpanded(job.job_id)}
                  className="text-blue-600 text-sm mt-2 hover:underline"
                >
                  {isExpanded ? 'Hide' : 'Show'} why this matched
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="mb-2">
                      <p className="font-semibold text-sm mb-1">Matched Criteria:</p>
                      {job.matched_criteria.map(criterion => (
                        <div key={criterion} className="flex items-center text-sm text-green-700">
                          <span className="mr-2">✓</span>
                          {formatCriteriaLabel(criterion)}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">Unmatched Criteria:</p>
                      {job.unmatched_criteria.map(criterion => (
                        <div key={criterion} className="flex items-center text-sm text-red-700">
                          <span className="mr-2">✗</span>
                          {formatCriteriaLabel(criterion)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  View Job
                </a>
              </div>
            );
          })}
        </div>
      )}

      {profileId && <SaveProfileCard profileId={profileId} />}
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
      if (res.ok) {
        setRestoreToken(data.data.restore_token);
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('conflict');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h2 className="font-semibold text-gray-900 mb-3">Save your profile for next time</h2>
      {status === 'success' && restoreToken ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-1">Profile saved!</p>
          <p className="text-green-700 text-sm">Your restore code: <span className="font-mono font-bold">{restoreToken}</span></p>
          <p className="text-green-600 text-xs mt-1">Save this to access your profile later</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
      {status === 'conflict' && <p className="text-red-600 text-sm mt-2">This email is already registered</p>}
      {status === 'error' && <p className="text-red-600 text-sm mt-2">Something went wrong, please try again</p>}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[640px] mx-auto p-4 flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
