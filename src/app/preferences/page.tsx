'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

      const restoreToken = localStorage.getItem('restore_token');
      if (!restoreToken) {
        window.location.href = '/restore';
        return;
      }
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Restore-Token': restoreToken,
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
    <div className="min-h-screen bg-[#F7F7F5] pb-24">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">aimeajob</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Upload', 'Profile', 'Preferences', 'Results'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 2 ? 'bg-indigo-600 text-white' : i < 2 ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-400'}`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Preferences</h1>
          <p className="text-gray-500 text-sm mt-1">Optional — skip to see all matches.</p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-sm text-red-700">{error}</p></div>}

        <form id="prefs-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Employment Type</label>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT_TYPES.map(type => (
                  <button key={type} type="button" onClick={() => handleEmploymentTypeChange(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${employmentTypes.includes(type) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Work Mode</label>
              <div className="flex gap-2">
                {WORK_MODES.map(mode => (
                  <button key={mode} type="button" onClick={() => setWorkMode(mode === workMode ? '' : mode)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${workMode === mode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. London, Remote UK, Sofia"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Open to Relocation?</label>
              <div className="flex gap-3">
                {([{ label: 'Yes', val: true }, { label: 'No', val: false }] as const).map(({ label, val }) => (
                  <button key={label} type="button" onClick={() => setRelocation(relocation === val ? null : val)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${relocation === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Salary Range</label>
              <div className="flex items-center gap-3">
                <select value={salaryCurrency} onChange={e => setSalaryCurrency(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-24">
                  {['EUR', 'GBP', 'USD'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min" min="0"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-gray-400">–</span>
                <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max" min="0"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button type="button" onClick={handleSkip}
            className="px-5 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors">
            Skip
          </button>
          <button type="submit" form="prefs-form" disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
            {saving ? 'Saving…' : 'Find My Jobs →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F5]">
        <nav className="bg-white border-b border-gray-100"><div className="max-w-lg mx-auto px-6 py-4"><span className="text-xl font-bold text-indigo-600">aimeajob</span></div></nav>
        <div className="max-w-lg mx-auto px-6 py-8 space-y-3">
          <div className="h-7 w-40 bg-gray-200 animate-pulse rounded-md" />
          <div className="h-4 w-56 bg-gray-200 animate-pulse rounded-md" />
        </div>
      </div>
    }>
      <PreferencesForm />
    </Suspense>
  );
}
