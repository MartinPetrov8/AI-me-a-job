import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About aimeajob</h1>
          
          <p className="text-xl text-gray-700 mb-8">
            aimeajob uses AI to match your skills with the right opportunities across Europe.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#F7F7F5] rounded-2xl p-6">
                <div className="text-3xl font-bold text-indigo-600 mb-4">1</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your CV</h3>
                <p className="text-gray-600">
                  Simply upload your CV in any common format. Our AI extracts your skills, experience, and preferences.
                </p>
              </div>

              <div className="bg-[#F7F7F5] rounded-2xl p-6">
                <div className="text-3xl font-bold text-indigo-600 mb-4">2</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching</h3>
                <p className="text-gray-600">
                  We analyze thousands of job postings and rank them based on how well they match your profile.
                </p>
              </div>

              <div className="bg-[#F7F7F5] rounded-2xl p-6">
                <div className="text-3xl font-bold text-indigo-600 mb-4">3</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Results</h3>
                <p className="text-gray-600">
                  Review your personalized job matches, sorted by compatibility. Apply to the best opportunities.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              We believe finding the right job should take minutes, not months.
            </p>
            <p className="text-gray-700">
              Traditional job searching is broken. You spend hours scrolling through irrelevant listings, tailoring applications, and hoping for the best. We built aimeajob to fix that. Our AI does the heavy lifting — analyzing your experience, understanding job requirements, and showing you only the opportunities that truly match your skills.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Geographic Focus</h2>
            <p className="text-gray-700">
              We currently focus on opportunities in <strong>Bulgaria, Romania, Poland</strong>, and <strong>remote European roles</strong>. We are expanding to additional markets based on user demand.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Built By</h2>
            <p className="text-gray-700 mb-4">
              <strong>Martin Petrov</strong> — data scientist, builder, based in Sofia.
            </p>
            <p className="text-gray-700">
              I built aimeajob because I saw too many talented people waste time on job searches that should be automated. The technology exists to do this better, so I built it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Open Source</h2>
            <p className="text-gray-700 mb-4">
              Parts of this project are open source. You can follow development and contribute on GitHub:
            </p>
            <a 
              href="https://github.com/MartinPetrov8/AI-me-a-job"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View on GitHub
              <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700">
              Questions, feedback, or partnership inquiries? Reach out at{' '}
              <a href="mailto:support@aimeajob.com" className="text-indigo-600 hover:text-indigo-700">
                support@aimeajob.com
              </a>
            </p>
          </section>
        </div>

        <div className="text-center">
          <Link
            href="/upload"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-4 font-medium text-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
