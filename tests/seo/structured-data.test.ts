import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JsonLd } from '@/components/json-ld';
import React from 'react';

describe('JsonLd component', () => {
  it('renders script tag with application/ld+json type', () => {
    const { container } = render(React.createElement(JsonLd));
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });

  it('contains valid JSON-LD structured data', () => {
    const { container } = render(React.createElement(JsonLd));
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    
    const content = script?.textContent;
    expect(content).toBeTruthy();
    
    const data = JSON.parse(content!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@graph']).toBeDefined();
    expect(Array.isArray(data['@graph'])).toBe(true);
  });

  it('includes WebSite schema', () => {
    const { container } = render(React.createElement(JsonLd));
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    
    const website = data['@graph'].find((item: any) => item['@type'] === 'WebSite');
    expect(website).toBeDefined();
    expect(website.name).toBe('aimeajob');
    expect(website.url).toBe('https://aimeajob.com');
  });

  it('includes WebApplication schema', () => {
    const { container } = render(React.createElement(JsonLd));
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    
    const app = data['@graph'].find((item: any) => item['@type'] === 'WebApplication');
    expect(app).toBeDefined();
    expect(app.name).toBe('aimeajob');
    expect(app.applicationCategory).toBe('BusinessApplication');
    expect(app.offers.price).toBe('0');
  });

  it('includes Organization schema', () => {
    const { container } = render(React.createElement(JsonLd));
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    
    const org = data['@graph'].find((item: any) => item['@type'] === 'Organization');
    expect(org).toBeDefined();
    expect(org.name).toBe('aimeajob');
    expect(org.founder.name).toBe('Martin Petrov');
    expect(org.address.addressLocality).toBe('Sofia');
    expect(org.address.addressCountry).toBe('BG');
  });
});
