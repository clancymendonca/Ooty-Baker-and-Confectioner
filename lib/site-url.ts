/**
 * Canonical public site origin for metadata, sitemap, and robots.
 * Prefer env in all environments; in production fall back to the live domain
 * when unset so OG URLs and sitemaps stay correct without extra Vercel config.
 */
export function getSiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return "https://www.gimmieooty.in";
  }
  return "http://localhost:3000";
}
