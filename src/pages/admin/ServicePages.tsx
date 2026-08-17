import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Field, AreaField, ImageField } from "@/components/admin/ContentFields";
import { Loader2, Plus, Trash2, Edit2, ChevronUp, ChevronDown, ExternalLink, Copy } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { servicePagesService, slugifyServicePage, type ServicePage, type ServiceCategory } from "@/lib/servicePagesService";

const emptyForm = {
  id: "" as string,
  slug: "",
  nav_label: "",
  category: "closet" as ServiceCategory,
  hero_eyebrow: "",
  hero_heading: "",
  hero_description: "",
  hero_image_url: "",
  additionalImagesText: "",
  video_url: "",
  primary_button_label: "Start Free Design",
  primary_button_link: "/space-planner",
  stepsText: "",
  featuresText: "",
  pricing_note: "",
  delivery_note: "",
  seo_title: "",
  seo_description: "",
  is_active: true,
  show_in_nav: true,
};

const linesToArray = (text: string) =>
  text.split("\n").map((l) => l.trim()).filter(Boolean);

const AdminServicePages = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<ServicePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setTimeout(() => navigate("/auth"), 0);
      else setTimeout(() => checkAdminRole(s.user.id), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/auth");
      else checkAdminRole(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
      if (error && error.code !== "PGRST116") { setIsAdmin(false); return; }
      setIsAdmin(!!data);
      if (!data) { toast.error("Access denied. Admin privileges required."); setTimeout(() => navigate("/"), 1000); }
    } catch { setIsAdmin(false); } finally { setCheckingAuth(false); }
  };

  useEffect(() => { if (isAdmin && session) fetchPages(); }, [isAdmin, session]);

  const fetchPages = async () => {
    try { setPages(await servicePagesService.fetchAll()); }
    catch (e: any) { toast.error(e?.message || "Failed to load service pages. Has the migration been applied?"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); toast.success("Logged out"); navigate("/auth"); };

  const openAdd = () => {
    setForm({ ...emptyForm, display_order: pages.length } as any);
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (p: ServicePage) => {
    setForm({
      id: p.id,
      slug: p.slug,
      nav_label: p.nav_label,
      category: p.category,
      hero_eyebrow: p.hero_eyebrow,
      hero_heading: p.hero_heading,
      hero_description: p.hero_description,
      hero_image_url: p.hero_image_url,
      additionalImagesText: (p.additional_image_urls ?? []).join("\n"),
      video_url: p.video_url ?? "",
      primary_button_label: p.primary_button_label,
      primary_button_link: p.primary_button_link,
      stepsText: (p.steps ?? []).join("\n"),
      featuresText: (p.features ?? []).join("\n"),
      pricing_note: p.pricing_note,
      delivery_note: p.delivery_note,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      is_active: p.is_active,
      show_in_nav: p.show_in_nav,
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const onNavLabel = (v: string) =>
    setForm((f) => ({ ...f, nav_label: v, slug: slugTouched ? f.slug : slugifyServicePage(v) }));

  const save = async () => {
    if (!form.nav_label.trim()) return toast.error("Nav label is required");
    if (!form.slug.trim()) return toast.error("Slug is required");
    if (!form.hero_heading.trim()) return toast.error("Hero heading is required");
    setSaving(true);
    try {
      const payload = {
        slug: slugifyServicePage(form.slug),
        nav_label: form.nav_label.trim(),
        category: form.category,
        hero_eyebrow: form.hero_eyebrow.trim(),
        hero_heading: form.hero_heading.trim(),
        hero_description: form.hero_description.trim(),
        hero_image_url: form.hero_image_url,
        additional_image_urls: linesToArray(form.additionalImagesText),
        video_url: form.video_url.trim() || null,
        primary_button_label: form.primary_button_label.trim() || "Start Free Design",
        primary_button_link: form.primary_button_link.trim() || "/space-planner",
        steps: linesToArray(form.stepsText),
        features: linesToArray(form.featuresText),
        pricing_note: form.pricing_note.trim(),
        delivery_note: form.delivery_note.trim(),
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
        is_active: form.is_active,
        show_in_nav: form.show_in_nav,
      };
      if (form.id) {
        await servicePagesService.update(form.id, payload);
        toast.success("Service page updated");
      } else {
        await servicePagesService.create({ ...payload, display_order: pages.length });
        toast.success("Service page created");
      }
      setDialogOpen(false);
      await fetchPages();
    } catch (e: any) {
      if (String(e?.message || "").includes("duplicate") || e?.code === "23505")
        toast.error("That URL slug is already used — choose a different one.");
      else toast.error(e?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const toggleField = async (p: ServicePage, field: "is_active" | "show_in_nav") => {
    try {
      await servicePagesService.update(p.id, { [field]: !p[field] } as Partial<ServicePage>);
      await fetchPages();
    } catch { toast.error("Could not update"); }
  };

  const duplicate = async (p: ServicePage) => {
    try {
      await servicePagesService.create({
        slug: slugifyServicePage(`${p.slug}-copy`),
        nav_label: `${p.nav_label} (copy)`,
        category: p.category,
        hero_eyebrow: p.hero_eyebrow,
        hero_heading: p.hero_heading,
        hero_description: p.hero_description,
        hero_image_url: p.hero_image_url,
        additional_image_urls: p.additional_image_urls,
        video_url: p.video_url,
        primary_button_label: p.primary_button_label,
        primary_button_link: p.primary_button_link,
        steps: p.steps,
        features: p.features,
        pricing_note: p.pricing_note,
        delivery_note: p.delivery_note,
        seo_title: p.seo_title,
        seo_description: p.seo_description,
        is_active: false,
        show_in_nav: false,
        display_order: pages.length,
      });
      toast.success("Duplicated — the copy is inactive and hidden from nav until you review it.");
      await fetchPages();
    } catch (e: any) {
      if (String(e?.message || "").includes("duplicate") || e?.code === "23505")
        toast.error("A page with that slug already exists — edit the original's slug first, then try again.");
      else toast.error(e?.message || "Duplicate failed");
    }
  };

  const remove = async (p: ServicePage) => {
    try { await servicePagesService.remove(p.id); toast.success("Deleted"); setPages((prev) => prev.filter((x) => x.id !== p.id)); }
    catch { toast.error("Delete failed"); }
  };

  const move = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const current = pages[index];
    const target = pages[targetIndex];
    try {
      await servicePagesService.reorder(current.id, target.display_order);
      await servicePagesService.reorder(target.id, current.display_order);
      await fetchPages();
    } catch { toast.error("Failed to reorder"); }
  };

  if (checkingAuth || !session) {
    return <><AdminTopBar /><div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-copper" /></div></>;
  }
  if (!isAdmin) {
    return <><AdminTopBar /><div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center px-6"><Card className="p-8 text-center border-brand-border"><h2 className="text-2xl font-semibold text-brand-espresso mb-2">Access Denied</h2><p className="text-brand-muted">You don't have admin privileges.</p></Card></div></>;
  }

  return (
    <>
      <AdminTopBar onLogout={handleLogout} />
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Admin</span>
              <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Service Pages</h1>
              <p className="text-brand-muted">Every page linked from the Services dropdown — Custom Closets, Walk-In Closets, Garage Cabinets, and so on. Add, edit, reorder, or hide any of them without a code change.</p>
            </div>
            <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> New Service Page
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : pages.length === 0 ? (
            <Card className="p-12 text-center border-brand-border bg-white"><p className="text-brand-muted">No service pages yet. Create your first one, or apply the service_pages migration to seed the defaults.</p></Card>
          ) : (
            <div className="space-y-3">
              {pages.map((p, index) => (
                <Card key={p.id} className="p-4 border-brand-border bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-md bg-brand-sand flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.hero_image_url && <img src={p.hero_image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-brand-espresso truncate">{p.nav_label}</h3>
                        <Badge variant="outline" className="bg-brand-sand border-brand-border text-brand-muted text-[10px] capitalize">{p.category}</Badge>
                        {!p.is_active && <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">Inactive</Badge>}
                        {!p.show_in_nav && <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">Hidden from nav</Badge>}
                      </div>
                      <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-muted hover:text-brand-copper inline-flex items-center gap-1 mt-0.5">
                        /{p.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => move(index, "up")} disabled={index === 0}>
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => move(index, "down")} disabled={index === pages.length - 1}>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => openEdit(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => duplicate(p)} title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete service page</AlertDialogTitle>
                            <AlertDialogDescription>This permanently deletes “{p.nav_label}” (/{p.slug}). Any nav or footer link pointing to it will redirect visitors to the gallery instead of 404ing, but the page itself is gone. This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(p)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-brand-border">
                    <div className="flex items-center gap-2">
                      <Switch checked={p.is_active} onCheckedChange={() => toggleField(p, "is_active")} />
                      <Label className="text-xs text-brand-muted">Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.show_in_nav} onCheckedChange={() => toggleField(p, "show_in_nav")} />
                      <Label className="text-xs text-brand-muted">Show in Services nav</Label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-brand-cream border-brand-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-brand-espresso">{form.id ? "Edit Service Page" : "New Service Page"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nav label (e.g. Walk-In Closets)" value={form.nav_label} onChange={onNavLabel} placeholder="Walk-In Closets" />
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">Category (which gallery projects show)</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ServiceCategory }))}>
                  <SelectTrigger className="border-brand-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closet">Closet</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="garage">Garage Cabinets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">URL slug</Label>
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                className="mt-1.5 w-full h-9 rounded-md border border-brand-border bg-white px-3 text-sm"
                placeholder="walk-in-closets"
              />
              <p className="text-[11px] text-brand-muted mt-1">Lives at /{slugifyServicePage(form.slug || "your-page")}</p>
            </div>

            <Field label="Hero eyebrow (small label above the headline)" value={form.hero_eyebrow} onChange={(v) => setForm((f) => ({ ...f, hero_eyebrow: v }))} placeholder="Walk-In Closets" />
            <Field label="Hero heading (H1)" value={form.hero_heading} onChange={(v) => setForm((f) => ({ ...f, hero_heading: v }))} placeholder="Walk-In Closets in Greater Montréal, Designed Live Online" />
            <AreaField label="Hero description" value={form.hero_description} onChange={(v) => setForm((f) => ({ ...f, hero_description: v }))} rows={3} />
            <ImageField label="Hero image" value={form.hero_image_url} onChange={(v) => setForm((f) => ({ ...f, hero_image_url: v }))} folder="service-pages" />

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">Additional photo URLs (one per line, optional)</Label>
              <textarea
                value={form.additionalImagesText}
                onChange={(e) => setForm((f) => ({ ...f, additionalImagesText: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm"
                placeholder={"https://…/photo-2.jpg\nhttps://…/photo-3.jpg"}
              />
              <p className="text-[11px] text-brand-muted">Shown as a photo strip below the hero. Upload images via the Gallery / File Manager first, then paste their URLs here.</p>
            </div>
            <Field label="Video URL (optional)" value={form.video_url} onChange={(v) => setForm((f) => ({ ...f, video_url: v }))} placeholder="A video file URL from the Gallery video manager" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary button label" value={form.primary_button_label} onChange={(v) => setForm((f) => ({ ...f, primary_button_label: v }))} placeholder="Start Free Design" />
              <Field label="Primary button link" value={form.primary_button_link} onChange={(v) => setForm((f) => ({ ...f, primary_button_link: v }))} placeholder="/space-planner" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">"How it works" steps (one per line)</Label>
              <textarea
                value={form.stepsText}
                onChange={(e) => setForm((f) => ({ ...f, stepsText: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm"
                placeholder={"Measure your space with our 3-Step Space Planner\nMeet live with a designer online\nReview your custom CAD design together\nGet a same-day quote and choose pickup, delivery or installation"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">"What you get" features (one per line)</Label>
              <textarea
                value={form.featuresText}
                onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm"
                placeholder={"Soft-close drawers and doors\nAdjustable shelves and hanging rods\nFinish options that match your style\nFully assembled cabinet supply"}
              />
            </div>

            <AreaField label="Pricing note" value={form.pricing_note} onChange={(v) => setForm((f) => ({ ...f, pricing_note: v }))} rows={2} />
            <AreaField label="Delivery & installation note" value={form.delivery_note} onChange={(v) => setForm((f) => ({ ...f, delivery_note: v }))} rows={2} />

            <Field label="SEO title" value={form.seo_title} onChange={(v) => setForm((f) => ({ ...f, seo_title: v }))} placeholder="Falls back to the hero heading if left blank" />
            <AreaField label="SEO meta description" value={form.seo_description} onChange={(v) => setForm((f) => ({ ...f, seo_description: v }))} rows={2} />

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label className="text-brand-espresso">Active (visible on site)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_nav} onCheckedChange={(v) => setForm((f) => ({ ...f, show_in_nav: v }))} />
                <Label className="text-brand-espresso">Show in Services nav</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-brand-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{form.id ? "Save changes" : "Create page"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminServicePages;
