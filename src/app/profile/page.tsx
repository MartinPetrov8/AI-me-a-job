'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  const [loading, setLoading] = useState(true);
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
      setLoading(false);
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
        setLoading(false);
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

  const isFormComplete = 
    yearsExperience &&
    educationLevel &&
    fieldOfStudy &&
    sphereOfExpertise &&
    seniorityLevel &&
    languages.length > 0 &&
    industry &&
    keySkills.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const getFieldClass = (value: string | string[], fieldName: string) => {
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    return isEmpty
      ? 'bg-yellow-50 border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none'
      : 'border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold mb-8 text-gray-900">Review Your Profile</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Years Experience */}
            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-medium mb-2">
                Years of Experience *
              </label>
              <select
                id="yearsExperience"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className={getFieldClass(yearsExperience, 'yearsExperience')}
              >
                <option value="">
                  {!profile?.yearsExperience ? 'Not detected — please select' : 'Select...'}
                </option>
                {YEARS_EXPERIENCE.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
              {fieldErrors.yearsExperience && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.yearsExperience}</p>
              )}
            </div>

            {/* Education Level */}
            <div>
              <label htmlFor="educationLevel" className="block text-sm font-medium mb-2">
                Education Level *
              </label>
              <select
                id="educationLevel"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className={getFieldClass(educationLevel, 'educationLevel')}
              >
                <option value="">
                  {!profile?.educationLevel ? 'Not detected — please select' : 'Select...'}
                </option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {fieldErrors.educationLevel && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.educationLevel}</p>
              )}
            </div>

            {/* Field of Study */}
            <div>
              <label htmlFor="fieldOfStudy" className="block text-sm font-medium mb-2">
                Field of Study *
              </label>
              <select
                id="fieldOfStudy"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className={getFieldClass(fieldOfStudy, 'fieldOfStudy')}
              >
                <option value="">
                  {!profile?.fieldOfStudy ? 'Not detected — please select' : 'Select...'}
                </option>
                {FIELDS_OF_STUDY.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              {fieldErrors.fieldOfStudy && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.fieldOfStudy}</p>
              )}
            </div>

            {/* Sphere of Expertise */}
            <div>
              <label htmlFor="sphereOfExpertise" className="block text-sm font-medium mb-2">
                Sphere of Expertise *
              </label>
              <select
                id="sphereOfExpertise"
                value={sphereOfExpertise}
                onChange={(e) => setSphereOfExpertise(e.target.value)}
                className={getFieldClass(sphereOfExpertise, 'sphereOfExpertise')}
              >
                <option value="">
                  {!profile?.sphereOfExpertise ? 'Not detected — please select' : 'Select...'}
                </option>
                {SPHERES_OF_EXPERTISE.map((sphere) => (
                  <option key={sphere} value={sphere}>
                    {sphere}
                  </option>
                ))}
              </select>
              {fieldErrors.sphereOfExpertise && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.sphereOfExpertise}</p>
              )}
            </div>

            {/* Seniority Level */}
            <div>
              <label htmlFor="seniorityLevel" className="block text-sm font-medium mb-2">
                Seniority Level *
              </label>
              <select
                id="seniorityLevel"
                value={seniorityLevel}
                onChange={(e) => setSeniorityLevel(e.target.value)}
                className={getFieldClass(seniorityLevel, 'seniorityLevel')}
              >
                <option value="">
                  {!profile?.seniorityLevel ? 'Not detected — please select' : 'Select...'}
                </option>
                {SENIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {fieldErrors.seniorityLevel && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.seniorityLevel}</p>
              )}
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium mb-2">Languages *</label>
              <TagInput
                value={languages}
                onChange={setLanguages}
                placeholder="Enter a language and press Add or Enter"
              />
              {fieldErrors.languages && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.languages}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium mb-2">
                Industry *
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={getFieldClass(industry, 'industry')}
              >
                <option value="">
                  {!profile?.industry ? 'Not detected — please select' : 'Select...'}
                </option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {fieldErrors.industry && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.industry}</p>
              )}
            </div>

            {/* Key Skills */}
            <div>
              <label className="block text-sm font-medium mb-2">Key Skills * (max 10)</label>
              <TagInput
                value={keySkills}
                onChange={setKeySkills}
                max={10}
                placeholder="Enter a skill and press Add or Enter"
              />
              {fieldErrors.keySkills && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.keySkills}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormComplete || saving}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg py-3 px-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Confirm & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfileForm />
    </Suspense>
  );
}
