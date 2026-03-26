export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string };
}) {
  const error = searchParams.error ?? 'unknown_error';
  const description = searchParams.error_description ?? 'An unexpected error occurred during authentication.';

  const friendlyMessages: Record<string, string> = {
    access_denied: 'You cancelled the sign-in. No worries — try again when you\'re ready.',
    server_error: 'Something went wrong on our end. Please try again in a moment.',
    temporarily_unavailable: 'Authentication is temporarily unavailable. Please try again shortly.',
    invalid_request: 'The sign-in link was invalid or has expired.',
  };

  const message = friendlyMessages[error] ?? description;

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <a
          href="/login"
          className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Try again
        </a>
      </div>
    </div>
  );
}
