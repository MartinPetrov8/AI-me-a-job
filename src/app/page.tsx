import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-[#6366F1]">aimeajob</span>
          <Link href="/restore" className="text-sm text-gray-600 hover:text-[#6366F1] transition-colors">
            Returning user?
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center py-24">
          <div className="inline-block border border-[#6366F1] text-[#6366F1] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            ✦ Now in beta
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
            Find jobs that actually fit you
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Upload your CV. AI matches you to real roles — ranked by fit, not by who paid.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-[#6366F1] text-white font-semibold px-10 py-4 rounded-2xl hover:bg-indigo-600 transition-colors text-lg shadow-lg shadow-indigo-200"
          >
            Upload your CV →
          </Link>
          <p className="mt-4 text-sm text-gray-400">Free · No signup · Results in 30 seconds</p>
        </div>

        {/* Stats Row */}
        <div className="border-t border-b border-gray-200 py-8 my-12">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#6366F1]">900+</div>
              <div className="text-sm text-gray-600 mt-1">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#6366F1]">8</div>
              <div className="text-sm text-gray-600 mt-1">Match criteria</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-[#6366F1]">0</div>
              <div className="text-sm text-gray-600 mt-1">Sponsored results</div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '1', title: 'Upload CV', desc: 'Drop your CV and AI extracts your full profile automatically.' },
              { n: '2', title: 'Confirm profile', desc: 'Review what AI found and set your job preferences.' },
              { n: '3', title: 'See matches', desc: 'Get a ranked shortlist based on 8 criteria — no sponsored noise.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#6366F1] text-white rounded-full flex items-center justify-center font-bold text-base mb-4">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-6 text-center text-gray-400 text-sm">
        aimeajob © 2026 · AI-powered job matching
      </footer>
    </main>
  );
}
