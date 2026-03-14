'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RestorePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, restore_token: token }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store restore_token in localStorage for subsequent authenticated requests
        if (data.data.restore_token) {
          localStorage.setItem('restore_token', data.data.restore_token);
        }
        router.push(`/results?profile_id=${data.data.profile_id}`);
      } else {
        setError('Profile not found. Check your email and restore code.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-bold text-indigo-600">aimeajob</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restore your profile</h1>
        <p className="text-gray-500 mb-6 text-sm">Enter the email and restore code you saved previously.</p>

        <form onSubmit={handleRestore} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Restore code
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              placeholder="a7x9k2m4p1q8"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Restoring...' : 'Restore My Profile'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        No restore code?{' '}
        <Link href="/upload" className="text-indigo-600 hover:underline">
          Upload your CV instead
        </Link>
      </p>
    </main>
  );
}
