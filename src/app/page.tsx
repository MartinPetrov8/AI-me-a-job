import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">aimeajob</span>
          <Link href="/restore" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Returning user?
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center py-20">
          <div className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            No registration required
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            Jobs that actually<br />match your skills
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
            Upload your CV. AI extracts your profile. See only relevant jobs — ranked by fit, not by who paid for placement.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-md shadow-blue-200"
          >
            Upload Your CV
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-gray-400">Free · PDF or DOCX · Results in under 30 seconds</p>
        </div>

        {/* How it works */}
        <div className="pb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Upload your CV', desc: 'We extract your experience, skills, education, and expertise automatically.' },
              { n: '2', title: 'Confirm your profile', desc: 'Review what AI found, correct anything, and set your job preferences.' },
              { n: '3', title: 'See matched jobs', desc: 'Get a ranked shortlist based on 8 criteria — no sponsored noise.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-sm">
        aimeajob © 2026 · AI-powered job matching
      </footer>
    </main>
  );
}
