-- Local SEO landing pages, one per service area (Laval, Longueuil, West
-- Island, South Shore, etc.) — same shape/pattern as service_pages so the
-- admin screen and public rendering can follow the exact same conventions.
CREATE TABLE IF NOT EXISTS public.location_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  city_name TEXT NOT NULL,
  hero_eyebrow TEXT NOT NULL DEFAULT '',
  hero_heading TEXT NOT NULL,
  hero_description TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT NOT NULL DEFAULT '',
  additional_image_urls TEXT[] NOT NULL DEFAULT '{}',
  -- Markdown body (same renderer as blog posts) so the admin can write real,
  -- unique local content per page and link internally to service pages.
  content TEXT NOT NULL DEFAULT '',
  primary_button_label TEXT NOT NULL DEFAULT 'Start Free Design',
  primary_button_link TEXT NOT NULL DEFAULT '/space-planner',
  -- Matches against gallery_projects.city (case-insensitive substring) to
  -- surface relevant real projects without any manual per-project linking.
  city_filter TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.location_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active location_pages"
  ON public.location_pages FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage location_pages"
  ON public.location_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE TRIGGER update_location_pages_updated_at
  BEFORE UPDATE ON public.location_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Let FAQs be pinned to a location page too (same optional-link pattern as
-- faqs.service_page_id from the 20260817090400 migration).
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS location_page_id UUID REFERENCES public.location_pages(id) ON DELETE SET NULL;

-- Seed the areas already named on the homepage's service-area section, with
-- honest, factual starter copy (no invented stats) — editable at
-- /admin/locations afterward.
INSERT INTO public.location_pages (slug, city_name, hero_eyebrow, hero_heading, hero_description, city_filter, content, seo_title, seo_description, display_order)
VALUES
  (
    'montreal',
    'Montréal',
    'Serving Montréal',
    'Custom Closets & Cabinets in Montréal, Designed Live Online',
    'Design & Supply designs and supplies custom closets, kitchen cabinets, and garage cabinets for homes across Montréal. Meet a designer live online, then choose pickup, curbside delivery, or local installation.',
    'Montreal',
    E'We work with homeowners across Montréal — from the Plateau to Griffintown to NDG — on custom closets, kitchen cabinets, and garage storage. Every project starts with our [3-Step Space Planner](/space-planner): you send measurements and photos, then meet a designer live online to review a custom CAD design together.\n\nOnce your design is approved, your cabinets are supplied fully assembled — no flat-pack, no guesswork. You can pick up your order, arrange curbside delivery, or book local installation in the Montréal area.\n\nBrowse real [Montréal-area projects](/gallery) or explore our [custom closets](/closets), [kitchen cabinets](/kitchens), and [garage cabinets](/garage-cabinets) pages for more on what we design.',
    'Custom Closets & Cabinets in Montréal | Design & Supply',
    'Custom closets, kitchen cabinets and garage cabinets for Montréal homes. Live online design and local installation in Montréal.',
    0
  ),
  (
    'laval',
    'Laval',
    'Serving Laval',
    'Custom Closets & Cabinets in Laval, Designed Live Online',
    'Design & Supply designs and supplies custom closets, kitchen cabinets, and garage cabinets for homes in Laval. Meet a designer live online, then choose pickup, curbside delivery, or local installation.',
    'Laval',
    E'Laval homeowners work with us the same way clients across Greater Montréal do: send your measurements and photos through the [3-Step Space Planner](/space-planner), then meet a designer live online to walk through a custom CAD design together.\n\nCabinets are supplied fully assembled, with pickup, curbside delivery, or local installation available in Laval.\n\nSee real [project photos](/gallery), or learn more about our [custom closets](/closets), [kitchen cabinets](/kitchens), and [garage cabinets](/garage-cabinets).',
    'Custom Closets & Cabinets in Laval | Design & Supply',
    'Custom closets, kitchen cabinets and garage cabinets for Laval homes. Live online design and local installation in Laval.',
    1
  ),
  (
    'longueuil',
    'Longueuil',
    'Serving Longueuil',
    'Custom Closets & Cabinets in Longueuil, Designed Live Online',
    'Design & Supply designs and supplies custom closets, kitchen cabinets, and garage cabinets for homes in Longueuil. Meet a designer live online, then choose pickup, curbside delivery, or local installation.',
    'Longueuil',
    E'For homeowners in Longueuil and the South Shore, the process is simple: submit your space through the [3-Step Space Planner](/space-planner), then meet a designer live online for a custom CAD design session.\n\nYour cabinets arrive fully assembled, with pickup, curbside delivery, or local installation available in Longueuil.\n\nExplore real [project photos](/gallery), or see our [custom closets](/closets), [kitchen cabinets](/kitchens), and [garage cabinets](/garage-cabinets) pages.',
    'Custom Closets & Cabinets in Longueuil | Design & Supply',
    'Custom closets, kitchen cabinets and garage cabinets for Longueuil homes. Live online design and local installation in Longueuil.',
    2
  ),
  (
    'west-island',
    'West Island',
    'Serving the West Island',
    'Custom Closets & Cabinets on the West Island, Designed Live Online',
    'Design & Supply designs and supplies custom closets, kitchen cabinets, and garage cabinets for homes across the West Island. Meet a designer live online, then choose pickup, curbside delivery, or local installation.',
    'West Island',
    E'From Pointe-Claire to Kirkland to Beaconsfield, West Island homeowners send their measurements and photos through the [3-Step Space Planner](/space-planner), then meet a designer live online to review a custom CAD design.\n\nCabinets are supplied fully assembled, with pickup, curbside delivery, or local installation available across the West Island.\n\nBrowse real [project photos](/gallery), or explore our [custom closets](/closets), [kitchen cabinets](/kitchens), and [garage cabinets](/garage-cabinets) pages.',
    'Custom Closets & Cabinets on the West Island | Design & Supply',
    'Custom closets, kitchen cabinets and garage cabinets for West Island homes. Live online design and local installation on the West Island.',
    3
  ),
  (
    'south-shore',
    'South Shore',
    'Serving the South Shore',
    'Custom Closets & Cabinets on the South Shore, Designed Live Online',
    'Design & Supply designs and supplies custom closets, kitchen cabinets, and garage cabinets for homes across the South Shore. Meet a designer live online, then choose pickup, curbside delivery, or local installation.',
    'South Shore',
    E'South Shore homeowners work with us through the same live online process: submit your space through the [3-Step Space Planner](/space-planner), then meet a designer live online for a custom CAD design session.\n\nYour cabinets are supplied fully assembled, with pickup, curbside delivery, or local installation available across the South Shore.\n\nSee real [project photos](/gallery), or learn more about our [custom closets](/closets), [kitchen cabinets](/kitchens), and [garage cabinets](/garage-cabinets).',
    'Custom Closets & Cabinets on the South Shore | Design & Supply',
    'Custom closets, kitchen cabinets and garage cabinets for South Shore homes. Live online design and local installation on the South Shore.',
    4
  )
ON CONFLICT (slug) DO NOTHING;
