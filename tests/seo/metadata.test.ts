import { describe, it, expect } from 'vitest';
import { metadata } from '@/app/page';

describe('landing page metadata', () => {
  it('has correct title', () => {
    expect(metadata.title).toBe('AI Job Matching — Find Jobs That Match Your Skills | aimeajob');
  });

  it('has correct description', () => {
    expect(metadata.description).toBe('Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.');
  });

  it('has openGraph metadata', () => {
    expect(metadata.openGraph).toBeDefined();
    if (metadata.openGraph && typeof metadata.openGraph === 'object') {
      expect(metadata.openGraph.title).toBe('AI Job Matching — Find Jobs That Match Your Skills | aimeajob');
      expect(metadata.openGraph.description).toBe('Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.');
      expect(metadata.openGraph.url).toBe('https://aimeajob.com');
      expect(metadata.openGraph.siteName).toBe('aimeajob');
    }
  });

  it('has twitter metadata', () => {
    expect(metadata.twitter).toBeDefined();
    if (metadata.twitter && typeof metadata.twitter === 'object') {
      expect(metadata.twitter.title).toBe('AI Job Matching — Find Jobs That Match Your Skills | aimeajob');
      expect(metadata.twitter.description).toBe('Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.');
    }
  });
});
