# ADR-001: Split the admin dashboard onto its own subdomain

**Status:** Proposed (not yet implemented)
**Date:** 2026-05

## Context

The same Next.js app today serves three audiences from a single hostname:

1. Anonymous marketing visitors (`/`, `/products/...`).
2. Anonymous form submitters (`POST /api/inquiries`).
3. Authenticated staff (`/dashboard`, `/api/dashboard/*`,
   `/api/inquiries/*`, mutating `/api/products`, mutating `/api/banners`).

Mixing these in one origin creates several frictions:

- **Security blast radius.** A CSP / HSTS / cookie tweak that's safe for the
  marketing site can break the dashboard, and vice versa. The `auth_session`
  cookie is currently `Path=/`, so it's sent on every marketing request even
  though it's only ever consumed on dashboard / API mutations.
- **Bundle and cache shape.** Marketing pages want aggressive ISR + edge
  caching; the dashboard needs personalized SSR with no caching. Today they
  fight each other in `next.config.js` headers and Vercel cache rules.
- **Search indexing risk.** Despite the new `noindex` metadata on
  `/dashboard/*` and `/auth`, the routes still resolve on the public origin.
  An accidental robots.txt or middleware regression could surface admin URLs
  to crawlers.
- **Rate limiting noise.** Public marketing traffic (lots of low-value GETs)
  shares connection limits with admin traffic (fewer, higher-stakes calls).
  Splitting hosts lets us tune Vercel concurrency, KV-backed rate limits,
  and Sentry sampling per audience.

## Decision (proposed)

Split the dashboard onto `admin.ootybaker.com`:

- **One Vercel project still backs both.** No code duplication; the routing
  is purely a hostname-aware middleware decision.
- The marketing site (`ootybaker.com`) serves only:
  - `/`, `/products/...`, `/about`, etc.
  - `GET /api/products`, `GET /api/banners`, `GET /api/categories`
  - `POST /api/inquiries`
  - Anything else returns 404 / redirects to the admin host.
- The admin site (`admin.ootybaker.com`) serves only:
  - `/auth`, `/dashboard/...`
  - All other `/api/*` routes (auth, inquiries CRUD, products mutate,
    banners mutate, dashboard, analytics, exports).
- The session cookie moves to the admin domain (`Domain=admin.ootybaker.com`,
  no longer sent on marketing requests).
- CSP, HSTS preload, cache rules tuned per host.

## Consequences

### Positive

- Admin cookie never leaks onto marketing requests.
- Marketing CSP can be tightened (no inline admin scripts to allow).
- Dashboard can opt into Vercel Edge Functions / longer maxDuration without
  affecting marketing latency.
- Easier to plug a WAF / IP allowlist in front of `admin.*` later.

### Negative

- One more DNS record + Vercel domain.
- Login redirects need to handle host-switches: a deep link to `/dashboard`
  on `ootybaker.com` should redirect to `https://admin.ootybaker.com/auth`.
- The CSRF middleware needs an extra exemption for the legitimate marketing
  -> admin handoff (e.g. when staff click a "manage in dashboard" link from
  an inquiry confirmation email).

### Migration sketch

1. Add `middleware.ts` host check that 404s admin routes on the marketing
   host and 404s marketing routes on the admin host.
2. Add `admin.ootybaker.com` as a Vercel domain on the same project.
3. Move `app/auth/*` and `app/dashboard/*` cookie scope to the new host.
4. Update all "redirect to /auth" call sites (middleware + `getSession`
   pages) to compose the admin URL using `ADMIN_URL` env var.

This work is **out of scope** for the current improvement plan and tracked
as a follow-up.
