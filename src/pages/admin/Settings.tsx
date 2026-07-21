import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_FEATURES,
  DEFAULT_PROMO,
  fetchAllSiteContent,
  upsertSiteContent,
  type FeaturesContent,
  type PromoContent,
} from "@/lib/siteContent";

/**
 * Master switches for optional site behaviour.
 *
 * The promo toggle writes to the SAME `promo_popup.enabled` flag the /admin/promo
 * page edits — there is only ever one source of truth for whether the card shows.
 */
const AdminSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [features, setFeatures] = useState<FeaturesContent>(DEFAULT_FEATURES);
  const [promo, setPromo] = useState<PromoContent>(DEFAULT_PROMO);

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
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      const ok = roles.includes("admin") || roles.includes("super_admin");
      setIsAdmin(ok);
      if (!ok) {
        toast.error("Access denied.");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // ---- Load ----
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const map = await fetchAllSiteContent();
      if (map[SITE_KEYS.features]) setFeatures({ ...DEFAULT_FEATURES, ...map[SITE_KEYS.features] });
      if (map[SITE_KEYS.promo]) setPromo({ ...DEFAULT_PROMO, ...map[SITE_KEYS.promo] });
      setLoading(false);
    })();
  }, [isAdmin]);

  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.features, features);
      // Keep the popup's own `enabled` flag in step with the switch above it, so
      // the Promo page and this page never disagree.
      await upsertSiteContent(SITE_KEYS.promo, { ...promo, enabled: features.promoPopup });
      // Customer pages cache site_content for 5 minutes — drop it so the change
      // is visible immediately in this browser.
      queryClient.invalidateQueries({ queryKey: ["site_content"] });
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSaving(false);
    }
  };

  if (checkingAuth || !isAdmin) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  const Toggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: React.ReactNode;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-start justify-between gap-6 rounded-lg border border-brand-border bg-brand-sand/30 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-espresso">
          {label}{" "}
          <span className={checked ? "text-emerald-600" : "text-brand-muted"}>
            ({checked ? "ON" : "OFF"})
          </span>
        </p>
        <p className="text-xs text-brand-muted mt-1 leading-relaxed">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1 shrink-0" />
    </div>
  );

  return (
    <>
      <AdminTopBar />
      <div className="min-h-screen bg-brand-cream lg:pl-64 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1
              className="text-3xl md:text-4xl text-brand-espresso font-light"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Settings
            </h1>
            <p className="text-brand-muted">Turn optional site features on or off.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
            </div>
          ) : (
            <SectionCard
              title="Features"
              description="Applies to every visitor, immediately after saving."
              saving={saving}
              onSave={save}
            >
              <Toggle
                label="Email verification in the Space Planner"
                description="When ON, visitors must confirm their email with a magic link before reaching Step 2. When OFF, they continue straight through — you'll still collect their email, it just won't be verified."
                checked={features.emailVerification}
                onChange={(v) => setFeatures({ ...features, emailVerification: v })}
              />
              <Toggle
                label="Promo popup"
                description={
                  <>
                    The card that slides in from the bottom-right on customer pages. Edit its copy,
                    image and timing on the <Link to="/admin/promo" className="text-brand-copper underline">Promo page</Link>.
                  </>
                }
                checked={features.promoPopup}
                onChange={(v) => setFeatures({ ...features, promoPopup: v })}
              />
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
