import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-500">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
              <div className="text-4xl font-bold text-gray-900">
                €0<span className="text-lg text-gray-500 font-normal">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Upload CV</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">AI profile extraction</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Top 5 job matches</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">All job matches</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Weekly job digest</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">Priority support</span>
              </li>
            </ul>

            <Link
              href="/upload"
              className="block w-full text-center bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl px-6 py-3 font-medium hover:bg-indigo-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          <div className="bg-indigo-600 text-white rounded-2xl shadow-lg p-6 relative md:scale-105">
            <div className="absolute top-0 right-6 -mt-4">
              <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="text-4xl font-bold">
                €5<span className="text-lg font-normal opacity-90">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>All job matches</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Weekly job digest</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support</span>
              </li>
            </ul>

            <button
              disabled
              className="block w-full text-center bg-white/20 text-white rounded-xl px-6 py-3 font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>

            <p className="text-center text-sm mt-4 opacity-90">
              Cancel anytime. No commitment.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after 5 free matches?
              </h3>
              <p className="text-gray-600">
                You can continue using the free tier with access to your top 5 matches. To see all available matches and receive weekly job digests, upgrade to Pro for €5/month.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, absolutely. There is no commitment. You can cancel your subscription at any time and you will not be charged for the next billing cycle.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                Credit card via Stripe (coming soon). We will support all major credit and debit cards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
