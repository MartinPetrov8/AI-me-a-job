'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restore your profile</h1>
          <p className="text-gray-600 mb-6 text-sm">Enter the email and restore code you saved previously.</p>

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Restoring...' : 'Restore My Profile'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
