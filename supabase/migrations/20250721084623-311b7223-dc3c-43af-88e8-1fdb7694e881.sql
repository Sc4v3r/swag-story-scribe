-- Add diagram field to stories table
ALTER TABLE stories ADD COLUMN diagram_url TEXT;

-- Add some example kill chain diagrams for existing stories
UPDATE stories 
SET diagram_url = CASE 
  WHEN title LIKE '%SQL Injection%' THEN 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop'
  WHEN title LIKE '%Domain Admin%' THEN 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop'
  WHEN title LIKE '%Wireless%' THEN 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop'
  WHEN title LIKE '%Government%' THEN 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=600&fit=crop'
  WHEN title LIKE '%Cloud%' THEN 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop'
  WHEN title LIKE '%Point-of-Sale%' THEN 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop'
  WHEN title LIKE '%Stolen%' THEN 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop'
  WHEN title LIKE '%SCADA%' THEN 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=600&fit=crop'
  WHEN title LIKE '%Insurance%' THEN 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop'
  WHEN title LIKE '%Transportation%' THEN 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop'
  ELSE NULL
END;