-- Create visibility enum type
CREATE TYPE visibility_type AS ENUM ('public', 'unlisted', 'private');

-- Add visibility column to images table (default to public for existing images)
ALTER TABLE public.images
  ADD COLUMN visibility visibility_type DEFAULT 'public' NOT NULL;

-- Create index on visibility for efficient filtering
CREATE INDEX idx_images_visibility ON public.images(visibility);

-- Drop the old "Anyone can view images" policy
DROP POLICY IF EXISTS "Anyone can view images" ON public.images;

-- Create new policies for visibility-aware access
-- 1. Users can always see their own images
CREATE POLICY "Users can view own images" ON public.images
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Public images are visible to everyone
CREATE POLICY "Anyone can view public images" ON public.images
  FOR SELECT TO public
  USING (visibility = 'public');

-- 3. Unlisted images are visible to anyone with the link (including anonymous users)
CREATE POLICY "Anyone can view unlisted images" ON public.images
  FOR SELECT TO public
  USING (visibility = 'unlisted');
