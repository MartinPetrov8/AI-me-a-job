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
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
          <span className="ml-4 text-sm text-gray-500">Step 3 of 3</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Set your preferences</h1>
          <p className="text-gray-600">All fields are optional</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pb-8">
          {/* Employment Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">What type of role?</h2>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleEmploymentTypeChange(type)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    employmentTypes.includes(type)
                      ? 'bg-[#6366F1] text-white border-[#6366F1]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#6366F1]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Work Mode */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Work mode?</h2>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setWorkMode(workMode === mode ? '' : mode)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    workMode === mode
                      ? 'bg-[#6366F1] text-white border-[#6366F1]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#6366F1]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Preferred location</h2>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. London, UK or Remote"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
            />
          </div>

          {/* Salary Range */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Salary range (optional)</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="Minimum"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Maximum"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Relocation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Open to relocation?</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRelocation(relocation === true ? null : true)}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  relocation === true
                    ? 'bg-[#6366F1] text-white border-[#6366F1]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#6366F1]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRelocation(relocation === false ? null : false)}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  relocation === false
                    ? 'bg-[#6366F1] text-white border-[#6366F1]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#6366F1]'
                }`}
              >
                No
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#6366F1] text-white py-4 px-4 rounded-2xl font-semibold text-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Find my matches →'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-gray-500 text-sm py-2 hover:text-gray-700"
          >
            Skip and see all matches
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F5] p-4 flex justify-center items-center">Loading...</div>}>
      <PreferencesForm />
    </Suspense>
  );
}
