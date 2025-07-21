-- Insert predefined tags for cybersecurity stories
INSERT INTO public.tags (name, color) VALUES
  ('External Pentest', '#ef4444'),
  ('Internal Pentest', '#f97316'),
  ('Phishing', '#eab308'),
  ('Domain Admin', '#22c55e'),
  ('OT', '#06b6d4'),
  ('Wireless', '#3b82f6'),
  ('Web App', '#8b5cf6'),
  ('PII data', '#ec4899'),
  ('PHI data', '#f43f5e'),
  ('Stolen Laptop', '#64748b')
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color;