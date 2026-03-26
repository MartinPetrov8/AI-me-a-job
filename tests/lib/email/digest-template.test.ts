import { describe, it, expect } from 'vitest';
import { buildDigestEmail, type DigestJob } from '@/lib/email/digest-template';

describe('email/digest-template', () => {
  describe('buildDigestEmail', () => {
    it('generates correct subject with job count (singular)', () => {
      const jobs: DigestJob[] = [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'Remote',
          url: 'https://example.com/job1',
          score: 7,
          maxScore: 9,
          restoreToken: 'token123',
        },
      ];

      const { subject } = buildDigestEmail(jobs, 'test@example.com');
      expect(subject).toBe('Your weekly job matches — 1 new role found');
    });

    it('generates correct subject with job count (plural)', () => {
      const jobs: DigestJob[] = [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'Remote',
          url: 'https://example.com/job1',
          score: 7,
          maxScore: 9,
        },
        {
          title: 'Data Scientist',
          company: 'AI Inc',
          location: 'Sofia, Bulgaria',
          url: 'https://example.com/job2',
          score: 6,
          maxScore: 9,
        },
      ];

      const { subject } = buildDigestEmail(jobs, 'test@example.com');
      expect(subject).toBe('Your weekly job matches — 2 new roles found');
    });

    it('includes job title in HTML', () => {
      const jobs: DigestJob[] = [
        {
          title: 'Senior Developer',
          company: 'Startup Co',
          location: null,
          url: 'https://example.com/job',
          score: 8,
          maxScore: 9,
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).toContain('Senior Developer');
    });

    it('includes View Job link with correct URL', () => {
      const jobs: DigestJob[] = [
        {
          title: 'Backend Engineer',
          company: 'Remote Co',
          location: 'Remote',
          url: 'https://example.com/backend-job',
          score: 7,
          maxScore: 8,
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).toContain('href="https://example.com/backend-job"');
      expect(html).toContain('View Job');
    });

    it('includes unsubscribe link with restore token when provided', () => {
      const jobs: DigestJob[] = [
        {
          title: 'Frontend Dev',
          company: 'Design Co',
          location: 'London',
          url: 'https://example.com/job',
          score: 6,
          maxScore: 9,
          restoreToken: 'abc123xyz',
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).toContain('https://aimeajob.vercel.app/api/unsubscribe?token=abc123xyz');
      expect(html).toContain('Unsubscribe');
    });

    it('includes account unsubscribe link when no restore token', () => {
      const jobs: DigestJob[] = [
        {
          title: 'DevOps Engineer',
          company: 'Cloud Co',
          location: 'Remote',
          url: 'https://example.com/job',
          score: 5,
          maxScore: 8,
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).toContain('https://aimeajob.vercel.app/account');
      expect(html).toContain('Unsubscribe');
    });

    it('escapes HTML in job title', () => {
      const jobs: DigestJob[] = [
        {
          title: '<script>alert("xss")</script>',
          company: null,
          location: null,
          url: 'https://example.com/job',
          score: 5,
          maxScore: 8,
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('displays score badge with correct format', () => {
      const jobs: DigestJob[] = [
        {
          title: 'QA Engineer',
          company: 'Test Corp',
          location: 'Remote',
          url: 'https://example.com/job',
          score: 7,
          maxScore: 9,
        },
      ];

      const { html } = buildDigestEmail(jobs, 'test@example.com');
      expect(html).toContain('7/9');
    });
  });
});
