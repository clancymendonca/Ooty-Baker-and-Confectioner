# Changelog

This file tracks notable changes per PR. Versioning is loose semver: MINOR
bumps for the larger PRs in the full-scale improvement plan, PATCH for
focused follow-ups.

## 1.5.0 - Full-scale improvement rollup

Five-phase improvement plan implemented in a single rollup. Real PR boundaries
will be cut from the same set of changes when split for review.

### PR1 - P0 blocking bugs

- Public POST `/api/inquiries` is unblocked in middleware; route now uses
  Zod + IP rate limit.
- Fixed password reset: `app/auth/page.tsx` now sends the OTP to
  `/api/auth/otp reset-password`.
- Removed the bulk `DELETE /api/inquiries` handler and the dashboard "Delete
  All" button.
- `DELETE /api/inquiries/[id]` now soft-deletes via `isDeleted/deletedAt`.
- All `[id]/route.ts` files validate `params.id` via `parseIdOr400`.
- Scrubbed live Supabase project ref from README; `.env`/README pooler port
  set to 6543 with `pgbouncer=true`.

### PR2 - Security hardening

- OTPs are bcrypt-hashed at rest; new `otpAttempts` / `otpUsedAt` fields lock
  the OTP after 5 failures.
- Rate limiter now uses `@vercel/kv` when configured, with in-memory
  fallback for dev / single-instance hosts.
- Middleware enforces same-origin on state-changing `/api/*` requests
  (Origin / Sec-Fetch-Site check), with explicit exemptions for login and
  the public inquiry POST.
- Added baseline security headers via `next.config.js#headers()` and a
  starter CSP.
- Locked down `next/image` `remotePatterns`; removed deprecated `domains`.
- `app/dashboard/page.tsx` is now a server component that calls
  `getSession()` and `redirect()`.
- `noindex` metadata added for `/dashboard/*` and `/auth`.
- AOS now bundled from npm via `components/AnimationProvider.tsx`; the
  unpkg `<Script>` is gone.
- Removed the URL credential cleanup script from `app/layout.tsx` and
  `app/auth/page.tsx`.

### PR3 - Performance

- Dashboard SSE collapses 5 status counts into one SQL via
  `prisma.$queryRaw`; interval bumped to 30s.
- Replaced `console.log` calls in product/OTP routes, file upload, and
  Prisma boot with the central `logger`.
- Prisma `query` log gated behind `PRISMA_LOG_QUERIES=1`.
- Carousel auto-scroll effects merged into a single `useEffect`.
- `InquiryForm` receives products as props from the SSR page; the client-
  side `/api/products` fetch is gone.
- Trimmed Google Fonts down to Poppins; Tailwind `fontFamily` updated.

### PR4 - Quality / DX

- New `lib/api-errors.ts` `dbErrorResponse(error, ctx)` is used by the
  refactored OTP route.
- `prisma/migrations/` is committed (see `prisma/MIGRATIONS.md`); schema
  has new `BusinessInquiry` indexes and a normalized `updatedAt`.
- Server-side Zod validators in `lib/validators/{inquiry,product,auth}.ts`.
- Public products GETs use explicit `select` DTOs.
- Inquiry form regexes loosened to length-only.
- `components/ui/Spinner.tsx` and `components/ui/ToastProvider.tsx` replace
  the inline SVGs and `alert()` calls in `/auth`. Added
  `app/dashboard/loading.tsx` and `app/error.tsx`.
- Deleted dead root-level `button-57-styles.css`, `index.js`, `styles.css`.
- ESLint extended with `tailwindcss/recommended`,
  `eslint-plugin-import` order, and `@typescript-eslint/no-explicit-any`.
- Added vitest unit tests, a Playwright smoke test, and
  `.github/workflows/ci.yml`.
- `lib/env.ts` validates env vars with Zod and is imported at boot from
  `lib/prisma.ts`.

### PR5 - Architecture

- Removed unused `next-auth` dependency.
- Centralized auth in middleware; redundant in-route `requireAuth()` calls
  removed (export endpoints kept under explicit middleware coverage).
- `ProductImage` accepts and forwards `sizes`; call sites in
  `components/ProductsSection.tsx` and `app/products/[category]/page.tsx`
  updated.
- Bumped `package.json` version to `1.5.0` and added this changelog.
- Wrote `docs/ADR-001-admin-split.md` documenting the future admin
  subdomain split.

The Next 15 upgrade is intentionally scheduled as its own follow-up PR.
