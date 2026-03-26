export interface DigestJob {
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  score: number;
  maxScore: number;
  restoreToken?: string;
}

export interface DigestEmail {
  subject: string;
  html: string;
}

export function buildDigestEmail(jobs: DigestJob[], userEmail: string): DigestEmail {
  const count = jobs.length;
  const subject = `Your weekly job matches — ${count} new role${count === 1 ? '' : 's'} found`;

  const restoreToken = jobs.length > 0 ? jobs[0].restoreToken : undefined;
  const unsubscribeUrl = restoreToken
    ? `https://aimeajob.vercel.app/api/unsubscribe?token=${restoreToken}`
    : 'https://aimeajob.vercel.app/account';

  const jobsHtml = jobs.map(job => {
    const companyText = job.company ? ` at ${job.company}` : '';
    const locationText = job.location ? ` • ${job.location}` : '';
    const scoreBadge = `<span style="display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;color:#333;">${job.score}/${job.maxScore}</span>`;

    return `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #e0e0e0;border-radius:8px;">
        <div style="font-weight:bold;font-size:16px;margin-bottom:4px;">${escapeHtml(job.title)}</div>
        <div style="font-size:14px;color:#666;margin-bottom:8px;">${escapeHtml(companyText)}${escapeHtml(locationText)}</div>
        <div style="margin-bottom:8px;">${scoreBadge}</div>
        <a href="${escapeHtml(job.url)}" style="color:#0070f3;text-decoration:none;font-weight:600;">View Job →</a>
      </div>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;background:#fafafa;">
  <div style="max-width:600px;margin:40px auto;background:white;padding:32px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="margin:0 0 24px 0;font-size:24px;color:#111;">aimeajob — Your Weekly Matches</h1>
    ${jobsHtml}
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0;font-size:12px;color:#888;">
      <p style="margin:0 0 8px 0;">You're receiving this because you subscribed to weekly job digests.</p>
      <p style="margin:0;"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#0070f3;text-decoration:none;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
