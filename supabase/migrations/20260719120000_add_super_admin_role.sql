-- Adds the 'super_admin' role. Kept in its own migration on purpose: Postgres
-- forbids USING a newly added enum value in the same transaction that adds it,
-- so the policies/seeds that reference 'super_admin' live in the next migration.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
