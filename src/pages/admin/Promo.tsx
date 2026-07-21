import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Field, AreaField, ImageField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_PROMO,
  fetchAllSiteContent,
  upsertSiteContent,
  type PromoContent,
} from "@/lib/siteContent";

const AdminPromo = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      if (map[SITE_KEYS.promo]) setPromo({ ...DEFAULT_PROMO, ...map[SITE_KEYS.promo] });
      setLoading(false);
    })();
  }, [isAdmin]);

  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.promo, promo);
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSaving(false);
    }
  };

  const setNumber = (field: "delaySeconds" | "autoDismissSeconds", raw: string) => {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    setPromo((p) => ({ ...p, [field]: n }));
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
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Promo Popup
            </h1>
            <p className="text-brand-muted">
              The small promotion that slides in from the bottom-right on customer pages. Edit the copy,
              image, timing, or turn it off entirely.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <SectionCard
              title="Promo Popup"
              description="Shown once per visit on customer-facing pages (never on the admin)."
              saving={saving}
              onSave={save}
            >
              {/* On/off lives on the Settings page so there is only one switch. */}
              <div className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 text-sm">
                <span className="font-medium text-brand-espresso">
                  This popup is currently{" "}
                  <span className={promo.enabled ? "text-emerald-600" : "text-brand-muted"}>
                    {promo.enabled ? "ON" : "OFF"}
                  </span>
                  .
                </span>{" "}
                <Link to="/admin/settings" className="text-brand-copper underline">
                  Turn it on or off in Settings
                </Link>
                .
              </div>

              <Field label="Eyebrow (small label)" value={promo.eyebrow} onChange={(v) => setPromo({ ...promo, eyebrow: v })} />
              <Field label="Title" value={promo.title} onChange={(v) => setPromo({ ...promo, title: v })} />
              <AreaField label="Description" value={promo.description} onChange={(v) => setPromo({ ...promo, description: v })} />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Button label" value={promo.ctaLabel} onChange={(v) => setPromo({ ...promo, ctaLabel: v })} />
                <Field label="Fine print / terms" value={promo.terms} onChange={(v) => setPromo({ ...promo, terms: v })} />
              </div>
              <ImageField label="Image (optional)" value={promo.imageUrl} onChange={(v) => setPromo({ ...promo, imageUrl: v })} folder="promo" />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Appear after (seconds)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={promo.delaySeconds}
                    onChange={(e) => setNumber("delaySeconds", e.target.value)}
                    className="border-brand-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">
                    Auto-dismiss after (seconds)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={promo.autoDismissSeconds}
                    onChange={(e) => setNumber("autoDismissSeconds", e.target.value)}
                    className="border-brand-border"
                  />
                  <p className="text-[11px] text-brand-muted">
                    Set to 0 to keep it open until the visitor closes it. The timer pauses while they're
                    typing their email.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPromo;
