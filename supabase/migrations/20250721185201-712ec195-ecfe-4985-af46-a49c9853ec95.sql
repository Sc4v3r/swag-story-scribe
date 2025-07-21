-- Migrate existing business_vertical text data to business_vertical_id foreign key
UPDATE public.stories 
SET business_vertical_id = (
  SELECT id 
  FROM public.business_verticals 
  WHERE name = stories.business_vertical
)
WHERE business_vertical IS NOT NULL 
AND business_vertical_id IS NULL;

-- After migration, we can optionally drop the old text column
-- (commented out for now in case rollback is needed)
-- ALTER TABLE public.stories DROP COLUMN business_vertical;