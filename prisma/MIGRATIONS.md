# Migration workflow

`prisma/migrations/` is now committed (see `.gitignore`). Going forward, all
schema changes flow through `prisma migrate`, not `prisma db push`.

## First-time adoption (run once on each environment)

The current Supabase database was provisioned via `db push`, so Prisma has no
recorded migration history. Bring it under management without touching data:

```bash
# Generate the baseline migration directory from the current schema.
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Tell the live DB this baseline is already applied.
npx prisma migrate resolve --applied 0_init
```

Then apply any schema deltas committed since baseline (e.g. the OTP security
fields and new indexes from PR2/PR4):

```bash
npx prisma migrate dev --name otp_security_and_inquiry_indexes
```

## Day-to-day flow

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <change>` (locally).
3. Commit the new folder under `prisma/migrations/`.
4. CI / Vercel build runs `prisma migrate deploy` automatically against
   production via the `postinstall` -> `prisma generate` step plus an explicit
   deploy command in `package.json`'s `build` script if you want to enforce
   migrations during deploy.

## Why we left `db:push`

`db:push` is convenient for prototyping but does not record state, so dev and
prod schemas drift silently. The `db:push` script is still defined in
`package.json` for emergency bootstrap on a brand-new throwaway database, but
the canonical workflow is `migrate`.
