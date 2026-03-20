export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-gray-600 mb-6">
            Last updated: March 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Description</h2>
            <p className="text-gray-700">
              aimeajob is an AI-powered job matching platform that analyzes your CV and matches you with relevant job opportunities across Europe. We use artificial intelligence to understand your skills and experience, then rank available positions by compatibility.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility</h2>
            <p className="text-gray-700 mb-4">
              To use our service, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete information</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
            <p className="text-gray-700 mt-4">
              One account per person. Sharing accounts is prohibited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free and Paid Tiers</h2>
            <p className="text-gray-700 mb-4">
              We offer two service tiers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Free:</strong> Access to top 5 job matches</li>
              <li><strong>Pro (€5/month):</strong> All job matches, weekly digest, priority support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Terms</h2>
            <p className="text-gray-700 mb-4">
              For Pro subscriptions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Subscriptions auto-renew monthly unless cancelled</li>
              <li>You can cancel at any time — no questions asked</li>
              <li>No refunds for partial months</li>
              <li>Cancellations take effect at the end of the current billing period</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Scrape or automatically collect data from our platform</li>
              <li>Submit fake or misleading CVs</li>
              <li>Use automated tools or bots for bulk access</li>
              <li>Reverse engineer our AI matching algorithms</li>
              <li>Violate any laws or regulations</li>
              <li>Interfere with other users or our service infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700">
              We own the platform, algorithms, and all related intellectual property. You retain ownership of your CV and personal data. By uploading content, you grant us a license to process it for the purpose of providing our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
            <p className="text-gray-700">
              Job matching is informational only. We do not guarantee employment, interview invitations, or specific outcomes. Job postings are sourced from third parties and we are not responsible for their accuracy or availability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700">
              Our maximum liability to you for any claim is limited to the amount you paid us in the last 12 months. We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Suspend or terminate accounts for violations of these terms</li>
              <li>Refuse service to anyone for any reason</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can delete your account at any time from your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700">
              These terms are governed by the laws of the Republic of Bulgaria. Any disputes shall be resolved in the courts of Sofia, Bulgaria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>
            <p className="text-gray-700">
              Before initiating formal legal proceedings, we encourage you to contact us to attempt good-faith negotiation and resolution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700">
              Questions about these terms? Contact us at <a href="mailto:support@aimeajob.com" className="text-indigo-600 hover:text-indigo-700">support@aimeajob.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
