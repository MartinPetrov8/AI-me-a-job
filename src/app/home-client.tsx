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

interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
}

interface HomeClientProps {
  blogPosts: BlogPost[];
}

export default function HomeClient({ blogPosts }: HomeClientProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">No sponsored jobs</h4>
                <p className="text-sm text-gray-600">Pure AI ranking, no pay-to-play. Every result is earned by genuine match quality.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">12 job sources in one search</h4>
                <p className="text-sm text-gray-600">We aggregate from Adzuna, Jooble, RemoteOK, WeWorkRemotely, and 8 more boards.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">8-criteria matching</h4>
                <p className="text-sm text-gray-600">Every job scored by skills, experience, location, salary, work mode, seniority, language, and industry.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Europe-focused</h4>
                <p className="text-sm text-gray-600">Covers BG, RO, PL, DE, NL, FR, GB plus remote-first opportunities across Europe.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Top 5 matches free forever</h4>
                <p className="text-sm text-gray-600">See your best 5 matches with every search. No credit card, no trial period, forever free.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Daily refresh</h4>
                <p className="text-sm text-gray-600">Jobs updated every morning at 09:00 UTC. Fresh opportunities delivered daily.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">From the Blog</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{post.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <span className="text-indigo-600 text-sm font-medium inline-flex items-center gap-1">
                Read more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">How does AI job matching work?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 0 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 0 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                When you upload your CV, our AI extracts 8 key criteria from your profile: skills, years of experience, location preferences, salary expectations, work mode (remote/hybrid/onsite), seniority level, languages, and industry background. We then score every job in our database against these 8 criteria using a weighted algorithm. Jobs that match more criteria and match them more precisely rank higher. You see a ranked shortlist with transparent match scores — no black box, no sponsored placements.
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">Is aimeajob really free?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 1 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 1 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                Yes. Your top 5 matches are free forever — no credit card required, no trial period that expires. You can upload your CV, get ranked results, and see your best 5 matches every single time, completely free. If you need to see more than 5 results or unlock advanced filtering, we offer a Pro plan. But for most job seekers, the free tier is all you need.
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">What job boards do you search?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 2 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 2 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                We aggregate from 12 sources: <strong>Adzuna</strong>, <strong>Jooble</strong>, <strong>RemoteOK</strong>, <strong>WeWorkRemotely</strong>, <strong>NoFluffJobs</strong>, <strong>zaplata.bg</strong>, <strong>jobs.bg</strong>, <strong>dev.bg</strong>, <strong>JustJoin.it</strong>, <strong>eJobs.ro</strong>, <strong>BestJobs.eu</strong>, and <strong>Bulldogjob.com</strong>. This gives you access to 7,000+ jobs in one search, covering both international boards and regional European platforms.
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">Which countries are covered?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 3 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 3 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                We focus on Europe: <strong>Bulgaria (BG)</strong>, <strong>Romania (RO)</strong>, <strong>Poland (PL)</strong>, <strong>Germany (DE)</strong>, <strong>Netherlands (NL)</strong>, <strong>France (FR)</strong>, and <strong>Great Britain (GB)</strong>. We also include <strong>remote-first opportunities</strong> that are open to candidates across Europe. Our coverage will expand as we add more regional boards.
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">Do I need to create an account?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 4 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 4 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                No. Just upload your CV and get results. No account needed, no email required, no password to remember. We generate a unique restore link after your upload so you can return to your results later. Keep that link safe if you want to access your matches again — but there is no mandatory registration.
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900 text-lg">How often are jobs updated?</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${openFaqIndex === 5 ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openFaqIndex === 5 && (
              <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                Jobs are refreshed <strong>daily at 09:00 UTC</strong> from all 12 sources. Every morning, we pull new listings, remove expired postings, and re-classify everything using our AI extraction pipeline. When you search, you are always seeing the most up-to-date job data available.
              </div>
            )}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does AI job matching work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'When you upload your CV, our AI extracts 8 key criteria from your profile: skills, years of experience, location preferences, salary expectations, work mode (remote/hybrid/onsite), seniority level, languages, and industry background. We then score every job in our database against these 8 criteria using a weighted algorithm. Jobs that match more criteria and match them more precisely rank higher. You see a ranked shortlist with transparent match scores — no black box, no sponsored placements.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Is aimeajob really free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Your top 5 matches are free forever — no credit card required, no trial period that expires. You can upload your CV, get ranked results, and see your best 5 matches every single time, completely free. If you need to see more than 5 results or unlock advanced filtering, we offer a Pro plan. But for most job seekers, the free tier is all you need.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'What job boards do you search?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We aggregate from 12 sources: Adzuna, Jooble, RemoteOK, WeWorkRemotely, NoFluffJobs, zaplata.bg, jobs.bg, dev.bg, JustJoin.it, eJobs.ro, BestJobs.eu, and Bulldogjob.com. This gives you access to 7,000+ jobs in one search, covering both international boards and regional European platforms.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Which countries are covered?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We focus on Europe: Bulgaria (BG), Romania (RO), Poland (PL), Germany (DE), Netherlands (NL), France (FR), and Great Britain (GB). We also include remote-first opportunities that are open to candidates across Europe. Our coverage will expand as we add more regional boards.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Do I need to create an account?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Just upload your CV and get results. No account needed, no email required, no password to remember. We generate a unique restore link after your upload so you can return to your results later. Keep that link safe if you want to access your matches again — but there is no mandatory registration.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'How often are jobs updated?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Jobs are refreshed daily at 09:00 UTC from all 12 sources. Every morning, we pull new listings, remove expired postings, and re-classify everything using our AI extraction pipeline. When you search, you are always seeing the most up-to-date job data available.'
                  }
                }
              ]
            })
          }}
        />
      </section>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-sm">
        <p>Built by Martin Petrov | <a href="https://github.com/MartinPetrov8/AI-me-a-job" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 transition-colors">Open source on GitHub</a></p>
      </footer>
    </main>
  );
}
