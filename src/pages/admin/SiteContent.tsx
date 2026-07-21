import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Field, AreaField, ImageField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_HERO,
  DEFAULT_SERVICES,
  DEFAULT_CTA,
  fetchAllSiteContent,
  upsertSiteContent,
  type HeroContent,
  type ServicesContent,
  type CtaContent,
} from "@/lib/siteContent";

const AdminSiteContent = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const [services, setServices] = useState<ServicesContent>(DEFAULT_SERVICES);
  const [cta, setCta] = useState<CtaContent>(DEFAULT_CTA);

  // ---- Auth ----
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setTimeout(() => navigate("/auth"), 0);
      else setTimeout(() => checkAdminRole(session.user.id), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else checkAdminRole(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      if (!data) {
        toast.error("Access denied.");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // ---- Load content ----
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const map = await fetchAllSiteContent();
      if (map[SITE_KEYS.hero]) setHero({ ...DEFAULT_HERO, ...map[SITE_KEYS.hero] });
      if (map[SITE_KEYS.services]) setServices({ ...DEFAULT_SERVICES, ...map[SITE_KEYS.services] });
      if (map[SITE_KEYS.cta]) setCta({ ...DEFAULT_CTA, ...map[SITE_KEYS.cta] });
      setLoading(false);
    })();
  }, [isAdmin]);

  const save = async (key: string, value: any) => {
    setSavingKey(key);
    try {
      await upsertSiteContent(key, value);
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSavingKey(null);
    }
  };

  const updateCard = (idx: number, patch: Partial<ServicesContent["cards"][number]>) =>
    setServices((s) => ({ ...s, cards: s.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }));

  if (checkingAuth || !isAdmin) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar />
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Homepage
            </h1>
            <p className="text-brand-muted">Edit the homepage hero, service cards, and CTA banner. Each section saves independently.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <>
              {/* HERO */}
              <SectionCard title="Homepage — Hero" description="The main banner at the top of the home page." saving={savingKey === SITE_KEYS.hero} onSave={() => save(SITE_KEYS.hero, hero)}>
                <Field label="Eyebrow (small label)" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Heading line 1" value={hero.headingLine1} onChange={(v) => setHero({ ...hero, headingLine1: v })} />
                  <Field label="Heading emphasis" value={hero.headingEmphasis} onChange={(v) => setHero({ ...hero, headingEmphasis: v })} />
                  <Field label="Heading line 3" value={hero.headingLine3} onChange={(v) => setHero({ ...hero, headingLine3: v })} />
                </div>
                <AreaField label="Subheading" value={hero.subheading} onChange={(v) => setHero({ ...hero, subheading: v })} />
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Primary button label" value={hero.primaryLabel} onChange={(v) => setHero({ ...hero, primaryLabel: v })} />
                  {/* <Field label="Primary button link" value={hero.primaryLink} onChange={(v) => setHero({ ...hero, primaryLink: v })} /> */}
                  <Field label="Secondary button label" value={hero.secondaryLabel} onChange={(v) => setHero({ ...hero, secondaryLabel: v })} />
                  {/* <Field label="Secondary button link" value={hero.secondaryLink} onChange={(v) => setHero({ ...hero, secondaryLink: v })} /> */}
                </div>
                <ImageField label="Background image" value={hero.imageUrl} onChange={(v) => setHero({ ...hero, imageUrl: v })} />
              </SectionCard>

              {/* SERVICES */}
              <SectionCard title="Homepage — Services" description="The three service cards (Closets / Kitchens / Garages)." saving={savingKey === SITE_KEYS.services} onSave={() => save(SITE_KEYS.services, services)}>
                <Field label="Eyebrow" value={services.eyebrow} onChange={(v) => setServices({ ...services, eyebrow: v })} />
                <Field label="Heading" value={services.heading} onChange={(v) => setServices({ ...services, heading: v })} />
                {services.cards.map((card, i) => (
                  <div key={i} className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Card {i + 1}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Title" value={card.title} onChange={(v) => updateCard(i, { title: v })} />
                      {/* <Field label="Link" value={card.link} onChange={(v) => updateCard(i, { link: v })} /> */}
                    </div>
                    <AreaField label="Description" value={card.description} onChange={(v) => updateCard(i, { description: v })} />
                    <ImageField label="Image" value={card.imageUrl} onChange={(v) => updateCard(i, { imageUrl: v })} />
                  </div>
                ))}
              </SectionCard>

              {/* CTA */}
              <SectionCard title="Homepage — CTA Banner" description="The 'Ready to design your space' banner near the bottom." saving={savingKey === SITE_KEYS.cta} onSave={() => save(SITE_KEYS.cta, cta)}>
                <Field label="Eyebrow" value={cta.eyebrow} onChange={(v) => setCta({ ...cta, eyebrow: v })} />
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Heading line 1" value={cta.headingLine1} onChange={(v) => setCta({ ...cta, headingLine1: v })} />
                  <Field label="Heading emphasis" value={cta.headingEmphasis} onChange={(v) => setCta({ ...cta, headingEmphasis: v })} />
                  <Field label="Button label" value={cta.buttonLabel} onChange={(v) => setCta({ ...cta, buttonLabel: v })} />
                  <Field label="Button link" value={cta.buttonLink} onChange={(v) => setCta({ ...cta, buttonLink: v })} />
                </div>
                <ImageField label="Background image" value={cta.imageUrl} onChange={(v) => setCta({ ...cta, imageUrl: v })} />
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSiteContent;
