import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/footer';

describe('Footer', () => {
  it('renders all product section links', () => {
    render(<Footer />);
    expect(screen.getByText('Upload CV')).toBeDefined();
    expect(screen.getByText('Pricing')).toBeDefined();
    expect(screen.getByText('How it Works')).toBeDefined();
  });

  it('renders all legal section links', () => {
    render(<Footer />);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms of Service')).toBeDefined();
  });

  it('renders all company section links', () => {
    render(<Footer />);
    expect(screen.getByText('About')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText('© 2026 aimeajob')).toBeDefined();
    expect(screen.getByText('Built with AI in Sofia, Bulgaria')).toBeDefined();
  });
});
