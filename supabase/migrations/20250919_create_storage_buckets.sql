-- Create the public-images bucket and ensure it's public
-- Handle both old and new Supabase schema versions
DO $$
BEGIN
  -- Check if 'public' column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'public'
  ) THEN
    -- Use public column if available
    INSERT INTO storage.buckets (id, name, "public")
    VALUES ('public-images', 'public-images', true)
    ON CONFLICT (id) DO UPDATE SET "public" = EXCLUDED."public";

    -- Also ensure it's public even if it already existed
    UPDATE storage.buckets SET "public" = true WHERE id = 'public-images';
  ELSE
    -- Fallback: just insert without public column
    INSERT INTO storage.buckets (id, name)
    VALUES ('public-images', 'public-images')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Create policies for storage objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'public-images');

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public-images');

DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner)
  WITH CHECK (bucket_id = 'public-images');

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (auth.uid() = owner AND bucket_id = 'public-images');