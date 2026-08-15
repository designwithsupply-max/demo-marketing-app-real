-- ============================================================================
-- Service pages: admin-managed content for every page linked from the
-- Services nav dropdown (Custom Closets, Walk-In Closets, Reach-In Closets,
-- Wardrobes, Garage Cabinets, Kitchen Cabinets, Pantries/Laundry/Mudrooms).
-- One public route per slug (e.g. /walk-in-closets), all rendered by the same
-- <ServicePage> component so every field below is editable from
-- /admin/services instead of being hardcoded per page.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- URL path this page lives at, e.g. "walk-in-closets" -> /walk-in-closets
    slug TEXT NOT NULL UNIQUE,
    -- Label shown in the Services nav dropdown and footer.
    nav_label TEXT NOT NULL DEFAULT '',
    -- Which gallery/project bucket "Recent Projects" pulls from.
    category TEXT NOT NULL DEFAULT 'closet' CHECK (category IN ('closet', 'kitchen', 'garage')),
    hero_eyebrow TEXT NOT NULL DEFAULT '',
    hero_heading TEXT NOT NULL DEFAULT '',
    hero_description TEXT NOT NULL DEFAULT '',
    hero_image_url TEXT NOT NULL DEFAULT '',
    primary_button_label TEXT NOT NULL DEFAULT 'Start Free Design',
    primary_button_link TEXT NOT NULL DEFAULT '/space-planner',
    -- Simple string lists, same shape the old hardcoded pages used.
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing_note TEXT NOT NULL DEFAULT '',
    delivery_note TEXT NOT NULL DEFAULT '',
    seo_title TEXT NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    show_in_nav BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_pages_active_order_idx
    ON public.service_pages (is_active, display_order);

ALTER TABLE public.service_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active service pages" ON public.service_pages;
CREATE POLICY "Public can read active service pages"
    ON public.service_pages FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage service pages" ON public.service_pages;
CREATE POLICY "Admins can manage service pages"
    ON public.service_pages FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP TRIGGER IF EXISTS update_service_pages_updated_at ON public.service_pages;
CREATE TRIGGER update_service_pages_updated_at
    BEFORE UPDATE ON public.service_pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 7 nav categories so the dropdown works immediately after migrating.
INSERT INTO public.service_pages
    (slug, nav_label, category, hero_eyebrow, hero_heading, hero_description, primary_button_label, primary_button_link, steps, features, pricing_note, delivery_note, seo_title, seo_description, display_order)
VALUES
(
    'closets',
    'Custom Closets',
    'closet',
    'Custom Closets',
    'Custom Closets in Greater Montréal, Designed Live Online',
    'We design live online and supply fully assembled cabinets. Plan your walk-in, reach-in, or wardrobe system from home in a live CAD session, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your closet with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD design together","Get a same-day quote and choose pickup, delivery or installation"]'::jsonb,
    '["Walk-in, reach-in, and wardrobe layouts","Soft-close drawers and doors","Adjustable shelves and hanging rods","Shoe racks and accessory drawers","Finish options that match your style","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Custom Closets in Greater Montréal, Designed Live Online | Design & Supply',
    'Custom walk-in and reach-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    0
),
(
    'walk-in-closets',
    'Walk-In Closets',
    'closet',
    'Walk-In Closets',
    'Walk-In Closets in Greater Montréal, Designed Live Online',
    'Turn a spare room or primary suite into a walk-in closet built around your wardrobe. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your walk-in with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD layout together","Get a same-day quote and choose pickup, delivery or installation"]'::jsonb,
    '["Island with drawers, where space allows","Adjustable shelves and hanging rods","Shoe shelving and accessory drawers","Soft-close drawers and doors","Finish options that match your style","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Walk-In Closets in Greater Montréal, Designed Live Online | Design & Supply',
    'Custom walk-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    1
),
(
    'reach-in-closets',
    'Reach-In Closets',
    'closet',
    'Reach-In Closets',
    'Reach-In Closets in Greater Montréal, Designed Live Online',
    'Make the most of a standard bedroom closet with a reach-in system built to fit. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your reach-in with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD layout together","Get a same-day quote and choose pickup, delivery or installation"]'::jsonb,
    '["Double and single hang sections","Adjustable shelving","Drawer banks for folded clothing","Soft-close hardware","Finish options that match your style","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Reach-In Closets in Greater Montréal, Designed Live Online | Design & Supply',
    'Custom reach-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    2
),
(
    'wardrobes',
    'Wardrobes',
    'closet',
    'Wardrobes',
    'Custom Wardrobes in Greater Montréal, Designed Live Online',
    'A freestanding or built-in wardrobe designed for rooms without a closet. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your space with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD wardrobe design together","Get a same-day quote and choose pickup, delivery or installation"]'::jsonb,
    '["Hinged or sliding door options","Adjustable shelves and hanging rods","Mirror door options","Soft-close hardware","Finish options that match your style","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Custom Wardrobes in Greater Montréal, Designed Live Online | Design & Supply',
    'Custom wardrobes designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    3
),
(
    'garage-cabinets',
    'Garage Cabinets',
    'garage',
    'Garage Cabinets',
    'Garage Cabinets & Storage in Greater Montréal',
    'We design live online and supply fully assembled cabinets, with local installation across Greater Montréal. Organize tools, gear, and seasonal items with a layout built around your space.',
    'Start Free Design',
    '/space-planner',
    '["Measure your garage with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD garage plan","Get a same-day quote and supply plan"]'::jsonb,
    '["Heavy-duty wall and base cabinets","Slatwall and accessory storage","Workbench and tool organization layouts","Overhead and vertical storage options","Durable finishes for garage use","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Garage Cabinets & Storage in Greater Montréal | Design & Supply',
    'Custom garage cabinets, slatwall, and workbench storage designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    4
),
(
    'kitchens',
    'Kitchen Cabinets',
    'kitchen',
    'Kitchen Cabinets',
    'Kitchen Cabinets in Greater Montréal, Designed Live Online',
    'We design live online and supply fully assembled cabinets. Build a better kitchen flow with a live CAD design session from home, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your kitchen with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD kitchen layout","Get a same-day quote and cabinet supply plan"]'::jsonb,
    '["Base cabinets, wall cabinets, and islands","Soft-close hinges and drawer slides","Pantry and corner storage solutions","Cabinet options for your appliances","Style and finish choices for your space","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Kitchen Cabinets in Greater Montréal, Designed Live Online | Design & Supply',
    'Custom kitchen cabinets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    5
),
(
    'pantries-laundry-mudrooms',
    'Pantries / Laundry / Mudrooms',
    'closet',
    'Pantries, Laundry & Mudrooms',
    'Pantries, Laundry & Mudroom Storage in Greater Montréal',
    'Custom storage for pantries, laundry rooms and mudrooms — designed live online and supplied fully assembled, with local installation across Greater Montréal.',
    'Start Free Design',
    '/space-planner',
    '["Measure your space with our 3-Step Space Planner","Meet live with a designer online","Review your custom CAD layout together","Get a same-day quote and choose pickup, delivery or installation"]'::jsonb,
    '["Adjustable pantry shelving","Laundry cabinets and folding counters","Mudroom lockers, hooks and bench storage","Durable finishes for high-use spaces","Storage built around your appliances","Fully assembled cabinet supply"]'::jsonb,
    'Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.',
    'Choose pickup, curbside delivery, or local installation across Greater Montréal.',
    'Pantries, Laundry & Mudroom Storage in Greater Montréal | Design & Supply',
    'Custom pantry, laundry and mudroom storage designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.',
    6
)
ON CONFLICT (slug) DO NOTHING;
