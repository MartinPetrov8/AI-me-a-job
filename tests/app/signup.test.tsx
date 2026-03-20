import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignupPage from '@/app/signup/page';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  })),
}));

describe('Signup Page', () => {
  it('renders email and password inputs', () => {
    render(<SignupPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
  });

  it('renders terms checkbox', () => {
    render(<SignupPage />);
    expect(screen.getByRole('checkbox')).toBeDefined();
    expect(screen.getByText(/terms of service/i)).toBeDefined();
  });

  it('validates password length', () => {
    render(<SignupPage />);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeDefined();
  });

  it('renders Google signup button', () => {
    render(<SignupPage />);
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeDefined();
  });

  it('renders login link', () => {
    render(<SignupPage />);
    expect(screen.getByText(/sign in/i)).toBeDefined();
  });
});
