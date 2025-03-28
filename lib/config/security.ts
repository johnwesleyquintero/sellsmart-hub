export const securityHeaders = {
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", '*.vercel-analytics.com', '*.vercel.app'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'blob:', 'data:', '*.githubusercontent.com'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'https://api.github.com', 'vitals.vercel-insights.com'],
    'frame-src': ["'none'"],
    'child-src': ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    'interest-cohort': [],
  }
};

export function generateCSP(config = securityHeaders.contentSecurityPolicy) {
  return Object.entries(config)
    .map(([key, values]) => `${key} ${values.join(' ')};`)
    .join(' ')
    .trim();
}
