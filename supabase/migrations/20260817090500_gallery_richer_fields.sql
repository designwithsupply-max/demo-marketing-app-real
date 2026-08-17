-- gallery_projects' original CREATE TABLE isn't tracked in this migration
-- history (it predates the folder), so — same as
-- 20260816140000_project_detail_and_video_fields.sql — these are additive
-- ADD COLUMN IF NOT EXISTS statements rather than a fresh CREATE TABLE.
ALTER TABLE public.gallery_projects
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS service_page_slug TEXT;

-- Per-image alt text on the gallery (project photo) table.
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS alt_text TEXT;
