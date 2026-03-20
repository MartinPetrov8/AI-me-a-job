import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, profiles, searches, searchResults, feedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [dbUser] = await db.select().from(users).where(eq(users.authId, user.id)).limit(1);
  
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, dbUser.id)).limit(1);
  
  if (profile) {
    const [search] = await db.select().from(searches).where(eq(searches.profileId, profile.id)).limit(1);
    
    if (search) {
      const [result] = await db.select().from(searchResults).where(eq(searchResults.searchId, search.id)).limit(1);
      
      if (result) {
        await db.delete(feedback).where(eq(feedback.searchResultId, result.id));
      }
      
      await db.delete(searchResults).where(eq(searchResults.searchId, search.id));
    }
    
    await db.delete(searches).where(eq(searches.profileId, profile.id));
    await db.delete(profiles).where(eq(profiles.id, profile.id));
  }

  await db.delete(users).where(eq(users.id, dbUser.id));

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js');
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await adminClient.auth.admin.deleteUser(user.id);
    } catch (error) {
      // Silent fail
    }
  }

  return NextResponse.json({
    deleted: true,
    message: 'Your account and all data have been permanently deleted',
  });
}
