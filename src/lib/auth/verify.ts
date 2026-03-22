import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export interface AuthResult {
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Verify Supabase auth from request cookies
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult | null> {
  try {
    // Skip if Supabase not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // setAll throws in some environments — ignore
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
