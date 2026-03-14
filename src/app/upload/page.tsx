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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Upload failed'); setLoading(false); return; }
      // Store restore_token in localStorage for subsequent authenticated requests
      if (data.data.restore_token) {
        localStorage.setItem('restore_token', data.data.restore_token);
      }
      router.push(`/profile?user_id=${data.data.user_id}&profile_id=${data.data.profile_id}&token=${data.data.restore_token}`);
    } catch {
      setError('An error occurred during upload'); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">aimeajob</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="flex items-center justify-center gap-2 mb-10">
          {['Upload', 'Profile', 'Preferences', 'Results'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
              <span className={`text-xs font-medium hidden sm:block ${i === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your CV</h1>
          <p className="text-gray-500">PDF or DOCX · Max 10MB · AI analyses in ~30 seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              dragActive ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
              : file ? 'border-indigo-300 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <input type="file" id="file-input" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-input" className="cursor-pointer block">
              {file ? (
                <>
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-indigo-700 text-lg">{file.name}</p>
                  <p className="text-sm text-indigo-500 mt-1">Click to change file</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="font-semibold text-gray-700 text-lg">Drop your CV here</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">PDF</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">DOCX</span>
                  </div>
                </>
              )}
            </label>
          </div>

          {error && <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100"><p className="text-sm text-red-700">{error}</p></div>}

          {loading && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Analysing your CV…</span>
                <span className="text-indigo-600 font-medium">AI reading</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"
                  style={{ width: '40%', animation: 'indeterminate 1.5s ease-in-out infinite' }} />
              </div>
              <style>{`
                @keyframes indeterminate {
                  0% { transform: translateX(-100%) scaleX(0.5); }
                  50% { transform: translateX(100%) scaleX(0.8); }
                  100% { transform: translateX(250%) scaleX(0.5); }
                }
              `}</style>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="mt-6 w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analysing…' : 'Analyse & Find Jobs →'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
          <span>🔒 Secure upload</span>
          <span>🚫 No registration</span>
          <span>⚡ 30 second results</span>
        </div>
      </div>
    </div>
  );
}
