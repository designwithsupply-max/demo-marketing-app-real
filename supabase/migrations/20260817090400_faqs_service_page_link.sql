-- Lets an admin pick specific FAQs to show on a given service page, and adds
-- a language column now so the FAQ table doesn't need another migration when
-- French support (phase 2) lands.
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS service_page_id UUID REFERENCES public.service_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
