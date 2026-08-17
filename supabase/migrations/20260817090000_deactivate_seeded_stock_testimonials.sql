-- The initial faqs/testimonials seed migration (20260625000000) inserted 5
-- fabricated US reviews with stock Unsplash photos as placeholder content.
-- Deactivate (not delete) them so real testimonials can replace them without
-- losing the row history. No-op if they were already handled manually.
UPDATE public.testimonials
SET is_active = false
WHERE name IN ('Sarah Mitchell', 'James Thornton', 'Elena Rodriguez', 'David Chen', 'Amara Williams');
