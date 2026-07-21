import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Button } from "@/components/ui/button";
import { Field, AreaField, ImageField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_HOWITWORKS_STEPS,
  fetchAllSiteContent,
  upsertSiteContent,
  type HowItWorksStepsContent,
} from "@/lib/siteContent";

const AdminHowItWorks = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<HowItWorksStepsContent>(DEFAULT_HOWITWORKS_STEPS);

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
      if (map[SITE_KEYS.howItWorksSteps]) setSteps({ ...DEFAULT_HOWITWORKS_STEPS, ...map[SITE_KEYS.howItWorksSteps] });
      setLoading(false);
    })();
  }, [isAdmin]);

  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.howItWorksSteps, steps);
      toast.success("Saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (idx: number, patch: Partial<HowItWorksStepsContent["steps"][number]>) =>
    setSteps((s) => ({ ...s, steps: s.steps.map((st, i) => (i === idx ? { ...st, ...patch } : st)) }));

  const addStep = () =>
    setSteps((s) => ({
      ...s,
      steps: [
        ...s.steps,
        { title: "New Step", description: "", detail: "", duration: "", imageUrl: "" },
      ],
    }));

  const removeStep = (idx: number) =>
    setSteps((s) => ({ ...s, steps: s.steps.filter((_, i) => i !== idx) }));

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

  return (
    <>
      <AdminTopBar />
      <div className="min-h-screen bg-brand-cream lg:pl-64 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              How It Works
            </h1>
            <p className="text-brand-muted">Edit the transformation timeline shown on the How It Works page. Add or remove steps as needed.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <SectionCard title="How It Works — Steps" description="The timeline shown to visitors. Icons follow the step order automatically." saving={saving} onSave={save}>
              {steps.steps.map((step, i) => (
                <div key={i} className="rounded-lg border border-brand-border bg-brand-sand/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-copper">Step {i + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(i)}
                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Title" value={step.title} onChange={(v) => updateStep(i, { title: v })} />
                    <Field label="Duration badge" value={step.duration} onChange={(v) => updateStep(i, { duration: v })} />
                  </div>
                  <AreaField label="Description" value={step.description} onChange={(v) => updateStep(i, { description: v })} />
                  <Field label="Detail (small line under description)" value={step.detail} onChange={(v) => updateStep(i, { detail: v })} />
                  <ImageField label="Image" value={step.imageUrl} onChange={(v) => updateStep(i, { imageUrl: v })} />
                </div>
              ))}

              {steps.steps.length === 0 && (
                <p className="text-sm text-brand-muted text-center py-4">No steps yet. Add one below.</p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addStep}
                className="w-full border-dashed border-brand-border text-brand-espresso hover:bg-brand-sand"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminHowItWorks;
