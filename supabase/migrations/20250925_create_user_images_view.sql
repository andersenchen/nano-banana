-- Create a view in the public schema that exposes storage objects
CREATE OR REPLACE VIEW public.user_storage_objects
WITH (security_invoker=true) AS
SELECT
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at
FROM storage.objects;

-- Grant access to authenticated users
GRANT SELECT ON public.user_storage_objects TO authenticated;