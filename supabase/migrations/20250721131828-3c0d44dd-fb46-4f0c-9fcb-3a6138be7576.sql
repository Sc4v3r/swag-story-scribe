-- Create business_verticals table for better management
CREATE TABLE public.business_verticals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_verticals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view business verticals" 
ON public.business_verticals 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage business verticals" 
ON public.business_verticals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_business_verticals_updated_at
BEFORE UPDATE ON public.business_verticals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing business verticals from stories table
INSERT INTO public.business_verticals (name)
SELECT DISTINCT business_vertical 
FROM public.stories 
WHERE business_vertical IS NOT NULL AND business_vertical != '';