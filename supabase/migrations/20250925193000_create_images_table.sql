CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_created_at ON public.images(created_at DESC);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images" ON public.images
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert images" ON public.images
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON public.images
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON public.images
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);