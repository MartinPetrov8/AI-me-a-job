import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find jobs that actually match your skills
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your CV. We extract your profile. You see only relevant jobs.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Your CV
          </Link>
          <div className="mt-4">
            <Link href="/restore" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Returning user? Restore your profile
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload your CV</h3>
              <p className="text-gray-600 text-sm">We extract your experience, skills, and expertise</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Confirm your profile</h3>
              <p className="text-gray-600 text-sm">Review what we found and add your preferences</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">See matched jobs</h3>
              <p className="text-gray-600 text-sm">Get a ranked shortlist based on 8 matching criteria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
        aimeajob © 2026
      </footer>
    </main>
  );
}
