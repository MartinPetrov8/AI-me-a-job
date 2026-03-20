'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/account/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aimeajob-data-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      });
      if (response.ok) {
        await signOut();
        router.push('/');
      }
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Info
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member since
                </label>
                <p className="mt-1 text-gray-900">{memberSince}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current plan
                </label>
                <p className="mt-1 text-gray-900">Free</p>
              </div>
              <button
                disabled
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium opacity-50 cursor-not-allowed"
              >
                Manage subscription (Coming soon)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Job Digest
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Weekly email digest
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Coming soon
                </p>
              </div>
              <button
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-not-allowed opacity-50"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Data &amp; Privacy
            </h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  {isExporting ? 'Downloading...' : 'Download my data'}
                </button>
                <p className="text-sm text-gray-500 mt-1">
                  Export all your data in JSON format
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete my account
                </button>
                <p className="text-sm text-gray-500 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Delete Account
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure? This will permanently delete your account and all
              data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete permanently'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-6 py-3 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
