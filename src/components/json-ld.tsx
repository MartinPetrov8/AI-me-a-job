export function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'aimeajob',
        url: 'https://aimeajob.com',
        description: 'AI-powered job matching for European professionals',
      },
      {
        '@type': 'WebApplication',
        name: 'aimeajob',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
      },
      {
        '@type': 'Organization',
        name: 'aimeajob',
        url: 'https://aimeajob.com',
        founder: {
          '@type': 'Person',
          name: 'Martin Petrov',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Sofia',
          addressCountry: 'BG',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
