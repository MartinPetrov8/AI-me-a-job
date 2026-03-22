import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getSubscriptionStatus } from '@/lib/stripe/subscription';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    
    if (!auth?.userId) {
      // Return free tier for unauthenticated users
      return NextResponse.json({
        status: 'free',
      });
    }

    const status = await getSubscriptionStatus(auth.userId);

    return NextResponse.json({
      status,
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({
      status: 'free',
    });
  }
}
