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
- `lib/context/image-refresh-context.tsx` - Global state for triggering image gallery refreshes
- `lib/types/index.ts` - Centralized type definitions (database types, API responses, enums)
- `lib/api/permissions.ts` - Permission checking utilities for image access/modification
- `lib/api/error-handler.ts` - Standardized error responses with codes and status mapping
- `lib/config/transformation-limits.ts` - Monthly transformation limit configuration

### Authentication
- Password-based auth and Google OAuth via Supabase
- Server Components: use `createClient()` from `@/lib/supabase/server`
- Client Components: use `createClient()` from `@/lib/supabase/client`
- **Important:** Always create new server client instances per function (don't cache globally) for Vercel/Fluid compute compatibility

### Database Schema
Images are stored with metadata in PostgreSQL (`public.images` table) and binaries in Supabase Storage (`user_images` bucket):

**Core Tables:**
- `images` table:
  - Basic: id (UUID), user_id, name, created_at, likes_count, comments_count
  - Visibility: visibility (enum: 'public' | 'unlisted' | 'private')
  - Provenance: source_image_id, transformation_prompt, root_image_id, generation_depth
- `likes` table: user_id + image_id composite key
- `comments` table: id, image_id, user_id, content, created_at
- `transformation_counters` table: month_year (PK), transformation_count, created_at, updated_at

**Row Level Security (RLS):**
- Public images: visible to everyone
- Unlisted images: visible to anyone with the link
- Private images: only visible to owner
- Users can only modify/delete their own images

**Database Functions:**
- `set_image_provenance()` - Trigger that auto-populates provenance fields on image insert
- `get_current_month_counter()` - Returns current month's transformation count
- `increment_transformation_counter()` - Atomically increments transformation count

### API Architecture

**RESTful Endpoints:**
- `GET /api/images` - List images (supports `?filter=mine` and `?page=N`)
- `GET /api/images/[id]` - Get single image with metadata
- `PATCH /api/images/[id]` - Update image (visibility, etc.)
- `DELETE /api/images/[id]` - Delete image
- `POST /api/images/[id]/likes` - Like/unlike image
- `GET /api/images/[id]/comments` - Get comments for image
- `POST /api/images/[id]/comments` - Add comment to image
- `DELETE /api/comments/[id]` - Delete comment
- `GET /api/images/[id]/provenance` - Get image ancestry chain
- `GET /api/images/[id]/derivatives` - Get child/derivative images
- `GET /api/images/[id]/tree` - Get full transformation tree
- `POST /api/transformations` - Transform image with AI

**Error Handling (lib/api/error-handler.ts):**
- Standardized error response format: `{ error: string, code: string, details?: unknown }`
- Error codes: BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, RATE_LIMIT, etc.
- Helper functions: `createErrorResponse()`, `validationError()`, `notFoundError()`, `unauthorizedError()`
- `createSuccessResponse()` for consistent success responses: `{ success: true, data: T, meta?: {} }`

**Permissions (lib/api/permissions.ts):**
- `checkImageViewPermission(imageId)` - Validates user can view image based on visibility
- `checkImageModifyPermission(imageId)` - Validates user owns image for modifications
- `getAuthenticatedUser()` - Returns user ID if authenticated
- `validateVisibility(value)` - Type guard for visibility enum values

**Rate Limiting:**
- Monthly transformation limit tracked in `transformation_counters` table
- Configured in `lib/config/transformation-limits.ts` (default: 1000/month)
- Enforced in `/api/transformations` before processing

### AI Image Transformation Flow
1. User uploads image → stored in Supabase Storage (`user_images` bucket)
2. User provides text prompt → POST to `/api/transformations`
3. Server checks monthly transformation limit (configurable in `lib/config/transformation-limits.ts`)
4. Server fetches original image, converts to base64 (10MB max)
5. Sends to Gemini 2.5 Flash with prompt + image
6. Returns base64 transformed image → stored in Supabase
7. Metadata saved to `images` table with provenance tracking

### Type System

**Centralized Types (lib/types/index.ts):**
- Database types: `ImageRecord`, `CommentRecord`, `LikeRecord` (match DB schema exactly)
- API response types: `ImageData`, `Comment` (camelCase, includes computed fields)
- Provenance types: `ImageProvenance`, `ImageWithAncestry`, `ImageWithDescendants`
- Enums: `VisibilityType` ('public' | 'unlisted' | 'private')
- API envelopes: `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>`
- Type guards: `isValidVisibility()`, `isApiError()`

**Important:** Use database types for DB operations, API response types for client-facing data.

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