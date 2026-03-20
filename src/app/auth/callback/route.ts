import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${requestUrl.origin}/settings`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/results`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
