'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) { setFile(selectedFile); setError(null); }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' ||
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(droppedFile); setError(null);
    } else {
      setError('Please upload a PDF or DOCX file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Upload failed'); setLoading(false); return; }
      router.push(`/profile?user_id=${data.data.user_id}&profile_id=${data.data.profile_id}&token=${data.data.restore_token}`);
    } catch {
      setError('An error occurred during upload'); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-[#6366F1]">aimeajob</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 mt-16">
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload your CV</h1>
          <p className="text-gray-500 mb-8">PDF or DOCX · Max 10MB · Results in ~30 seconds</p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-[#6366F1] bg-indigo-50' 
                : file 
                ? 'border-[#6366F1] bg-indigo-50'
                : 'border-gray-300 hover:border-[#6366F1] hover:bg-indigo-50'
            }`}
          >
            <input type="file" id="file-input" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-input" className="cursor-pointer block">
              {file ? (
                <>
                  <svg className="w-12 h-12 text-[#10B981] mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium text-gray-700">Drop your CV here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-2 mt-6 justify-center">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">PDF</span>
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">DOCX</span>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="mt-8 w-full bg-[#6366F1] text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analysing your CV...
              </span>
            ) : (
              'Analyse & Find Jobs →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
