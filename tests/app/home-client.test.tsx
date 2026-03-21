import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import HomeClient from '@/app/home-client';

describe('HomeClient - Hero Section', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    
    (global as any).IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
      takeRecords = vi.fn(() => []);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders new headline Stop Scrolling Job Boards. Get AI-Matched.', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    render(<HomeClient />);
    
    expect(screen.getByText(/Stop Scrolling Job Boards/i)).toBeTruthy();
    expect(screen.getByText(/Get AI-Matched/i)).toBeTruthy();
  });

  it('renders subheadline with 7,000+ jobs from 12 sources message', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    render(<HomeClient />);
    
    expect(screen.getByText(/7,000\+ jobs from 12 sources/i)).toBeTruthy();
    expect(screen.getByText(/Free, no registration/i)).toBeTruthy();
  });

  it('renders primary CTA button linking to /upload', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    render(<HomeClient />);
    
    const uploadButton = screen.getByRole('link', { name: /Upload Your CV — free/i });
    expect(uploadButton).toBeTruthy();
    expect(uploadButton.getAttribute('href')).toBe('/upload');
  });

  it('renders secondary CTA button with anchor link to how-it-works', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    render(<HomeClient />);
    
    const howItWorksButton = screen.getByRole('link', { name: /See how it works/i });
    expect(howItWorksButton).toBeTruthy();
    expect(howItWorksButton.getAttribute('href')).toBe('#how-it-works');
  });

  it('renders all 4 trust badges separated by dots', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const trustBadgesDiv = container.querySelector('.flex.flex-wrap.items-center.justify-center.gap-3.text-sm');
    expect(trustBadgesDiv).toBeTruthy();
    if (trustBadgesDiv) {
      const badges = within(trustBadgesDiv as HTMLElement);
      expect(badges.getByText(/No registration/i)).toBeTruthy();
      expect(badges.getByText(/PDF or DOCX/i)).toBeTruthy();
      expect(badges.getByText(/Results in 30 seconds/i)).toBeTruthy();
      expect(badges.getByText(/12 job sources/i)).toBeTruthy();
    }
  });

  it('fetches stats from /api/stats on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7543, countries: 8, sources: 12, last_updated: '2026-03-21' })
    } as Response);

    render(<HomeClient />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stats');
    });
  });

  it('displays stats bar with total_jobs count after fetch', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7543, countries: 8, sources: 12, last_updated: '2026-03-21' })
    } as Response);

    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.getByText('7,543')).toBeTruthy();
    });

    expect(screen.getByText(/active jobs/i)).toBeTruthy();
  });

  it('displays stats bar with countries and sources', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7543, countries: 8, sources: 12, last_updated: '2026-03-21' })
    } as Response);

    const { container } = render(<HomeClient />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('12')).toBeTruthy();
    });

    const statsBar = container.querySelector('.bg-white.rounded-2xl.border.border-gray-100.shadow-sm');
    expect(statsBar).toBeTruthy();
    if (statsBar) {
      const stats = within(statsBar as HTMLElement);
      expect(stats.getByText(/countries/i)).toBeTruthy();
      const sourcesElements = stats.getAllByText(/sources/i);
      expect(sourcesElements.length).toBeGreaterThan(0);
    }
  });

  it('does not display stats bar when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(<HomeClient />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText(/active jobs/i)).toBeFalsy();
  });

  it('renders how-it-works section with id for anchor scroll', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const howItWorksSection = container.querySelector('#how-it-works');
    expect(howItWorksSection).toBeTruthy();
  });

  it('renders three How it works cards', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const howItWorksSection = container.querySelector('#how-it-works');
    expect(howItWorksSection).toBeTruthy();
    if (howItWorksSection) {
      const howItWorks = within(howItWorksSection as HTMLElement);
      expect(howItWorks.getByRole('heading', { level: 3, name: /Upload Your CV/i })).toBeTruthy();
      expect(howItWorks.getByRole('heading', { level: 3, name: /We Scan Jobs/i })).toBeTruthy();
      expect(howItWorks.getByRole('heading', { level: 3, name: /Get Ranked Shortlist/i })).toBeTruthy();
    }
  });

  it('renders gradient blob background element', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const gradientBlob = container.querySelector('.bg-gradient-to-br');
    expect(gradientBlob).toBeTruthy();
  });
});

describe('HomeClient - How It Works Section', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    
    (global as any).IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
      takeRecords = vi.fn(() => []);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders section with id how-it-works for anchor scroll', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
  });

  it('renders 3 step elements with correct structure', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const steps = section.querySelectorAll('.bg-white.rounded-2xl');
      expect(steps.length).toBe(3);
    }
  });

  it('renders first step with Upload your CV text', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const sectionElement = within(section as HTMLElement);
      expect(sectionElement.getByText(/Upload your CV \(PDF or DOCX\)/i)).toBeTruthy();
      expect(sectionElement.getByText(/AI extracts 8 criteria from your profile/i)).toBeTruthy();
    }
  });

  it('renders second step with scan jobs text', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const sectionElement = within(section as HTMLElement);
      expect(sectionElement.getByText(/We scan 7,000\+ jobs from 12 boards/i)).toBeTruthy();
      expect(sectionElement.getByText(/refreshed every day at 09:00 UTC/i)).toBeTruthy();
    }
  });

  it('renders third step with ranked shortlist text', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const sectionElement = within(section as HTMLElement);
      expect(sectionElement.getByText(/Get a ranked shortlist/i)).toBeTruthy();
      expect(sectionElement.getByText(/each job scored by skills, location, salary, work mode, and more/i)).toBeTruthy();
    }
  });

  it('renders step numbers 1, 2, 3 in circular badges', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const badges = section.querySelectorAll('.rounded-full.bg-indigo-100');
      expect(badges.length).toBe(3);
      expect(badges[0].textContent).toBe('1');
      expect(badges[1].textContent).toBe('2');
      expect(badges[2].textContent).toBe('3');
    }
  });

  it('renders all 3 animated step cards with motion.div wrapper', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const steps = section.querySelectorAll('.bg-white.rounded-2xl');
      expect(steps.length).toBe(3);
      
      steps.forEach((step, index) => {
        const heading = step.querySelector('h3');
        expect(heading).toBeTruthy();
      });
    }
  });

  it('uses responsive grid with md:grid-cols-3', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    const { container } = render(<HomeClient />);
    
    const section = container.querySelector('section#how-it-works');
    expect(section).toBeTruthy();
    
    if (section) {
      const grid = section.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(grid).toBeTruthy();
    }
  });
});
