// Injected content via Sentry wizard
const { withSentryConfig } = require("@sentry/nextjs");

/**
 * Allowed image remote hosts. We accept Vercel Blob (any subdomain pattern
 * Vercel issues) and Supabase Storage. Anything else should not be optimized
 * by `next/image` to avoid SSRF-style abuse of the optimizer.
 */
const imageRemotePatterns = [
  {
    protocol: "https",
    hostname: "*.public.blob.vercel-storage.com",
  },
  {
    protocol: "https",
    hostname: "*.blob.vercel-storage.com",
  },
  {
    protocol: "https",
    hostname: "*.supabase.co",
  },
  {
    protocol: "http",
    hostname: "localhost",
  },
];

/**
 * Permissive-but-safe baseline CSP. We allow `'unsafe-inline'` for styles
 * because Tailwind's runtime style hooks and inline `style={{...}}` props
 * generate them; tightening this requires nonces. `connect-src` includes
 * Sentry's tunnel route under `/monitoring`, direct ingest (EU/US), Vercel
 * Live, and blob workers for Sentry replay on the client.
 */
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.supabase.co",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://vercel.live https://*.vercel.live",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
