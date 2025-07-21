-- Add foreign key relationship to stories table (if not already exists)
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS business_vertical_id UUID REFERENCES public.business_verticals(id);

-- Create index for better performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_stories_business_vertical_id ON public.stories(business_vertical_id);