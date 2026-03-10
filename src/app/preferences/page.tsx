'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WORK_MODES, EMPLOYMENT_TYPES } from '@/lib/criteria';

function PreferencesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');
  const profileId = searchParams.get('profile_id');
  const token = searchParams.get('token');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [relocation, setRelocation] = useState<boolean | null>(null);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('EUR');

  const handleEmploymentTypeChange = (type: string) => {
    setEmploymentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        profileId,
      };

      if (employmentTypes.length > 0) {
        body.prefEmploymentType = employmentTypes;
      }
      if (location.trim()) {
        body.prefLocation = location.trim();
      }
      if (workMode) {
        body.prefWorkMode = workMode;
      }
      if (relocation !== null) {
        body.prefRelocation = relocation;
      }
      if (salaryMin) {
        body.prefSalaryMin = parseInt(salaryMin, 10);
      }
      if (salaryMax) {
        body.prefSalaryMax = parseInt(salaryMax, 10);
      }
      if (salaryMin || salaryMax) {
        body.prefSalaryCurrency = salaryCurrency;
      }

      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }

      router.push(`/results?user_id=${userId}&profile_id=${profileId}&token=${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push(`/results?user_id=${userId}&profile_id=${profileId}&token=${token}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold mb-6">Job Preferences</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            All fields are optional. You can skip this step or fill in your preferences to get better matches.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Employment Type</label>
              <div className="space-y-2">
                {EMPLOYMENT_TYPES.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={employmentTypes.includes(type)}
                      onChange={() => handleEmploymentTypeChange(type)}
                      className="mr-2 h-5 w-5"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Berlin, Germany or Anywhere"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Work Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Work Mode</label>
              <div className="space-y-2">
                {WORK_MODES.map((mode) => (
                  <label key={mode} className="flex items-center">
                    <input
                      type="radio"
                      name="workMode"
                      value={mode}
                      checked={workMode === mode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="mr-2 h-5 w-5"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Relocation */}
            <div>
              <label className="block text-sm font-medium mb-2">Open to Relocation</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocation"
                    value="yes"
                    checked={relocation === true}
                    onChange={() => setRelocation(true)}
                    className="mr-2 h-5 w-5"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocation"
                    value="no"
                    checked={relocation === false}
                    onChange={() => setRelocation(false)}
                    className="mr-2 h-5 w-5"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Salary Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="Minimum"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Maximum"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-2">
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-3 px-4"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg py-3 px-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Find Jobs'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">Loading...</div>}>
      <PreferencesForm />
    </Suspense>
  );
}
