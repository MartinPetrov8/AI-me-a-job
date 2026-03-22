'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AccountInfo {
  email: string;
  subscriptionStatus: 'free' | 'pro' | 'past_due';
  subscriptionExpiresAt?: string | null;
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadAccount() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?redirect=/account');
          return;
        }

        const res = await fetch('/api/subscription/status');
        const data = await res.json();

        setAccount({
          email: user.email ?? '',
          subscriptionStatus: data.status ?? 'free',
          subscriptionExpiresAt: data.expiresAt ?? null,
        });
      } catch (err) {
        setError('Failed to load account details.');
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  const handleManageBilling = async () => {
    setActionLoading('billing');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Could not open billing portal.');
      }
    } catch {
      setError('Billing portal unavailable. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleExportData = async () => {
    setActionLoading('export');
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to permanently delete your account? This cannot be undone.'
      )
    ) {
      return;
    }
    setActionLoading('delete');
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setError('Account deletion failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading account…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

        {error && (
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {account && (
          <>
            {/* Profile info */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Profile
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Email</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {account.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Plan</span>
                  <span
                    className={`text-sm font-semibold ${
                      account.subscriptionStatus === 'pro'
                        ? 'text-indigo-600'
                        : account.subscriptionStatus === 'past_due'
                        ? 'text-red-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {account.subscriptionStatus === 'pro'
                      ? 'Pro'
                      : account.subscriptionStatus === 'past_due'
                      ? 'Past Due'
                      : 'Free'}
                  </span>
                </div>
                {account.subscriptionStatus === 'pro' && account.subscriptionExpiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Renews</span>
                    <span className="text-gray-900 text-sm">
                      {new Date(account.subscriptionExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Billing */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Billing
              </h2>
              <button
                onClick={handleManageBilling}
                disabled={!!actionLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'billing' ? 'Opening…' : 'Manage Billing'}
              </button>
            </section>

            {/* Data */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Your Data
              </h2>
              <button
                onClick={handleExportData}
                disabled={!!actionLoading}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'export' ? 'Exporting…' : 'Export Data'}
              </button>
            </section>

            {/* Danger zone */}
            <section>
              <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">
                Danger Zone
              </h2>
              <button
                onClick={handleDeleteAccount}
                disabled={!!actionLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'delete' ? 'Deleting…' : 'Delete Account'}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
