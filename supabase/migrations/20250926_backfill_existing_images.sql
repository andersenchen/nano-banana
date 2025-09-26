INSERT INTO public.images (id, user_id, name, created_at)
SELECT
  id,
  owner as user_id,
  name,
  created_at
FROM storage.objects
WHERE bucket_id = 'public-images'
ON CONFLICT (id) DO NOTHING;