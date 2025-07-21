-- Create business_verticals table
CREATE TABLE public.business_verticals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_verticals ENABLE ROW LEVEL SECURITY;

-- Create policies for business_verticals
CREATE POLICY "Public can view business verticals" 
ON public.business_verticals 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage business verticals" 
ON public.business_verticals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert predefined business verticals
INSERT INTO public.business_verticals (name, description) VALUES
('Financial Services', 'Banks, credit unions, investment firms, and other financial institutions'),
('Healthcare', 'Hospitals, clinics, pharmaceutical companies, and healthcare providers'),
('Government', 'Federal, state, and local government agencies and departments'),
('Manufacturing', 'Industrial manufacturing, automotive, aerospace, and production companies'),
('Technology', 'Software companies, tech startups, IT services, and technology vendors'),
('Retail', 'E-commerce, brick-and-mortar stores, and retail chains'),
('Education', 'Schools, universities, educational institutions, and training organizations'),
('Energy & Utilities', 'Power generation, oil & gas, renewable energy, and utility companies'),
('Professional Services', 'Consulting, legal, accounting, and other professional service firms'),
('Telecommunications', 'Internet service providers, mobile carriers, and telecom infrastructure'),
('Insurance', 'Insurance carriers, brokers, and risk management companies'),
('Transportation', 'Airlines, shipping, logistics, and transportation infrastructure');

-- Add foreign key relationship to stories table
ALTER TABLE public.stories 
ADD COLUMN business_vertical_id UUID REFERENCES public.business_verticals(id);

-- Create index for better performance
CREATE INDEX idx_stories_business_vertical_id ON public.stories(business_vertical_id);

-- Create trigger for automatic timestamp updates on business_verticals
CREATE TRIGGER update_business_verticals_updated_at
  BEFORE UPDATE ON public.business_verticals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();