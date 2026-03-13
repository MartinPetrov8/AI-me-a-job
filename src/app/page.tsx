import Link from 'next/link';

export default function Home() {
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

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-3 divide-x divide-gray-100">
          {[
            { n: '1,500+', label: 'Live job listings' },
            { n: '8',      label: 'Match criteria' },
            { n: '<30s',   label: 'Time to results' },
          ].map(({ n, label }) => (
            <div key={label} className="px-8 py-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">{n}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n: '1', icon: '📄', title: 'Upload your CV', desc: 'AI reads your experience, skills, education, and expertise automatically.' },
            { n: '2', icon: '✏️', title: 'Confirm your profile', desc: 'Review what AI found, fix anything, and set your preferences.' },
            { n: '3', icon: '🎯', title: 'See matched jobs', desc: 'Get a ranked shortlist scored on 8 criteria — not who paid for placement.' },
          ].map(({ n, icon, title, desc }) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-sm">
        aimeajob © 2026 · AI-powered job matching
      </footer>
    </main>
  );
}
