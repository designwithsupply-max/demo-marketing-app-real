import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Field, AreaField, ImageField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_ABOUT,
  fetchAllSiteContent,
  upsertSiteContent,
  type AboutContent,
} from "@/lib/siteContent";

const AdminAboutUs = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT);

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
      if (map[SITE_KEYS.about]) setAbout({ ...DEFAULT_ABOUT, ...map[SITE_KEYS.about] });
      setLoading(false);
    })();
  }, [isAdmin]);

  // Every section shares one row (SITE_KEYS.about), so each Save persists the
  // whole `about` object.
  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.about, about);
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<AboutContent>) => setAbout((a) => ({ ...a, ...patch }));
  const updateTimeline = (i: number, patch: Partial<AboutContent["timeline"][number]>) =>
    setAbout((a) => ({ ...a, timeline: a.timeline.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
  const updateStat = (i: number, patch: Partial<AboutContent["stats"][number]>) =>
    setAbout((a) => ({ ...a, stats: a.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const updateParagraph = (i: number, value: string) =>
    setAbout((a) => ({ ...a, storyParagraphs: a.storyParagraphs.map((p, idx) => (idx === i ? value : p)) }));
  const updateValue = (i: number, patch: Partial<AboutContent["values"][number]>) =>
    setAbout((a) => ({ ...a, values: a.values.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));

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
              About Us
            </h1>
            <p className="text-brand-muted">Edit the About Us page. Each section saves the full page, so your latest edits across all sections are kept.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <>
              {/* HERO */}
              <SectionCard title="About — Hero" description="The dark banner at the top of the page." saving={saving} onSave={save}>
                <Field label="Eyebrow (small label)" value={about.heroEyebrow} onChange={(v) => set({ heroEyebrow: v })} />
                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Heading line 1" value={about.heroHeadingLine1} onChange={(v) => set({ heroHeadingLine1: v })} />
                  <Field label="Heading emphasis (gold)" value={about.heroHeadingEmphasis} onChange={(v) => set({ heroHeadingEmphasis: v })} />
                  <Field label="Heading line 3" value={about.heroHeadingLine3} onChange={(v) => set({ heroHeadingLine3: v })} />
                </div>
                <AreaField label="Intro paragraph" value={about.heroIntro} onChange={(v) => set({ heroIntro: v })} />
                <ImageField label="Hero image" value={about.heroImageUrl} onChange={(v) => set({ heroImageUrl: v })} />
              </SectionCard>

              {/* STORY */}
              <SectionCard title="About — Our Story" description="The timeline, story paragraphs, and stat row." saving={saving} onSave={save}>
                <Field label="Timeline eyebrow" value={about.storyEyebrow} onChange={(v) => set({ storyEyebrow: v })} />
                {about.timeline.map((item, i) => (
                  <div key={i} className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Timeline entry {i + 1}</p>
                    <div className="grid md:grid-cols-[120px_1fr] gap-4">
                      <Field label="Year" value={item.year} onChange={(v) => updateTimeline(i, { year: v })} />
                      <Field label="Text" value={item.text} onChange={(v) => updateTimeline(i, { text: v })} />
                    </div>
                  </div>
                ))}
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Story heading line 1" value={about.storyHeadingLine1} onChange={(v) => set({ storyHeadingLine1: v })} />
                  <Field label="Story heading line 2" value={about.storyHeadingLine2} onChange={(v) => set({ storyHeadingLine2: v })} />
                </div>
                {about.storyParagraphs.map((para, i) => (
                  <AreaField key={i} label={`Story paragraph ${i + 1}`} value={para} onChange={(v) => updateParagraph(i, v)} />
                ))}
                {about.stats.map((stat, i) => (
                  <div key={i} className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Stat {i + 1}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Value" value={stat.value} onChange={(v) => updateStat(i, { value: v })} />
                      <Field label="Label" value={stat.label} onChange={(v) => updateStat(i, { label: v })} />
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* MISSION & VISION */}
              <SectionCard title="About — Mission & Vision" description="The two-panel mission and vision statements." saving={saving} onSave={save}>
                <Field label="Mission eyebrow" value={about.missionEyebrow} onChange={(v) => set({ missionEyebrow: v })} />
                <AreaField label="Mission statement" value={about.missionText} onChange={(v) => set({ missionText: v })} />
                <Field label="Vision eyebrow" value={about.visionEyebrow} onChange={(v) => set({ visionEyebrow: v })} />
                <AreaField label="Vision statement" value={about.visionText} onChange={(v) => set({ visionText: v })} />
              </SectionCard>

              {/* VALUES */}
              <SectionCard title="About — Core Values" description="The four value cards. (Icons stay fixed.)" saving={saving} onSave={save}>
                <Field label="Eyebrow" value={about.valuesEyebrow} onChange={(v) => set({ valuesEyebrow: v })} />
                <Field label="Heading" value={about.valuesHeading} onChange={(v) => set({ valuesHeading: v })} />
                {about.values.map((value, i) => (
                  <div key={i} className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Value {i + 1}</p>
                    <Field label="Title" value={value.title} onChange={(v) => updateValue(i, { title: v })} />
                    <AreaField label="Description" value={value.description} onChange={(v) => updateValue(i, { description: v })} />
                  </div>
                ))}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAboutUs;
