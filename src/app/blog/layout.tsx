import Link from 'next/link';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-8 text-sm text-gray-600">
          <Link href="/" className="hover:text-indigo-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Blog</span>
        </nav>

        {children}

        <div className="mt-16 rounded-2xl bg-white p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold text-gray-900">
            Ready to find your perfect job?
          </h3>
          <p className="mb-6 text-gray-600">
            Upload your CV and get matched with the best opportunities in minutes.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
