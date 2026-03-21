import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About aimeajob</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Built by a Data Scientist tired of bad job matching</h2>
            <p className="text-gray-700 mb-4">
              Traditional job boards are broken. They prioritize sponsored listings over real fit. Keyword matching misses context. "Relevance" rankings are fake — companies pay to appear first, not because they match your skills.
            </p>
            <p className="text-gray-700">
              I spent years watching talented people waste weeks scrolling through noise, applying to jobs that were never a good match. The technology to fix this exists. So I built it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              Make job search honest — no sponsored noise, just real fit scored by 8 criteria
            </p>
            <p className="text-gray-700">
              We rank jobs based on how well they match your profile across 8 criteria: skills, experience, location, salary, work mode, seniority, language, and industry. No pay-to-play. No fake relevance. Just math.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tech Transparency</h2>
            <p className="text-gray-700 mb-4">
              We use AI to extract your profile from your CV (PDF or DOCX). Then we scan <strong>12 sources</strong> covering Bulgaria, Romania, Poland, Germany, Netherlands, France, UK, and remote-first Europe.
            </p>
            <p className="text-gray-700 mb-4">
              Jobs are refreshed via <strong>daily refresh at 09:00 UTC</strong> from all 12 boards. Each job is scored against your profile using our 8-criteria matching engine.
            </p>
            <p className="text-gray-700">
              No black boxes. No hidden algorithms. Just transparent, explainable AI that shows you why each job matches.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Team</h2>
            <p className="text-gray-700">
              Small team, big mission. We're data scientists and engineers who believe job search should be solved, not monetized through sponsored noise.
            </p>
          </section>

        </div>

        <div className="text-center">
          <Link
            href="/upload"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-4 font-medium text-lg"
          >
            Try it free — upload your CV →
          </Link>
        </div>
      </div>
    </div>
  );
}
