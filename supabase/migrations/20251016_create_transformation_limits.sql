-- Table to track monthly transformation counts for cost control
CREATE TABLE IF NOT EXISTS public.transformation_counters (
  month_year TEXT PRIMARY KEY, -- Format: "YYYY-MM" (e.g., "2025-10")
  transformation_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Function to get counter for current month (creates if doesn't exist)
CREATE OR REPLACE FUNCTION get_current_month_counter()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  counter_value INTEGER;
BEGIN
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  -- Initialize if doesn't exist
  INSERT INTO public.transformation_counters (month_year, transformation_count)
  VALUES (current_month, 0)
  ON CONFLICT (month_year) DO NOTHING;

  -- Get current count
  SELECT transformation_count INTO counter_value
  FROM public.transformation_counters
  WHERE month_year = current_month;

  RETURN counter_value;
END;
$$;

-- Function to atomically increment counter and return new count
CREATE OR REPLACE FUNCTION increment_transformation_counter()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  new_count INTEGER;
BEGIN
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');

  -- Atomic upsert and increment
  INSERT INTO public.transformation_counters (month_year, transformation_count, updated_at)
  VALUES (current_month, 1, now())
  ON CONFLICT (month_year)
  DO UPDATE SET
    transformation_count = transformation_counters.transformation_count + 1,
    updated_at = now()
  RETURNING transformation_count INTO new_count;

  RETURN new_count;
END;
$$;

-- Enable RLS
ALTER TABLE public.transformation_counters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view counters
CREATE POLICY "Anyone can view transformation counters" ON public.transformation_counters
  FOR SELECT TO public
  USING (true);
