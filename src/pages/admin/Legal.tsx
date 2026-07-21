import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Field, AreaField, SectionCard } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_TERMS,
  DEFAULT_PRIVACY,
  fetchAllSiteContent,
  upsertSiteContent,
  type LegalContent,
} from "@/lib/siteContent";

const AdminLegal = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingTerms, setSavingTerms] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const [terms, setTerms] = useState<LegalContent>(DEFAULT_TERMS);
  const [privacy, setPrivacy] = useState<LegalContent>(DEFAULT_PRIVACY);

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
      if (map[SITE_KEYS.terms]) setTerms({ ...DEFAULT_TERMS, ...map[SITE_KEYS.terms] });
      if (map[SITE_KEYS.privacy]) setPrivacy({ ...DEFAULT_PRIVACY, ...map[SITE_KEYS.privacy] });
      setLoading(false);
    })();
  }, [isAdmin]);

  const saveTerms = async () => {
    setSavingTerms(true);
    try {
      await upsertSiteContent(SITE_KEYS.terms, terms);
      toast.success("Terms saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSavingTerms(false);
    }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      await upsertSiteContent(SITE_KEYS.privacy, privacy);
      toast.success("Privacy Policy saved — changes are live.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Is the site_content migration applied?");
    } finally {
      setSavingPrivacy(false);
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

  return (
    <>
      <AdminTopBar />
      <div className="min-h-screen bg-brand-cream lg:pl-64 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Terms & Privacy
            </h1>
            <p className="text-brand-muted">
              Edit the Terms of Service and Privacy Policy pages linked from the footer. The body
              supports simple Markdown — <code>## Heading</code>, <code>- bullets</code>, <code>**bold**</code>,
              and <code>[links](/contact)</code>.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <>
              <SectionCard
                title="Terms of Service"
                description="Shown at /terms."
                saving={savingTerms}
                onSave={saveTerms}
              >
                <Field label="Page title" value={terms.title} onChange={(v) => setTerms({ ...terms, title: v })} />
                <Field label="Updated line" value={terms.updated} onChange={(v) => setTerms({ ...terms, updated: v })} placeholder="Last updated July 2026" />
                <AreaField label="Body (Markdown)" value={terms.body} onChange={(v) => setTerms({ ...terms, body: v })} rows={16} />
              </SectionCard>

              <SectionCard
                title="Privacy Policy"
                description="Shown at /privacy."
                saving={savingPrivacy}
                onSave={savePrivacy}
              >
                <Field label="Page title" value={privacy.title} onChange={(v) => setPrivacy({ ...privacy, title: v })} />
                <Field label="Updated line" value={privacy.updated} onChange={(v) => setPrivacy({ ...privacy, updated: v })} placeholder="Last updated July 2026" />
                <AreaField label="Body (Markdown)" value={privacy.body} onChange={(v) => setPrivacy({ ...privacy, body: v })} rows={16} />
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminLegal;
