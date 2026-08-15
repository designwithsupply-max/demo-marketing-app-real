CREATE TABLE IF NOT EXISTS public.contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  business_hours TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contact_info"
  ON public.contact_info FOR SELECT USING (true);

CREATE POLICY "Admins can manage contact_info"
  ON public.contact_info FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_contact_info_updated_at
  BEFORE UPDATE ON public.contact_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.contact_info (email, phone, address_line1, address_line2, business_hours)
SELECT 'hello@designandsupply.com', '+1 (800) 555-0192', '', 'Serving Greater Montréal, QC', 'Mon–Fri: 9:00 AM to 6:00 PM'
WHERE NOT EXISTS (SELECT 1 FROM public.contact_info);
