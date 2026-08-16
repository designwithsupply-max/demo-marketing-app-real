-- ============================================================================
-- Richer project detail pages: city/location, what the client needed, what
-- we designed, and main features for each gallery project.
-- ============================================================================
ALTER TABLE public.gallery_projects
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS client_needed TEXT,
  ADD COLUMN IF NOT EXISTS what_we_designed TEXT,
  ADD COLUMN IF NOT EXISTS main_features TEXT[] NOT NULL DEFAULT '{}';

-- ============================================================================
-- Richer project videos: city/location and a short plain-text transcript
-- (for accessibility, in lieu of full closed captions).
-- ============================================================================
ALTER TABLE public.project_videos
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS transcript TEXT;
