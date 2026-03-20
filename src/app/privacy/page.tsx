export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-gray-600 mb-6">
            Last updated: March 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Controller</h2>
            <p className="text-gray-700 mb-2">
              <strong>Martin Petrov</strong><br />
              Sofia, Bulgaria<br />
              Contact: <a href="mailto:support@aimeajob.com" className="text-indigo-600 hover:text-indigo-700">support@aimeajob.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Data We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect and process the following personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Email address (for account creation and authentication)</li>
              <li>CV text content (processed and deleted by default after extraction)</li>
              <li>Job preferences and search criteria</li>
              <li>Usage data and analytics</li>
            </ul>
            <p className="text-gray-700">
              <strong>Optional:</strong> CV storage is only enabled with your explicit consent for ongoing job recommendations. You can opt in or out at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why We Collect Data</h2>
            <p className="text-gray-700 mb-4">
              We use your data for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Match your skills and experience with relevant job opportunities</li>
              <li>Provide personalized job recommendations</li>
              <li>Improve our service and AI matching algorithms</li>
              <li>Communicate important updates about your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">
              We process your data under the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Consent:</strong> CV upload and processing</li>
              <li><strong>Contract:</strong> Providing our service, subscription management</li>
              <li><strong>Legitimate interest:</strong> Service improvement and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Processors</h2>
            <p className="text-gray-700 mb-4">
              We work with the following third-party processors:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Supabase</strong> (EU) — Database and authentication</li>
              <li><strong>Vercel</strong> (US/EU) — Hosting and infrastructure</li>
              <li><strong>Stripe</strong> (US) — Payment processing (future)</li>
              <li><strong>OpenRouter</strong> (US) — AI processing for job matching</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700">
              Your profile data is kept until you delete your account. CV text is deleted immediately after extraction unless you explicitly opt in to storage for ongoing recommendations. You can request deletion of all your data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights (GDPR)</h2>
            <p className="text-gray-700 mb-4">
              Under GDPR Articles 13-22, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a structured format</li>
              <li><strong>Restrict processing:</strong> Limit how we use your data</li>
              <li><strong>Object:</strong> Object to certain types of processing</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise any of these rights, contact us at <a href="mailto:support@aimeajob.com" className="text-indigo-600 hover:text-indigo-700">support@aimeajob.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
            <p className="text-gray-700">
              We use session cookies only for authentication and functionality. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
            <p className="text-gray-700">
              Some of our processors are located in the United States. Where data is transferred outside the EU, we ensure appropriate safeguards are in place, including EU Standard Contractual Clauses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify users of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this privacy policy or how we handle your data, please contact us at <a href="mailto:support@aimeajob.com" className="text-indigo-600 hover:text-indigo-700">support@aimeajob.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
