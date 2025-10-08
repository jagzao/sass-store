module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/booking',
        'http://localhost:3000/t/wondernails',
        'http://localhost:3000/t/vigistudio'
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Ready on',
      settings: {
        chromeFlags: '--no-sandbox'
      }
    },
    assert: {
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // Performance metrics
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],

        // Bundle size considerations
        'total-byte-weight': ['error', { maxNumericValue: 256000 }], // 250KB
        'unused-css-rules': ['error', { maxNumericValue: 20000 }],
        'unused-javascript': ['error', { maxNumericValue: 20000 }],

        // Accessibility
        'accessibility': ['error', { minScore: 0.95 }],

        // SEO
        'seo': ['error', { minScore: 0.9 }],

        // Best practices
        'best-practices': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};