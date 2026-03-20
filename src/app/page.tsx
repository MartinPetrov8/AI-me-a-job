'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  total_jobs: number;
  countries: number;
  sources: number;
  last_updated: string | null;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">aimeajob</span>
          <Link href="/restore" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium">
            Returning user?
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          AI-powered · No registration required
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
          Jobs that actually<br />
          <span className="text-indigo-600">match your skills</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload your CV. AI extracts your profile. Get a ranked shortlist based on 8 criteria — no sponsored noise, no registration.
        </p>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-10 py-4 rounded-xl hover:bg-indigo-700 transition-colors text-lg shadow-lg shadow-indigo-200"
        >
          Upload Your CV
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-gray-400">Free · PDF or DOCX · Results in under 30 seconds</p>
      </div>

      {stats && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-indigo-600 animate-count">{stats.total_jobs}</span>
                <span>active jobs</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-indigo-600 animate-count">{stats.countries}</span>
                <span>countries</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-indigo-600 animate-count">{stats.sources}</span>
                <span>sources</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Updated daily</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">Upload Your CV</h3>
            <p className="text-gray-600 text-sm leading-relaxed">PDF or DOCX, analyzed in seconds</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">AI Extracts Your Profile</h3>
            <p className="text-gray-600 text-sm leading-relaxed">8 criteria matched automatically</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">See Your Matches</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Ranked by relevance, no noise</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-sm">
        <p>Built by Martin Petrov | <a href="https://github.com/MartinPetrov8/AI-me-a-job" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 transition-colors">Open source on GitHub</a></p>
      </footer>

      <style jsx>{`
        @keyframes count {
          from { opacity: 0.5; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-count {
          animation: count 0.6s ease-out;
        }
      `}</style>
    </main>
  );
}
