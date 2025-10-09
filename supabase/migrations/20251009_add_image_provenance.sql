-- Add provenance tracking columns to images table
ALTER TABLE public.images
  ADD COLUMN source_image_id UUID,
  ADD COLUMN transformation_prompt TEXT,
  ADD COLUMN root_image_id UUID,
  ADD COLUMN generation_depth INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for efficient querying
CREATE INDEX idx_images_source_image_id ON public.images(source_image_id);
CREATE INDEX idx_images_root_image_id ON public.images(root_image_id);

-- Backfill existing images: set root_image_id to self, generation_depth to 0
UPDATE public.images
SET
  root_image_id = id,
  generation_depth = 0
WHERE root_image_id IS NULL;

-- Make root_image_id NOT NULL after backfill
ALTER TABLE public.images
  ALTER COLUMN root_image_id SET NOT NULL;

-- Create function to auto-populate provenance fields on insert
CREATE OR REPLACE FUNCTION public.set_image_provenance()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an original image (no source)
  IF NEW.source_image_id IS NULL THEN
    NEW.root_image_id := NEW.id;
    NEW.generation_depth := 0;
  ELSE
    -- This is a derivative - inherit root and increment depth
    SELECT root_image_id, generation_depth + 1
    INTO NEW.root_image_id, NEW.generation_depth
    FROM public.images
    WHERE id = NEW.source_image_id;

    -- If parent not found, treat as root
    IF NEW.root_image_id IS NULL THEN
      NEW.root_image_id := NEW.id;
      NEW.generation_depth := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call function before insert
CREATE TRIGGER trigger_set_image_provenance
  BEFORE INSERT ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_image_provenance();
