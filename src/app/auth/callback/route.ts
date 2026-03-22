import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    // Password recovery → go to settings
    if (type === 'recovery') {
      return NextResponse.redirect(`${requestUrl.origin}/settings`);
    }

    // After OAuth: check if user already has a profile
    // If yes → /results, if no → /upload (start fresh)
    const userId = sessionData?.user?.id;
    if (userId) {
      try {
        const profileRes = await fetch(
          `${requestUrl.origin}/api/profile?user_id=${encodeURIComponent(userId)}`
        );
        if (profileRes.ok) {
          // Existing user with a profile
          return NextResponse.redirect(`${requestUrl.origin}/results`);
        }
      } catch {
        // Network error — fall through to /upload
      }
      // New user or no profile yet
      return NextResponse.redirect(`${requestUrl.origin}/upload`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/results`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
