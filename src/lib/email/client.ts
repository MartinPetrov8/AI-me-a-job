import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — stub mode, email not sent');
    return { ok: true };
  }

  try {
    await resend.emails.send({
      from: 'aimeajob <digest@aimeajob.com>',
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || String(err),
    };
  }
}

export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}
