# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development server:**
```bash
npm run dev  # Runs Next.js with Turbopack
```

**Build and start:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint  # ESLint
# Project also uses Biome (@biomejs/biome) for additional linting
```

**Local Supabase:**
```bash
supabase start      # Start local Supabase
supabase db push    # Apply migrations
supabase db reset   # Reset DB and apply all migrations
```

## Architecture

### Core Stack
- **Next.js 15** with App Router, React Server Components, and Turbopack
- **React 19** with TypeScript (strict mode)
- **Supabase** for authentication, database (PostgreSQL), and storage
- **Google Gemini 2.5 Flash** (`gemini-2.5-flash-image-preview`) for AI image transformation
- **Tailwind CSS** with shadcn/ui components

### Project Structure

**App Router Layout:**
- `/app` - Next.js 15 App Router pages and API routes
- `/app/@modal` - Parallel route for modal overlay (intercepting routes pattern with `(.)image/[uuid]`)
- `/app/api/*` - API route handlers (transform-image, images, likes, comments, etc.)
- `/app/protected` - Auth-protected routes
- `/components` - React components (including shadcn/ui in `/components/ui`)
- `/lib` - Shared utilities and context providers
- `/supabase` - Database migrations and config

**Key Files:**
- `middleware.ts` - Supabase session management (runs on all routes except static assets)
- `lib/supabase/server.ts` - Server-side Supabase client (create new instance per function)
- `lib/supabase/client.ts` - Browser-side Supabase client
- `lib/image-refresh-context.tsx` - Global state for triggering image gallery refreshes

### Authentication
- Password-based auth and Google OAuth via Supabase
- Server Components: use `createClient()` from `@/lib/supabase/server`
- Client Components: use `createClient()` from `@/lib/supabase/client`
- **Important:** Always create new server client instances per function (don't cache globally) for Vercel/Fluid compute compatibility

### Database Schema
Images are stored with metadata in PostgreSQL (`public.images` table) and binaries in Supabase Storage (`user_images` bucket):
- `images` table: id (UUID), user_id, name, created_at, likes_count, comments_count
- `likes` table: user_id + image_id composite key
- `comments` table: id, image_id, user_id, content, created_at
- Row Level Security (RLS) enabled on all tables

### AI Image Transformation Flow
1. User uploads image → stored in Supabase Storage (`user_images` bucket)
2. User provides text prompt → POST to `/api/transform-image`
3. Server fetches original image, converts to base64 (10MB max)
4. Sends to Gemini 2.5 Flash with prompt + image
5. Returns base64 transformed image → stored in Supabase
6. Metadata saved to `images` table

### Parallel Routes & Modals
- `@modal` slot for intercepting routes: clicking image on gallery opens modal overlay
- Modal route: `app/@modal/(.)image/[uuid]/page.tsx`
- Full page route: `app/image/[uuid]/page.tsx`
- `app/@modal/default.tsx` renders `null` when no modal active

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (for frontend)
- `GEMINI_API_KEY` - Google AI Studio API key for Gemini
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth for Supabase local dev

Optional:
- `NEXT_PUBLIC_GA_ID` - Google Analytics
- `NEXT_PUBLIC_FULLSTORY_ORG` - FullStory analytics

### TypeScript Configuration
- Path alias: `@/*` maps to project root
- Strict mode enabled
- Target: ES2017

### Styling
- Tailwind CSS with `next-themes` for dark/light mode
- Uses `clsx` and `tailwind-merge` (via `lib/utils.ts` `cn()` helper)
- Custom font: Geist (primary), Inter (for logo/headings)