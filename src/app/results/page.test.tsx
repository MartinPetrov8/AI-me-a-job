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

  it('renders Edit preferences button near results count', async () => {
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
      const button = screen.getByText(/Edit preferences/i);
      expect(button).toBeTruthy();
    });
  });

  it('opens slide-in panel from right when Edit preferences is clicked', async () => {
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
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
      expect(screen.getByText(/Edit preferences/i)).toBeTruthy();
    });

    const editButton = screen.getByText(/Edit preferences/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText(/e.g., Berlin, Remote/i) as HTMLInputElement;
      expect(locationInput.value).toBe('Sofia');

      const salaryInput = screen.getByPlaceholderText(/e.g., 50000/i) as HTMLInputElement;
      expect(salaryInput.value).toBe('60000');
    });
  });
});
