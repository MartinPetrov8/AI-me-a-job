'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Stats {
  total_jobs: number;
  countries: number;
  sources: number;
  last_updated: string | null;
}

export default function HomeClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector('#how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const AnimatedCounter = ({ value }: { value: number }) => {
    if (prefersReducedMotion) {
      return <span className="font-bold text-2xl text-indigo-600">{value.toLocaleString()}</span>;
    }

    return (
      <motion.span
        className="font-bold text-2xl text-indigo-600"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {value.toLocaleString()}
      </motion.span>
    );
  };

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

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100 via-indigo-50 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Stop Scrolling Job Boards.<br />
            Get AI-Matched.
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            7,000+ jobs from 12 sources, ranked by how well they match YOUR CV. Free, no registration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors text-lg shadow-lg shadow-indigo-200 w-full sm:w-auto justify-center"
            >
              Upload Your CV — free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              onClick={handleSmoothScroll}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl border-2 border-indigo-600 hover:bg-indigo-50 transition-colors text-lg w-full sm:w-auto justify-center"
            >
              See how it works
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 mb-12">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No registration
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              PDF or DOCX
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Results in 30 seconds
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              12 job sources
            </span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <AnimatedCounter value={stats.total_jobs} />
                <span>active jobs</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <AnimatedCounter value={stats.countries} />
                <span>countries</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <AnimatedCounter value={stats.sources} />
                <span>sources</span>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="text-gray-500">Updated daily</span>
            </div>
          </div>
        </div>
      )}

      <section id="how-it-works" className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold mb-6">
              1
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">Upload Your CV</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Upload your CV (PDF or DOCX) — AI extracts 8 criteria from your profile
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold mb-6">
              2
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">We Scan Jobs</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We scan 7,000+ jobs from 12 boards — refreshed every day at 09:00 UTC
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold mb-6">
              3
            </div>
            <h3 className="font-bold text-gray-900 mb-3 text-xl">Get Ranked Shortlist</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Get a ranked shortlist — each job scored by skills, location, salary, work mode, and more
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-sm">
        <p>Built by Martin Petrov | <a href="https://github.com/MartinPetrov8/AI-me-a-job" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 transition-colors">Open source on GitHub</a></p>
      </footer>
    </main>
  );
}
