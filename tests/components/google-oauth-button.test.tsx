import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

describe('GoogleOAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  it('renders "Continue with Google" text by default', () => {
    render(<GoogleOAuthButton />);
    expect(screen.getByText('Continue with Google')).toBeDefined();
  });

  it('renders custom label when provided', () => {
    render(<GoogleOAuthButton label="Sign in with Google" />);
    expect(screen.getByText('Sign in with Google')).toBeDefined();
  });

  it('calls signInWithOAuth with provider google when clicked', async () => {
    render(<GoogleOAuthButton />);
    const button = screen.getByTestId('google-oauth-button');
    fireEvent.click(button);

    // Allow async handler to run
    await new Promise((r) => setTimeout(r, 0));

    expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
      })
    );
  });

  it('is initially enabled', () => {
    render(<GoogleOAuthButton />);
    const button = screen.getByTestId('google-oauth-button');
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
