# Ooty Baker & Confectioner – E-commerce CMS

A full-stack E-commerce CMS platform built with Next.js 15, TypeScript, and PostgreSQL. Features include an intuitive admin dashboard with real-time analytics, secure OTP-based authentication, comprehensive product and business inquiry management, automated email notifications via Nodemailer, Excel export functionality with ExcelJS, and a fully responsive UI optimized for SEO and security.

## 🚀 Features

- 🏠 **Home Page**: Product showcase with category-based organization and banner slider
- 📝 **Business Inquiry Form**: Customer inquiry submission system
- 🔐 **Authentication**: Secure login with OTP-based password reset
- 📊 **Admin Dashboard**: 
  - Business inquiries management (view, update, delete, export)
  - Product management (CRUD operations with image uploads)
  - Banner management
  - Real-time statistics and analytics
  - Server-Sent Events (SSE) for live updates
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 📦 **Image Storage**: Vercel Blob (recommended), Supabase Storage, or local storage fallback

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Storage**: Supabase Storage (for images)
- **Authentication**: Cookie-based HTTP-only sessions
- **Form Handling**: React Hook Form with Zod validation
- **Email**: SMTP (for OTP and notifications)

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- SMTP credentials (Gmail App Password or Mailtrap for development)

## 🏁 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd Ooty-Baker-and-Confectioner
npm install
```

### 2. Set Up Supabase

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Project name: `ooty-baker`
4. Set a strong database password (save it!)
5. Choose region closest to your users
6. Wait 1-2 minutes for project setup

#### Get Database Connection String

1. Go to **Settings → Database**
2. Find "Connection string" section
3. **IMPORTANT**: Select **"Transaction pooler"** → **"URI"** tab (NOT Session pooler)
   - Transaction mode (port 6543) allows more concurrent connections and is better for serverless
   - Session mode (port 5432) has limited connections and will cause "max clients reached" errors
4. Copy the connection string and add `?pgbouncer=true` at the end
   - Should look like: `postgresql://postgres.<project-ref>:[PASSWORD]@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Note the port is **6543** (Transaction mode), not 5432 (Session mode)

#### Set Up Image Storage (Choose One)

**Option 1: Vercel Blob (Recommended for Vercel deployments)**

1. Go to your **Vercel Dashboard** → Your Project → **Storage** → **Blob**
2. Click **"Create Database"** (if not already created)
3. Go to **Settings** → Copy your **BLOB_READ_WRITE_TOKEN**
4. Add it to your Vercel environment variables:
   - Variable name: `BLOB_READ_WRITE_TOKEN`
   - Value: Your token from Vercel
5. That's it! No bucket setup needed. ✅

**Option 2: Supabase Storage (Alternative)**

1. Go to **Storage** in Supabase dashboard
2. Click "Create a new bucket"
3. **Bucket name:** `product-images` (lowercase, no spaces)
4. **Public bucket:** ✅ Enable
5. **File size limit:** 5 MB
6. Click "Create bucket"
7. Create storage policies (see Storage Policies section below)

**Note:** The system will automatically use Vercel Blob if available, otherwise fall back to Supabase Storage, then local storage (development only).

#### Get Supabase Keys (Only if using Supabase Storage)

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Set Up Supabase Storage Policies (Only if using Supabase Storage)

1. Go to **Storage** → **Policies** in Supabase dashboard
2. Under `product-images` bucket, click **"New policy"**
3. Create **Public read access** policy:
   - Policy name: `Public read access`
   - Allowed operation: `SELECT`
   - Target roles: Leave empty (defaults to public) or select `anon`, `authenticated`
   - Policy definition: `true`
4. Create **Authenticated upload access** policy:
   - Policy name: `Authenticated upload access`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `true`

### 3. Configure Environment Variables

Create `.env.local` file in the root directory:

```env
# Database (Supabase PostgreSQL - Transaction pooler)
DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Image Storage - Choose ONE option:

# Option 1: Vercel Blob (Recommended - automatically available on Vercel)
# BLOB_READ_WRITE_TOKEN is automatically set on Vercel, or get it from:
# Vercel Dashboard → Your Project → Storage → Blob → Settings
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxx"

# Option 2: Supabase Storage (Alternative)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Public site URL (canonical metadata, sitemap, robots). Use your real origin in production.
# If unset in production, the app falls back to https://www.gimmieooty.in (see lib/site-url.ts).
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Session signing (required in production). Prefer AUTH_SESSION_SECRET (32+ chars).
# NEXTAUTH_SECRET is still accepted as a fallback for signing; see lib/session-token.ts
AUTH_SESSION_SECRET=your-random-secret-at-least-32-characters-long

# NextAuth (optional legacy URL; overlaps with NEXT_PUBLIC_SITE_URL for local dev)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-character-secret-key

# Optional: Vercel KV / Upstash for distributed rate limits (see lib/rate-limit.ts)
# KV_REST_API_URL=
# KV_REST_API_TOKEN=

# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-email@gmail.com

# Sentry Error Tracking (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Node Environment
NODE_ENV=development
```

**Note:** 
- Replace `[YOUR-PASSWORD]` with your actual Supabase database password
- Replace `xxxxx` with your Supabase project reference
- Generate `AUTH_SESSION_SECRET` (or `NEXTAUTH_SECRET`) with: `openssl rand -base64 32`
- For Gmail, use [App Password](https://myaccount.google.com/apppasswords) (not your regular password)
- Sentry variables are optional - only add if you want error tracking in production

### 4. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations (recommended for production, CI, and new local databases)
npx prisma migrate deploy

# (Optional) Seed database with sample data
npm run db:seed
```

For a **fresh** local database, use `npx prisma migrate deploy` (or `npm run db:migrate` when authoring new migrations). Use `npm run db:push` only for quick local experiments when you intentionally want to sync the schema without migrations.

**Existing Supabase database** that was created with `db:push` before migrations existed: baseline with `npx prisma migrate resolve --applied 20250510000000_init` once the live schema already matches this migration, then use `migrate deploy` for future changes—or reset the DB and run `migrate deploy` on empty Postgres.

### 5. Copy Images (if any)

If you have existing images:
- Copy from `images/` to `public/images/`
- Or upload directly via dashboard (they'll go to Supabase Storage)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product CRUD
│   │   ├── inquiries/    # Inquiry management
│   │   ├── banners/      # Banner management
│   │   └── dashboard/    # Dashboard stats & SSE
│   ├── auth/             # Login page
│   ├── dashboard/        # Admin dashboard pages
│   ├── products/         # Public product pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── dashboard/       # Dashboard components
│   └── ...              # Shared components
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication helpers
│   ├── prisma.ts        # Prisma client
│   ├── session.ts       # Session management
│   ├── file-upload.ts   # File upload (Supabase + local fallback)
│   └── logger.ts        # Logging utility
├── prisma/               # Prisma schema
│   ├── migrations/     # Versioned SQL migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── public/               # Static files
│   └── images/          # Image assets
└── types/               # TypeScript type definitions
```

## 🗄 Database Schema

Main tables:
- `users` - User authentication
- `products` - Product catalog
- `banners` - Homepage banners
- `business_inquiries` - Customer inquiries
- `business_inquiry_products` - Junction table for inquiry products
- `business_inquiry_history` - Inquiry status change history

## 🔌 API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session
- `POST /api/auth/otp` - OTP operations (send, verify, reset password)

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/products/export` - Export products to Excel

### Inquiries
- `GET /api/inquiries` - List all inquiries
- `POST /api/inquiries` - Create inquiry
- `GET /api/inquiries/[id]` - Get inquiry
- `PUT /api/inquiries/[id]` - Update inquiry
- `DELETE /api/inquiries/[id]` - Delete inquiry
- `GET /api/inquiries/export` - Export inquiries to Excel

### Banners
- `GET /api/banners` - List all banners
- `POST /api/banners` - Create banner
- `PUT /api/banners/[id]` - Update banner
- `DELETE /api/banners/[id]` - Delete banner

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/events` - Server-Sent Events stream
- `GET /api/analytics` - Analytics data

## 🛠 Development Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema (local experiments; prefer migrations in prod)
npm run db:migrate       # Create/apply dev migrations (prisma migrate dev)
npm run db:migrate:deploy # Apply migrations in CI/production (prisma migrate deploy)
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:seed          # Seed database with sample data

# Utilities
npm run reset-password  # Reset user password
npm run test-smtp       # Test SMTP configuration
npm run test-blob       # Test Vercel Blob token (upload + delete)
```

## 🚀 Deployment to Vercel

### Prerequisites
- Code pushed to GitHub/GitLab/Bitbucket
- Vercel account ([vercel.com](https://vercel.com))
- Supabase project configured
- Production SMTP credentials

### Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your repository

2. **Configure Environment Variables**
   - Go to **Settings → Environment Variables**
   - Add all variables from `.env.local` (see above)
   - **Important:** 
     - Use the **Transaction pooler** connection string for `DATABASE_URL` (port `6543`, with `?pgbouncer=true`). Session pooler (`5432`) will hit connection limits on Vercel.
     - Set `NEXT_PUBLIC_SITE_URL` to your public origin (e.g. `https://your-domain.vercel.app`)
     - Set `AUTH_SESSION_SECRET` (32+ characters) for production; you may keep `NEXTAUTH_URL` aligned with the same origin if you use it elsewhere
     - Add `BLOB_READ_WRITE_TOKEN` on Vercel when using Blob storage, or Supabase URL + anon key for Supabase Storage
     - Optional: `KV_REST_API_URL` and `KV_REST_API_TOKEN` so rate limits work across all serverless instances

3. **Deploy**
   - Vercel will automatically detect Next.js
   - Click "Deploy"
   - Wait for build to complete

### Environment Variables for Vercel

```env
DATABASE_URL=postgresql://postgres.<project-ref>:[PASSWORD]@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
AUTH_SESSION_SECRET=production-secret-at-least-32-characters-long
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BLOB_READ_WRITE_TOKEN=vercel_blob_...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=production-secret-here
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
# Optional: KV_REST_API_URL=...  KV_REST_API_TOKEN=...
```

### Production deploy checklist

- `npm run build` succeeds locally with production-like env
- Vercel (or host) has `DATABASE_URL`, `AUTH_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP, and image storage (Blob or Supabase)
- Database schema applied with `npx prisma migrate deploy` (or baselined per section 4 if upgrading from `db:push` only)
- At least one admin user exists (`npm run create-user` / `npm run reset-password`)
- Smoke test: login, inquiry form, product/banner image upload

### Why Supabase?

✅ **Perfect for Vercel:**
- No ephemeral file system issues (images stored in Supabase Storage)
- PostgreSQL database works seamlessly
- IPv4-compatible connection pooling
- Built-in CDN for images
- Free tier available

## 📝 Important Notes

- **Authentication**: Uses HTTP-only cookies for secure session management
- **Image Storage**: Automatically uses Supabase Storage if configured, falls back to local file system in development
- **Database**: Uses PostgreSQL via Supabase. Transaction pooler (port `6543`, `?pgbouncer=true`) is required so each lambda gets its own connection slot.
- **Email**: SMTP required for OTP functionality. Use Mailtrap for testing.
- **Real-time Updates**: Dashboard uses Server-Sent Events (SSE) for live updates

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure you're using the **Transaction pooler** connection string (port `6543`, `?pgbouncer=true`) — not Session pooler (`5432`) or Direct connection
- Verify password is correct in Supabase Settings → Database
- Check Network Restrictions allow all IP addresses

### Image Upload Issues
- Verify Supabase Storage bucket `product-images` exists and is public
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

### Build Errors
- Run `npm run db:generate` before building
- Ensure all environment variables are set in Vercel
- Check `NODE_ENV=production` is set

## 📄 License

All rights reserved - Ooty Baker & Confectioner

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
