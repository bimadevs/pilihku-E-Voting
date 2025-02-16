export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PilihKu',
    applicationCategory: 'VotingApplication',
    operatingSystem: 'Web Browser',
    description: 'Sistem e-voting modern untuk pemilihan ketua dan wakil ketua OSIS',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'IDR'
    },
    provider: {
      '@type': 'Organization',
      name: 'SMK Mudita Singkawang',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Singkawang',
        addressRegion: 'Kalimantan Barat',
        addressCountry: 'ID'
      }
    },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'Student'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
} 