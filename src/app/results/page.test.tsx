import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import ResultsPage from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const mockSearchParams = useSearchParams as ReturnType<typeof vi.fn>;

describe('ResultsPage - S-01: Sticky filter bar', () => {
  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn(() => 'mock-restore-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    mockSearchParams.mockReturnValue({
      get: (key: string) => {
        if (key === 'profile_id') return 'test-profile-id';
        if (key === 'user_id') return 'test-user-id';
        if (key === 'token') return 'test-token';
        return null;
      },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sticky filter bar immediately on page load before results finish loading', async () => {
    let resolveSearchRequest: (value: Response) => void;
    const searchPromise = new Promise<Response>((resolve) => {
      resolveSearchRequest = resolve;
    });

    global.fetch = vi.fn(() => searchPromise) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      const filterBars = document.querySelectorAll('div.sticky');
      const resultsFilterBar = Array.from(filterBars).find(el => 
        el.classList.contains('bg-white/95') && 
        el.classList.contains('backdrop-blur-sm')
      );
      expect(resultsFilterBar).toBeTruthy();
    });

    resolveSearchRequest!(
      new Response(JSON.stringify({
        data: { results: [], total: 0, search_id: 'test-search' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }), { status: 200 })
    );
  });

  it('shows 4 skeleton pill placeholders during loading state', async () => {
    let resolveSearchRequest: (value: Response) => void;
    const searchPromise = new Promise<Response>((resolve) => {
      resolveSearchRequest = resolve;
    });

    global.fetch = vi.fn(() => searchPromise) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      const skeletons = document.querySelectorAll('div.animate-pulse.rounded-full');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    resolveSearchRequest!(
      new Response(JSON.stringify({
        data: { results: [], total: 0, search_id: 'test-search' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }), { status: 200 })
    );
  });

  it('shows actual filter pills including 9+ score pill after results load', async () => {
    const mockResults = [
      {
        job_id: '1',
        title: 'Senior Engineer',
        company: 'TechCorp',
        location: 'Remote',
        url: 'https://example.com/job1',
        posted_at: new Date(),
        match_score: 8,
        matched_criteria: ['years_experience', 'seniority_level'],
        unmatched_criteria: [],
        salary_min: 100000,
        salary_max: 150000,
        salary_currency: 'USD',
        employment_type: 'Full-time',
        is_remote: true,
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          data: { results: mockResults, total: 1, search_id: 'test-search' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }), { status: 200 })
      )
    ) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('8+ score')).toBeTruthy();
    });

    expect(screen.getByText('9+ score')).toBeTruthy();
    expect(screen.getByText('7+ score')).toBeTruthy();
    expect(screen.getByText('6+ score')).toBeTruthy();
  });

  it('filter bar has sticky positioning with correct classes', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          data: { results: [], total: 0, search_id: 'test-search' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }), { status: 200 })
      )
    ) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      const filterBars = document.querySelectorAll('div.sticky');
      const resultsFilterBar = Array.from(filterBars).find(el => 
        el.classList.contains('bg-white/95') && 
        el.classList.contains('backdrop-blur-sm') &&
        el.classList.contains('z-10')
      );
      expect(resultsFilterBar).toBeTruthy();
    });
  });

  it('displays sort controls in the sticky bar', async () => {
    const mockResults = [
      {
        job_id: '1',
        title: 'Developer',
        company: 'Company A',
        location: 'Remote',
        url: 'https://example.com/job1',
        posted_at: new Date(),
        match_score: 7,
        matched_criteria: [],
        unmatched_criteria: [],
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: 'Full-time',
        is_remote: true,
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          data: { results: mockResults, total: 1, search_id: 'test-search' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }), { status: 200 })
      )
    ) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      const sortButtons = screen.getAllByRole('button');
      const hasSortIcons = sortButtons.some(btn => 
        btn.textContent && (btn.textContent.includes('🎯') || btn.textContent.includes('🕐') || btn.textContent.includes('🏢'))
      );
      expect(hasSortIcons).toBe(true);
    });
  });

  it('displays match count in the sticky bar', async () => {
    const mockResults = [
      {
        job_id: '1',
        title: 'Job 1',
        company: 'Company',
        location: 'Remote',
        url: 'https://example.com/1',
        posted_at: new Date(),
        match_score: 6,
        matched_criteria: [],
        unmatched_criteria: [],
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: 'Full-time',
        is_remote: false,
      },
      {
        job_id: '2',
        title: 'Job 2',
        company: 'Company',
        location: 'Remote',
        url: 'https://example.com/2',
        posted_at: new Date(),
        match_score: 7,
        matched_criteria: [],
        unmatched_criteria: [],
        salary_min: null,
        salary_max: null,
        salary_currency: null,
        employment_type: 'Part-time',
        is_remote: false,
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          data: { results: mockResults, total: 2, search_id: 'test-search' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }), { status: 200 })
      )
    ) as any;

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('2 of 2')).toBeTruthy();
    });
  });
});
