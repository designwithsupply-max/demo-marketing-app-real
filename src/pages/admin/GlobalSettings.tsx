import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Field, AreaField, ImageField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_GLOBAL_SETTINGS,
  fetchAllSiteContent,
  upsertSiteContent,
  type GlobalSettingsContent,
} from "@/lib/siteContent";

const AdminGlobalSettings = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettingsContent>(DEFAULT_GLOBAL_SETTINGS);

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

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const all = await fetchAllSiteContent();
      const saved = all[SITE_KEYS.globalSettings] as GlobalSettingsContent | undefined;
      if (saved) {
        setSettings({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...saved,
          navLabels: { ...DEFAULT_GLOBAL_SETTINGS.navLabels, ...saved.navLabels },
        });
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.globalSettings, settings);
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Global Settings
            </h1>
            <p className="text-brand-muted">Business details, footer, social links, and navigation labels used across the whole site.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <>
              <SectionCard title="Business" saving={saving} onSave={save}>
                <Field label="Business name" value={settings.businessName} onChange={(v) => setSettings({ ...settings, businessName: v })} />
                <ImageField label="Logo (optional — leave blank to keep the built-in logo)" value={settings.logoUrl} onChange={(v) => setSettings({ ...settings, logoUrl: v })} folder="branding" />
                <AreaField label="Footer description" value={settings.footerText} onChange={(v) => setSettings({ ...settings, footerText: v })} rows={2} />
                <Field
                  label="Service areas (comma-separated)"
                  value={settings.serviceAreas.join(", ")}
                  onChange={(v) => setSettings({ ...settings, serviceAreas: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Montréal, Laval, West Island"
                />
              </SectionCard>

              <SectionCard title="Social & integrations" saving={saving} onSave={save}>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Facebook URL" value={settings.facebookUrl} onChange={(v) => setSettings({ ...settings, facebookUrl: v })} placeholder="https://facebook.com/..." />
                  <Field label="Instagram URL" value={settings.instagramUrl} onChange={(v) => setSettings({ ...settings, instagramUrl: v })} placeholder="https://instagram.com/..." />
                  <Field label="Google Business URL" value={settings.googleBusinessUrl} onChange={(v) => setSettings({ ...settings, googleBusinessUrl: v })} placeholder="https://g.page/..." />
                  <Field label="Google Analytics ID" value={settings.googleAnalyticsId} onChange={(v) => setSettings({ ...settings, googleAnalyticsId: v })} placeholder="e.g. G-XXXXXXXXXX — leave blank to disable" />
                </div>
                <AreaField
                  label="Google Search Console notes"
                  value={settings.googleSearchConsoleNotes}
                  onChange={(v) => setSettings({ ...settings, googleSearchConsoleNotes: v })}
                  rows={2}
                />
              </SectionCard>

              <SectionCard title="Navigation labels" description="Change the wording of the main menu items. To add, remove, or reorder menu items, ask a developer." saving={saving} onSave={save}>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Home" value={settings.navLabels.home} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, home: v } })} />
                  <Field label="How It Works" value={settings.navLabels.howItWorks} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, howItWorks: v } })} />
                  <Field label="Services" value={settings.navLabels.services} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, services: v } })} />
                  <Field label="Gallery" value={settings.navLabels.gallery} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, gallery: v } })} />
                  <Field label="Blog" value={settings.navLabels.blog} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, blog: v } })} />
                  <Field label="FAQ" value={settings.navLabels.faq} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, faq: v } })} />
                  <Field label="Contact" value={settings.navLabels.contact} onChange={(v) => setSettings({ ...settings, navLabels: { ...settings.navLabels, contact: v } })} />
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminGlobalSettings;
