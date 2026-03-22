import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Routes that require authentication
const PROTECTED_PATHS = [
  '/results',
  '/profile',
  '/preferences',
  '/account',
  '/api/stripe/checkout',
  '/api/stripe/portal',
];

// Routes that are always public (no auth required)
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/restore',
  '/pricing',
  '/api/stripe/webhook',
  '/api/pipeline',
  '/api/health',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );
}

export async function middleware(request: NextRequest) {
  const rateLimit = checkRateLimit(request.nextUrl.pathname, request.headers);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimit.retryAfter.toString(),
        },
      }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Graceful fallback — skip auth when Supabase env vars missing
  // (allows builds/deploys without env vars configured)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
