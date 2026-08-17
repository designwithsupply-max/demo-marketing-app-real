import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, AreaField, ImageField } from "@/components/admin/ContentFields";
import {
  SITE_KEYS,
  DEFAULT_PAGE_SEO,
  PAGE_SEO_IDS,
  PAGE_SEO_LABELS,
  fetchAllSiteContent,
  upsertSiteContent,
  type PageSeoMap,
  type PageSeoId,
} from "@/lib/siteContent";

const AdminSeoSettings = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<PageSeoId>("home");
  const [map, setMap] = useState<PageSeoMap>(DEFAULT_PAGE_SEO);

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
      const saved = all[SITE_KEYS.pageSeo] as PageSeoMap | undefined;
      setMap({ ...DEFAULT_PAGE_SEO, ...saved });
      setLoading(false);
    })();
  }, [isAdmin]);

  const entry = { ...DEFAULT_PAGE_SEO[selected], ...map[selected] };

  const updateEntry = (patch: Partial<typeof entry>) =>
    setMap((m) => ({ ...m, [selected]: { ...DEFAULT_PAGE_SEO[selected], ...m[selected], ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      await upsertSiteContent(SITE_KEYS.pageSeo, map);
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
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              SEO Settings
            </h1>
            <p className="text-brand-muted">
              Edit the search-result title, description, and other SEO details for each main page. Leave a field blank to
              keep the current default copy. Service pages have their own SEO fields on the Service Pages screen.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : (
            <Card className="p-6 border-brand-border bg-white space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">Page</Label>
                <Select value={selected} onValueChange={(v) => setSelected(v as PageSeoId)}>
                  <SelectTrigger className="border-brand-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SEO_IDS.map((id) => (
                      <SelectItem key={id} value={id}>{PAGE_SEO_LABELS[id]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Field
                label="SEO title"
                value={entry.title}
                onChange={(v) => updateEntry({ title: v })}
                placeholder="Shown as the blue link text in Google search results"
              />
              <AreaField
                label="SEO meta description"
                value={entry.description}
                onChange={(v) => updateEntry({ description: v })}
                rows={3}
              />
              <Field
                label="H1 override (optional)"
                value={entry.h1 ?? ""}
                onChange={(v) => updateEntry({ h1: v })}
                placeholder="Leave blank to keep the page's current main heading"
              />
              <ImageField
                label="Social share image (Open Graph)"
                value={entry.ogImage ?? ""}
                onChange={(v) => updateEntry({ ogImage: v })}
                folder="seo"
              />
              <div className="flex items-center justify-between rounded-lg border border-brand-border p-3">
                <div>
                  <Label className="text-sm font-medium text-brand-espresso">Hide from search engines</Label>
                  <p className="text-xs text-brand-muted mt-0.5">Adds a "noindex" tag so this page won't appear in Google.</p>
                </div>
                <Switch checked={!!entry.noindex} onCheckedChange={(v) => updateEntry({ noindex: v })} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={save} disabled={saving} className="bg-brand-copper text-white hover:bg-brand-copper-dark">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSeoSettings;
