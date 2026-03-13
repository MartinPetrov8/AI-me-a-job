'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TagInput from '@/components/tag-input';
import {
  YEARS_EXPERIENCE,
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE,
  SENIORITY_LEVELS,
  INDUSTRIES,
} from '@/lib/criteria';

interface ProfileData {
  id: string;
  userId: string;
  yearsExperience: string | null;
  educationLevel: string | null;
  fieldOfStudy: string | null;
  sphereOfExpertise: string | null;
  seniorityLevel: string | null;
  languages: string[] | null;
  industry: string | null;
  keySkills: string[] | null;
}

function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');
  const profileId = searchParams.get('profile_id');
  const token = searchParams.get('token');

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [yearsExperience, setYearsExperience] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [sphereOfExpertise, setSphereOfExpertise] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [keySkills, setKeySkills] = useState<string[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) {
      setError('Missing user_id parameter');
      setFetching(false);
      return;
    }

    async function fetchProfile() {
      try {
        const response = await fetch(`/api/profile?user_id=${userId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch profile');
        }

        const data = await response.json();
        const p = data.data;
        setProfile(p);

        // API returns criteria nested under data.criteria (snake_case)
        const c = p.criteria || p;
        setYearsExperience(c.years_experience || c.yearsExperience || '');
        setEducationLevel(c.education_level || c.educationLevel || '');
        setFieldOfStudy(c.field_of_study || c.fieldOfStudy || '');
        setSphereOfExpertise(c.sphere_of_expertise || c.sphereOfExpertise || '');
        setSeniorityLevel(c.seniority_level || c.seniorityLevel || '');
        setLanguages(c.languages || []);
        setIndustry(c.industry || '');
        setKeySkills(c.key_skills || c.keySkills || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setFetching(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    if (!yearsExperience) errors.yearsExperience = 'Years of experience is required';
    if (!educationLevel) errors.educationLevel = 'Education level is required';
    if (!fieldOfStudy) errors.fieldOfStudy = 'Field of study is required';
    if (!sphereOfExpertise) errors.sphereOfExpertise = 'Sphere of expertise is required';
    if (!seniorityLevel) errors.seniorityLevel = 'Seniority level is required';
    if (languages.length === 0) errors.languages = 'At least one language is required';
    if (!industry) errors.industry = 'Industry is required';
    if (keySkills.length === 0) errors.keySkills = 'At least one key skill is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          userId,
          yearsExperience,
          educationLevel,
          fieldOfStudy,
          sphereOfExpertise,
          seniorityLevel,
          languages,
          industry,
          keySkills,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await response.json();
      const updatedProfileId = data.data.id;
      router.push(`/preferences?user_id=${userId}&profile_id=${updatedProfileId}&token=${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      setSaving(false);
    }
  };

  if (error && !profile && !fetching) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-6">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (fetching) return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <nav className="bg-white border-b border-gray-100"><div className="max-w-2xl mx-auto px-6 py-4"><span className="text-xl font-bold text-indigo-600">aimeajob</span></div></nav>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        <div className="h-7 w-40 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-56 bg-gray-200 animate-pulse rounded-md" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 mt-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] pb-24">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">aimeajob</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Upload', 'Profile', 'Preferences', 'Results'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 1 ? 'bg-indigo-600 text-white' : i < 1 ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-400'}`}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">AI extracted this from your CV. Correct anything before searching.</p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-sm text-red-700">{error}</p></div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">AI Detected</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: yearsExperience || 'Experience?', filled: !!yearsExperience },
                { label: educationLevel || 'Education?', filled: !!educationLevel },
                { label: sphereOfExpertise || 'Sphere?', filled: !!sphereOfExpertise },
                { label: seniorityLevel || 'Seniority?', filled: !!seniorityLevel },
                { label: industry || 'Industry?', filled: !!industry },
              ].map(({ label, filled }) => (
                <span key={label} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${filled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {filled ? '✓ ' : ''}{label}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
              <select value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {YEARS_EXPERIENCE.map((v) => <option key={v} value={v}>{v} years</option>)}
              </select>
              {fieldErrors.yearsExperience && <p className="text-red-500 text-xs mt-1">{fieldErrors.yearsExperience}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level *</label>
              <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {EDUCATION_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.educationLevel && <p className="text-red-500 text-xs mt-1">{fieldErrors.educationLevel}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study *</label>
              <select value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {FIELDS_OF_STUDY.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.fieldOfStudy && <p className="text-red-500 text-xs mt-1">{fieldErrors.fieldOfStudy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sphere of Expertise *</label>
              <select value={sphereOfExpertise} onChange={e => setSphereOfExpertise(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {SPHERES_OF_EXPERTISE.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.sphereOfExpertise && <p className="text-red-500 text-xs mt-1">{fieldErrors.sphereOfExpertise}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seniority Level *</label>
              <select value={seniorityLevel} onChange={e => setSeniorityLevel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {SENIORITY_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.seniorityLevel && <p className="text-red-500 text-xs mt-1">{fieldErrors.seniorityLevel}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select...</option>
                {INDUSTRIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {fieldErrors.industry && <p className="text-red-500 text-xs mt-1">{fieldErrors.industry}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages *</label>
              <TagInput value={languages} onChange={setLanguages} placeholder="Type a language and press Enter" />
              {fieldErrors.languages && <p className="text-red-500 text-xs mt-1">{fieldErrors.languages}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Skills *</label>
              <TagInput value={keySkills} onChange={setKeySkills} placeholder="Type a skill and press Enter" />
              {fieldErrors.keySkills && <p className="text-red-500 text-xs mt-1">{fieldErrors.keySkills}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          <button type="button" onClick={() => handleSubmit()} disabled={saving}
            className="w-full bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
            {saving ? 'Saving…' : 'Looks good → Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F5]">
        <nav className="bg-white border-b border-gray-100"><div className="max-w-2xl mx-auto px-6 py-4"><span className="text-xl font-bold text-indigo-600">aimeajob</span></div></nav>
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
          <div className="h-7 w-40 bg-gray-200 animate-pulse rounded-md" />
          <div className="h-4 w-56 bg-gray-200 animate-pulse rounded-md" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 mt-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        </div>
      </div>
    }>
      <ProfileForm />
    </Suspense>
  );
}
