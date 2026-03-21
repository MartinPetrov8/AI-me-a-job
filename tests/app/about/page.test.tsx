import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/about/page';

describe('About Page', () => {
  it('renders the company story section with expected text', () => {
    render(<AboutPage />);
    
    expect(screen.getByText(/Built by a Data Scientist tired of bad job matching/i)).toBeDefined();
    expect(screen.getByText(/sponsored listings/i)).toBeDefined();
    expect(screen.getByText(/keyword matching/i)).toBeDefined();
  });

  it('renders the mission section with 8 criteria mention', () => {
    render(<AboutPage />);
    
    const missionHeading = screen.getByRole('heading', { name: /Our Mission/i });
    expect(missionHeading).toBeDefined();
    
    const criteriaElements = screen.getAllByText(/8 criteria/i);
    expect(criteriaElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/no sponsored noise/i)).toBeDefined();
  });

  it('renders tech transparency section with 12 sources and daily refresh', () => {
    render(<AboutPage />);
    
    const techHeading = screen.getByRole('heading', { name: /Tech Transparency/i });
    expect(techHeading).toBeDefined();
    
    expect(screen.getByText(/12 sources/i)).toBeDefined();
    expect(screen.getByText(/daily refresh at 09:00 UTC/i)).toBeDefined();
  });

  it('renders team section with Small team, big mission text', () => {
    render(<AboutPage />);
    
    const teamHeading = screen.getByRole('heading', { name: /Team/i });
    expect(teamHeading).toBeDefined();
    
    expect(screen.getByText(/Small team, big mission/i)).toBeDefined();
  });

  it('renders CTA button linking to /upload', () => {
    render(<AboutPage />);
    
    const ctaLink = screen.getByRole('link', { name: /Try it free — upload your CV/i });
    expect(ctaLink).toBeDefined();
    expect(ctaLink.getAttribute('href')).toBe('/upload');
  });

  it('uses design system classes (bg-white, indigo-600, rounded-2xl)', () => {
    const { container } = render(<AboutPage />);
    
    const whiteCard = container.querySelector('.bg-white.rounded-2xl');
    expect(whiteCard).toBeDefined();
    
    const indigoCTA = container.querySelector('.bg-indigo-600');
    expect(indigoCTA).toBeDefined();
  });

  it('renders page background with #F7F7F5 color', () => {
    const { container } = render(<AboutPage />);
    
    const pageWrapper = container.querySelector('.bg-\\[\\#F7F7F5\\]');
    expect(pageWrapper).toBeDefined();
  });
});
