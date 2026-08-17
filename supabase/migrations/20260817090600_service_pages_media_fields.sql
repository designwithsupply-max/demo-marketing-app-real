ALTER TABLE public.service_pages
  ADD COLUMN IF NOT EXISTS additional_image_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url TEXT;
