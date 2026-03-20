import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavBar } from '@/components/nav-bar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

describe('NavBar', () => {
  it('renders the logo linking to home', () => {
    render(<NavBar />);
    const logo = screen.getByText('aimeajob');
    expect(logo).toBeDefined();
    expect(logo.closest('a')?.getAttribute('href')).toBe('/');
  });

  it('renders navigation links for upload, pricing, and about', () => {
    render(<NavBar />);
    expect(screen.getByText('Upload CV')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();
    expect(screen.getByText('About')).toBeDefined();
  });

  it('renders login and signup links when not authenticated', () => {
    render(<NavBar />);
    const loginLinks = screen.getAllByText('Log in');
    const signupLinks = screen.getAllByText('Sign up');
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(signupLinks.length).toBeGreaterThan(0);
  });
});
