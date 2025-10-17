# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mememaker is an AI-powered image transformation platform built with Next.js 15, Supabase, and Google's Gemini 2.5 Flash (Nano Banana). Users upload images and transform them using natural language prompts. The platform includes social features (likes, comments) and tracks image provenance/lineage.

**Live Demo**: https://nano-banana-nine.vercel.app/

## Development Commands

```bash
# Development (uses Turbopack for faster builds)
npm run dev

# Production build
npm run build
npm start

# Linting (Next.js ESLint + Biome)
npm run lint
```

## Database Management

The project uses Supabase with migrations in `supabase/migrations/`:

```bash
# Link to Supabase project (one-time setup)
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push

# Generate TypeScript types from database schema
supabase gen types typescript --local > lib/types/supabase.ts
```

## Architecture

### Core Concepts

**Image Provenance System**: Every transformed image tracks its ancestry through `source_image_id`, `root_image_id`, `transformation_prompt`, and `generation_depth`. A database trigger automatically populates these fields on insert. Original uploads have `source_image_id = null` and `generation_depth = 0`.

**Visibility Levels**: Images have three visibility states (`public`, `unlisted`, `private`) that control who can view them:
- Public: Visible in gallery, anyone can view
- Unlisted: Not in gallery, viewable with direct link
- Private: Only owner can view

**Transformation Limits**: Monthly transformation quotas prevent API cost overruns. The limit is set in `lib/config/transformation-limits.ts`. Database functions `get_current_month_counter()` and `increment_transformation_counter()` track usage atomically.

### Key Directories

- `app/` - Next.js App Router pages and API routes
  - `app/api/` - REST API endpoints for images, likes, comments, transformations
  - `app/@modal/` - Parallel route for modal image views
- `lib/` - Shared utilities and business logic
  - `lib/types/` - TypeScript type definitions (centralized)
  - `lib/api/` - API utilities (permissions, error handling)
  - `lib/supabase/` - Supabase client creation (server/client/middleware)
- `components/` - React components
  - `components/ui/` - shadcn/ui base components
- `supabase/migrations/` - Database schema migrations (timestamped SQL files)

### Critical Patterns

**Supabase Client Creation**: Always create a new Supabase client in each function—never cache globally. This is critical for Vercel's Fluid compute. Use:
- `lib/supabase/server.ts` for Server Components and API routes
- `lib/supabase/client.ts` for Client Components
- `lib/supabase/middleware.ts` for middleware session updates

**API Error Handling**: All API routes use centralized error handling from `lib/api/error-handler.ts`:
- Wrap handlers with `withErrorHandler()` for automatic error catching
- Use helper functions: `createErrorResponse()`, `createSuccessResponse()`, `validationError()`, `notFoundError()`, `unauthorizedError()`, `forbiddenError()`
- All responses follow the standard format: `{ success: boolean, data?: any, error?: string, code?: string }`

**Permission Checks**: Use centralized permission utilities from `lib/api/permissions.ts`:
- `checkImageViewPermission(imageId)` - Verifies user can view based on visibility
- `checkImageModifyPermission(imageId)` - Verifies user owns the image
- `getAuthenticatedUser()` - Returns authenticated user or error

**Type Definitions**: All types are centralized in `lib/types/index.ts`:
- Database record types (e.g., `ImageRecord`, `CommentRecord`)
- API response types (e.g., `ImageData`, `Comment`)
- Provenance types (e.g., `ImageProvenance`, `ImageWithAncestry`)
- Standard response envelopes (`ApiSuccessResponse<T>`, `ApiErrorResponse`)

### Image Transformation Flow

1. User uploads image → stored in Supabase Storage `public-images` bucket
2. User submits transformation prompt → `POST /api/transformations`
3. API checks monthly limit via `get_current_month_counter()`
4. If under limit, atomically increments counter via `increment_transformation_counter()`
5. Downloads source image, converts to base64
6. Calls Gemini 2.5 Flash with image + prompt
7. Returns base64 transformed image to client
8. Client uploads transformed image with `source_image_id` set
9. Database trigger auto-populates provenance fields

### Database Schema Highlights

**Images Table** (`public.images`):
- Primary fields: `id`, `user_id`, `name`, `created_at`, `visibility`
- Social: `likes_count`, `comments_count` (denormalized counts)
- Provenance: `source_image_id`, `root_image_id`, `transformation_prompt`, `generation_depth`
- RLS policies enforce ownership for mutations
- Trigger `set_image_provenance()` runs before insert

**Transformation Counters** (`public.transformation_counters`):
- Tracks monthly transformation counts by `month_year` (format: "YYYY-MM")
- Functions `get_current_month_counter()` and `increment_transformation_counter()` provide atomic operations

## Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=

# Google OAuth (for client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Google Gemini AI
GEMINI_API_KEY=

# Google OAuth (for Supabase server)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Common Tasks

**Adding a new API route**: Follow the pattern in `app/api/images/[id]/route.ts`:
1. Import utilities from `lib/api/error-handler.ts` and `lib/api/permissions.ts`
2. Wrap handler with `withErrorHandler()`
3. Use permission check functions early in handler
4. Return responses via `createSuccessResponse()` or error helpers
5. Add types to `lib/types/index.ts` if needed

**Adding a migration**:
1. Create file in `supabase/migrations/` with format `YYYYMMDD_description.sql`
2. Write migration SQL (use `IF NOT EXISTS` for idempotency)
3. Test locally with `supabase db push`
4. Commit migration file—production deployment will auto-apply

**Modifying transformation limit**: Update `MONTHLY_TRANSFORMATION_LIMIT` in `lib/config/transformation-limits.ts`.

**Adding new image metadata**: Add column to `images` table, update `ImageRecord` in `lib/types/index.ts`, update API routes to include field in responses.

## Tech Stack Notes

- **Next.js 15**: Uses App Router, React Server Components, and async Server Components pattern
- **React 19**: Latest features including async transitions
- **Supabase**: Auth, Database (Postgres), Storage (S3-compatible)
- **Google Gemini 2.5 Flash**: Model ID `gemini-2.5-flash-image-preview` for transformations
- **shadcn/ui**: Component library built on Radix UI primitives
- **Biome + ESLint**: Dual linting setup for code quality
- **Tailwind CSS**: Utility-first styling with `tailwind-merge` for class merging

## Deployment

The app is deployed on Vercel. On push to main:
1. Vercel builds Next.js app
2. Environment variables loaded from Vercel dashboard
3. Middleware handles Supabase session refresh
4. Serverless functions serve API routes

Ensure all environment variables are set in Vercel project settings.
