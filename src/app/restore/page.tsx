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
    <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-indigo-600">aimeajob</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email and restore code</p>
          </div>

          <form onSubmit={handleRestore} className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                id="token"
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                placeholder="Enter your 24-character code"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Restoring your profile...' : 'Restore Profile'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here?{' '}
          <Link href="/upload" className="text-indigo-600 hover:underline font-medium">
            Upload your CV instead
          </Link>
        </p>
      </div>
    </main>
  );
}
