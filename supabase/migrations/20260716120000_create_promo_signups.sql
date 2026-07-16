CREATE TABLE IF NOT EXISTS public.promo_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One code per person: a repeat signup re-sends the code they already have.
CREATE UNIQUE INDEX IF NOT EXISTS promo_signups_email_key
  ON public.promo_signups (lower(email));

ALTER TABLE public.promo_signups ENABLE ROW LEVEL SECURITY;

-- No public policies: the edge function writes with the service role key, which
-- bypasses RLS. Anon clients must not be able to read the code list.
CREATE POLICY "Admins can manage promo_signups"
  ON public.promo_signups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
