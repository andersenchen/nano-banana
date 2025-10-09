-- Create the public-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-images', 'public-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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