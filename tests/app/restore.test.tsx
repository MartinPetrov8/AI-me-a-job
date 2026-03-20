import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestorePage from '@/app/restore/page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as any;

describe('RestorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements with Wellfound design system', () => {
    render(<RestorePage />);
    expect(screen.getByText('Welcome back')).toBeTruthy();
    expect(screen.getByText('Enter your email and restore code')).toBeTruthy();
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your 24-character code')).toBeTruthy();
    expect(screen.getByRole('button', { name: /restore profile/i })).toBeTruthy();
    expect(screen.getByText(/new here/i)).toBeTruthy();
  });

  it('submits correctly and redirects on success', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          profile_id: 'p123',
          restore_token: 'token456',
        },
      }),
    });

    render(<RestorePage />);

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your 24-character code'), {
      target: { value: 'abcd1234efgh5678ijkl9012' },
    });

    fireEvent.click(screen.getByRole('button', { name: /restore profile/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          restore_token: 'abcd1234efgh5678ijkl9012',
        }),
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('restore_token', 'token456');
      expect(mockPush).toHaveBeenCalledWith('/results?profile_id=p123');
    });
  });

  it('shows error on 404', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    render(<RestorePage />);

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your 24-character code'), {
      target: { value: 'wrong-token' },
    });

    fireEvent.click(screen.getByRole('button', { name: /restore profile/i }));

    await waitFor(() => {
      expect(screen.getByText(/profile not found/i)).toBeTruthy();
    });
  });

  it('shows loading state during restore', async () => {
    (global.fetch as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({ data: { profile_id: 'p1', restore_token: 't1' } }) }), 100))
    );

    render(<RestorePage />);

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your 24-character code'), {
      target: { value: 'token123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /restore profile/i }));

    expect(screen.getByText(/restoring your profile/i)).toBeTruthy();
  });

  it('uses correct design tokens', () => {
    const { container } = render(<RestorePage />);
    
    const mainElement = container.querySelector('main');
    expect(mainElement?.className).toContain('bg-[#F7F7F5]');
    
    const card = container.querySelector('.rounded-2xl');
    expect(card).toBeTruthy();
  });

  it('has link to upload page', () => {
    render(<RestorePage />);
    const link = screen.getByRole('link', { name: /upload your cv instead/i });
    expect(link.getAttribute('href')).toBe('/upload');
  });
});
