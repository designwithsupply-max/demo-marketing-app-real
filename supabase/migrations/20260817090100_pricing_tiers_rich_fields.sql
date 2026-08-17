-- Expand pricing_tiers from a bare price+label pair into a real editable
-- pricing card, so the admin can build out a proper pricing page without a
-- developer.
ALTER TABLE public.pricing_tiers
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'closets',
  ADD COLUMN IF NOT EXISTS price_range TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_factors TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS button_link TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Categorize the existing seeded tiers so they don't all land in "closets".
UPDATE public.pricing_tiers SET category = 'wardrobes' WHERE label = 'Sliding Wardrobes';
UPDATE public.pricing_tiers SET category = 'walk-in-closets' WHERE label = 'Walk-in Closets';
UPDATE public.pricing_tiers SET category = 'closets' WHERE label = 'Dressing Rooms';
UPDATE public.pricing_tiers SET category = 'closets' WHERE label = 'Luxury Suites';
