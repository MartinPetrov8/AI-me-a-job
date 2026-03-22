'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">aimeajob</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600">Find your next job opportunity</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free tier */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
            <p className="text-gray-600 mb-6">Get started with job matching</p>
            
            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">€0<span className="text-lg text-gray-500">/month</span></p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">Top 5 job matches</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700">CV analysis</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-400 font-bold">✗</span>
                <span className="text-gray-500">All matches</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-400 font-bold">✗</span>
                <span className="text-gray-500">Weekly digest</span>
              </li>
            </ul>

            <Link
              href="/upload"
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-center block"
            >
              Get started
            </Link>
          </div>

          {/* Pro tier */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8 shadow-md ring-2 ring-indigo-600 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most popular
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro</h2>
            <p className="text-gray-600 mb-6">Unlock all opportunities</p>
            
            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">€5<span className="text-lg text-gray-500">/month</span></p>
              <p className="text-sm text-gray-600 mt-2">Billed monthly, cancel anytime</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700 font-medium">All job matches</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700 font-medium">CV analysis</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700 font-medium">Weekly digest</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-gray-700 font-medium">Priority support</span>
              </li>
            </ul>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? 'Starting checkout...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes, you can cancel your Pro subscription at any time from your account settings. No lock-in period.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards (Visa, Mastercard, Amex) via Stripe.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Yes, start with our Free tier to try job matching without payment.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I upgrade from Free to Pro?</h4>
              <p className="text-gray-600">Absolutely! Upgrade anytime from the results page or pricing page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
