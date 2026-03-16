import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import ResultsPage from './page';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

const mockUseSearchParams = useSearchParams as ReturnType<typeof vi.fn>;

describe('ResultsPage - Edit Preferences Panel (S-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-restore-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders Edit filters button near results count', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      const button = screen.getByText(/Edit filters/i);
      expect(button).toBeTruthy();
    });
  });

  it('opens slide-in panel from right when Edit filters is clicked', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeTruthy();
    });
  });

  it('panel contains location input, work mode toggles, employment type toggles, salary input, and Re-run search button', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Berlin, Remote/i)).toBeTruthy();
      expect(screen.getByText('Remote')).toBeTruthy();
      expect(screen.getByText('Hybrid')).toBeTruthy();
      expect(screen.getByText('Onsite')).toBeTruthy();
      expect(screen.getByText('Full-Time')).toBeTruthy();
      expect(screen.getByText('Part-Time')).toBeTruthy();
      expect(screen.getByText('Contract')).toBeTruthy();
      expect(screen.getByPlaceholderText(/e.g., 50000/i)).toBeTruthy();
      expect(screen.getByText('Re-run search')).toBeTruthy();
    });
  });

  it('closes panel when clicking overlay', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeTruthy();
    });

    const overlay = container.querySelector('div[class*="fixed"][class*="inset-0"][class*="bg-black"]');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay as Element);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeFalsy();
    });
  });

  it('closes panel when clicking Close button', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeTruthy();
    });

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeFalsy();
    });
  });

  it('re-run search fires POST /api/search with preferences and X-Restore-Token header', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockFetch = vi.fn();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], total: 0, search_id: 'search-1' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], total: 0, search_id: 'search-2' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }),
      } as Response);

    global.fetch = mockFetch;

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Berlin, Remote/i)).toBeTruthy();
    });

    const locationInput = screen.getByPlaceholderText(/e.g., Berlin, Remote/i);
    fireEvent.change(locationInput, { target: { value: 'Berlin' } });

    const rerunButton = screen.getByText('Re-run search');
    fireEvent.click(rerunButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const secondCall = mockFetch.mock.calls[1];
    expect(secondCall[0]).toBe('/api/search');
    expect(secondCall[1].method).toBe('POST');
    expect(secondCall[1].headers['X-Restore-Token']).toBe('test-restore-token');

    const body = JSON.parse(secondCall[1].body as string);
    expect(body.location).toBe('Berlin');
    expect(body.profile_id).toBe('test-profile-123');
  });

  it('panel closes after successful re-run search', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockFetch = vi.fn();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], total: 0, search_id: 'search-1' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], total: 0, search_id: 'search-2' },
          meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
        }),
      } as Response);

    global.fetch = mockFetch;

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeTruthy();
    });

    const rerunButton = screen.getByText('Re-run search');
    fireEvent.click(rerunButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeFalsy();
    });
  });

  it('initializes panel preference state from URL params on first open', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => {
        const params: Record<string, string> = {
          profile_id: 'test-profile-123',
          location: 'Sofia',
          work_mode: 'remote',
          employment_type: 'full-time',
          salary_min: '60000',
        };
        return params[key] || null;
      },
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText(/e.g., Berlin, Remote/i) as HTMLInputElement;
      expect(locationInput.value).toBe('Sofia');

      const salaryInput = screen.getByPlaceholderText(/e.g., 50000/i) as HTMLInputElement;
      expect(salaryInput.value).toBe('60000');
    });
  });
});

describe('ResultsPage - Empty States (S-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-restore-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders no results empty state with Edit filters and Upload new CV buttons when API returns zero matches', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 0, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('No matches found')).toBeTruthy();
    });

    expect(screen.getByText(/Try adjusting your preferences or uploading an updated CV/i)).toBeTruthy();

    const editPrefsButton = screen.getByText('Edit filters');
    expect(editPrefsButton).toBeTruthy();

    const uploadButton = screen.getByText('Upload new CV');
    expect(uploadButton).toBeTruthy();

    fireEvent.click(editPrefsButton);

    await waitFor(() => {
      const panel = container.querySelector('div[class*="fixed"][class*="right-0"][class*="z-50"]');
      expect(panel).toBeTruthy();
    });
  });

  it('renders filtered-to-zero message with Clear filters button when all results are filtered out', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockJobs = [
      {
        job_id: 'job-1',
        title: 'Software Engineer',
        company: 'Test Corp',
        location: 'Sofia',
        url: 'https://example.com/job1',
        posted_at: new Date('2026-03-01'),
        match_score: 7,
        matched_criteria: ['years_experience', 'sphere_of_expertise'],
        unmatched_criteria: [],
        salary_min: 50000,
        salary_max: 70000,
        salary_currency: 'EUR',
        employment_type: 'Full-time',
        is_remote: false,
      },
      {
        job_id: 'job-2',
        title: 'Senior Developer',
        company: 'Another Co',
        location: 'Berlin',
        url: 'https://example.com/job2',
        posted_at: new Date('2026-03-02'),
        match_score: 6,
        matched_criteria: ['seniority_level'],
        unmatched_criteria: [],
        salary_min: 60000,
        salary_max: 80000,
        salary_currency: 'EUR',
        employment_type: 'Part-time',
        is_remote: true,
      },
      {
        job_id: 'job-3',
        title: 'Tech Lead',
        company: 'Big Tech',
        location: 'Remote',
        url: 'https://example.com/job3',
        posted_at: new Date('2026-03-03'),
        match_score: 8,
        matched_criteria: ['years_experience', 'seniority_level', 'sphere_of_expertise'],
        unmatched_criteria: [],
        salary_min: 80000,
        salary_max: 100000,
        salary_currency: 'EUR',
        employment_type: 'Full-time',
        is_remote: true,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 3, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('3 Matches')).toBeTruthy();
    });

    const score9Button = screen.getByText('9+ score');
    fireEvent.click(score9Button);

    await waitFor(() => {
      expect(screen.getByText(/No matches with current filters/i)).toBeTruthy();
    });

    const clearFiltersButton = screen.getByText('Clear filters');
    expect(clearFiltersButton).toBeTruthy();

    fireEvent.click(clearFiltersButton);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
      expect(screen.getByText('Senior Developer')).toBeTruthy();
      expect(screen.getByText('Tech Lead')).toBeTruthy();
    });
  });
});

describe('ResultsPage - Sort Bar (S-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-restore-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders sort bar with Score, Date posted, and Salary options', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockJobs = [
      {
        job_id: 'job-1',
        title: 'Software Engineer',
        company: 'Test Co',
        location: 'Sofia',
        url: 'https://example.com/job1',
        posted_at: new Date('2026-03-01'),
        match_score: 7,
        matched_criteria: ['years_experience', 'education_level'],
        unmatched_criteria: [],
        salary_min: 50000,
        salary_max: 70000,
        salary_currency: 'EUR',
        employment_type: 'Full-time',
        is_remote: false,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 1, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('1 Matches')).toBeTruthy();
    });

    const scoreButton = screen.getByText('Score');
    const dateButton = screen.getByText('Date posted');
    const salaryButton = screen.getByText('Salary');

    expect(scoreButton).toBeTruthy();
    expect(dateButton).toBeTruthy();
    expect(salaryButton).toBeTruthy();
  });

  it('clicking Date posted triggers re-fetch with ?sort=posted_at', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockJobs = [
      {
        job_id: 'job-1',
        title: 'Software Engineer',
        company: 'Test Co',
        location: 'Sofia',
        url: 'https://example.com/job1',
        posted_at: new Date('2026-03-01'),
        match_score: 7,
        matched_criteria: ['years_experience', 'education_level'],
        unmatched_criteria: [],
        salary_min: 50000,
        salary_max: 70000,
        salary_currency: 'EUR',
        employment_type: 'Full-time',
        is_remote: false,
      },
    ];

    const fetchMock = vi.fn();
    (global.fetch as unknown) = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 1, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('1 Matches')).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Restore-Token': 'test-restore-token',
        }),
        body: JSON.stringify({ profile_id: 'test-profile-123' }),
      })
    );

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 1, search_id: 'search-2' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const dateButton = screen.getByText('Date posted');
    fireEvent.click(dateButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/search?sort=posted_at',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Restore-Token': 'test-restore-token',
          }),
          body: JSON.stringify({ profile_id: 'test-profile-123' }),
        })
      );
    });
  });

  it('clicking Salary triggers re-fetch with ?sort=salary_max', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const mockJobs = [
      {
        job_id: 'job-1',
        title: 'Software Engineer',
        company: 'Test Co',
        location: 'Sofia',
        url: 'https://example.com/job1',
        posted_at: new Date('2026-03-01'),
        match_score: 7,
        matched_criteria: ['years_experience', 'education_level'],
        unmatched_criteria: [],
        salary_min: 50000,
        salary_max: 70000,
        salary_currency: 'EUR',
        employment_type: 'Full-time',
        is_remote: false,
      },
    ];

    const fetchMock = vi.fn();
    (global.fetch as unknown) = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 1, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('1 Matches')).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Restore-Token': 'test-restore-token',
        }),
        body: JSON.stringify({ profile_id: 'test-profile-123' }),
      })
    );

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: mockJobs, total: 1, search_id: 'search-2' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const salaryButton = screen.getByText('Salary');
    fireEvent.click(salaryButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/search?sort=salary_max',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Restore-Token': 'test-restore-token',
          }),
          body: JSON.stringify({ profile_id: 'test-profile-123' }),
        })
      );
    });
  });
});

describe('ResultsPage - Salary Range Filter (S-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-restore-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders Min Salary and Max Salary inputs in filters panel', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const minSalaryLabel = screen.getByText(/Min Salary/i);
      const maxSalaryLabel = screen.getByText(/Max Salary/i);
      expect(minSalaryLabel).toBeTruthy();
      expect(maxSalaryLabel).toBeTruthy();
    });
  });

  it('entering 50000 in Min Salary and clicking Apply triggers re-fetch with salary_min=50000', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const fetchMock = vi.fn();
    (global.fetch as unknown) = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/Min Salary/i)).toBeTruthy();
    });

    const minSalaryInput = container.querySelector('input[placeholder="e.g., 50000"]') as HTMLInputElement;
    expect(minSalaryInput).toBeTruthy();

    fireEvent.change(minSalaryInput, { target: { value: '50000' } });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-2' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const rerunButton = screen.getByText(/Re-run search/i);
    fireEvent.click(rerunButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Restore-Token': 'test-restore-token',
          }),
          body: JSON.stringify({ profile_id: 'test-profile-123', salary_min: 50000 }),
        })
      );
    });
  });

  it('entering 100000 in Max Salary and clicking Apply triggers re-fetch with salary_max=100000', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const fetchMock = vi.fn();
    (global.fetch as unknown) = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/Max Salary/i)).toBeTruthy();
    });

    const maxSalaryInput = container.querySelector('input[placeholder="e.g., 100000"]') as HTMLInputElement;
    expect(maxSalaryInput).toBeTruthy();

    fireEvent.change(maxSalaryInput, { target: { value: '100000' } });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-2' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const rerunButton = screen.getByText(/Re-run search/i);
    fireEvent.click(rerunButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Restore-Token': 'test-restore-token',
          }),
          body: JSON.stringify({ profile_id: 'test-profile-123', salary_max: 100000 }),
        })
      );
    });
  });

  it('both Min and Max Salary inputs can be used together', async () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'profile_id' ? 'test-profile-123' : null),
    } as ReturnType<typeof useSearchParams>);

    const fetchMock = vi.fn();
    (global.fetch as unknown) = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-1' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const { container } = render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Edit filters/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit filters/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/Min Salary/i)).toBeTruthy();
    });

    const minSalaryInput = container.querySelector('input[placeholder="e.g., 50000"]') as HTMLInputElement;
    const maxSalaryInput = container.querySelector('input[placeholder="e.g., 100000"]') as HTMLInputElement;

    fireEvent.change(minSalaryInput, { target: { value: '50000' } });
    fireEvent.change(maxSalaryInput, { target: { value: '100000' } });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { results: [], total: 0, search_id: 'search-2' },
        meta: { threshold: 5, max_score: 8, searched_at: new Date().toISOString() },
      }),
    } as Response);

    const rerunButton = screen.getByText(/Re-run search/i);
    fireEvent.click(rerunButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Restore-Token': 'test-restore-token',
          }),
          body: JSON.stringify({ profile_id: 'test-profile-123', salary_min: 50000, salary_max: 100000 }),
        })
      );
    });
  });
});
