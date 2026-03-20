import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">Page not found</h2>
        <p className="text-lg text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-medium"
          >
            Go back home
          </Link>
          <Link
            href="/upload"
            className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl px-6 py-3 font-medium"
          >
            Upload your CV
          </Link>
        </div>
      </div>
    </div>
  );
}
