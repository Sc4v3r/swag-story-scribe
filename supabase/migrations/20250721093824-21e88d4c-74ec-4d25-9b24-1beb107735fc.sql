-- Add geolocation field to stories table
ALTER TABLE public.stories 
ADD COLUMN geolocation text CHECK (geolocation IN ('AMER', 'EMEA', 'APAC'));

-- Add index for better performance on geolocation filtering
CREATE INDEX idx_stories_geolocation ON public.stories(geolocation);

-- Update existing stories with sample geolocations
UPDATE public.stories 
SET geolocation = CASE 
  WHEN random() < 0.33 THEN 'AMER'
  WHEN random() < 0.66 THEN 'EMEA'
  ELSE 'APAC'
END
WHERE geolocation IS NULL;