import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(
      `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Invalid Request</title></head>
<body style="font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
  <h1>Invalid Request</h1>
  <p>Missing unsubscribe token.</p>
</body>
</html>
      `.trim(),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const result = await db
      .update(users)
      .set({ email: null })
      .where(eq(users.restoreToken, token))
      .returning({ id: users.id });

    if (result.length === 0) {
      return new Response(
        `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Invalid Token</title></head>
<body style="font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
  <h1>Invalid Token</h1>
  <p>The unsubscribe link is invalid or has already been used.</p>
</body>
</html>
        `.trim(),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response(
      `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
  <h1>You have been unsubscribed from weekly job digests.</h1>
  <p>You will no longer receive weekly email notifications.</p>
  <p>You can still access your matches by logging into your account.</p>
</body>
</html>
      `.trim(),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err: any) {
    console.error('[api/unsubscribe] Error:', err);
    return new Response(
      `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Error</title></head>
<body style="font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
  <h1>Error</h1>
  <p>An error occurred while processing your request.</p>
</body>
</html>
      `.trim(),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
