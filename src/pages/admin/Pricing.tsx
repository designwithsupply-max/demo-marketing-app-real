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
import { Loader2, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Copy, Star } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { pricingService, PRICING_CATEGORIES, type PricingTier, type PricingCategory } from "@/lib/pricingService";

const emptyForm = {
  id: "" as string,
  category: "closets" as PricingCategory,
  label: "",
  price: "",
  price_range: "",
  description: "",
  includedText: "",
  factorsText: "",
  image_url: "",
  button_text: "",
  button_link: "",
  notes: "",
  is_active: true,
  is_featured: false,
};

const linesToArray = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

const AdminPricing = () => {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
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

  useEffect(() => { if (isAdmin && session) fetchTiers(); }, [isAdmin, session]);

  const fetchTiers = async () => {
    try { setTiers(await pricingService.fetchAll()); }
    catch (e: any) { toast.error(e?.message || "Failed to load pricing. Has the pricing_tiers migration been applied?"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); toast.success("Logged out"); navigate("/auth"); };

  const categoryLabel = (c: string) => PRICING_CATEGORIES.find((x) => x.value === c)?.label ?? c;

  const openAdd = () => {
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (t: PricingTier) => {
    setForm({
      id: t.id,
      category: t.category,
      label: t.label,
      price: t.price,
      price_range: t.price_range ?? "",
      description: t.description ?? "",
      includedText: (t.included_items ?? []).join("\n"),
      factorsText: (t.price_factors ?? []).join("\n"),
      image_url: t.image_url ?? "",
      button_text: t.button_text ?? "",
      button_link: t.button_link ?? "",
      notes: t.notes ?? "",
      is_active: t.is_active,
      is_featured: t.is_featured,
    });
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    category: form.category,
    label: form.label.trim(),
    price: form.price.trim(),
    price_range: form.price_range.trim() || null,
    description: form.description.trim() || null,
    included_items: linesToArray(form.includedText),
    price_factors: linesToArray(form.factorsText),
    image_url: form.image_url.trim() || null,
    button_text: form.button_text.trim() || null,
    button_link: form.button_link.trim() || null,
    notes: form.notes.trim() || null,
    is_active: form.is_active,
    is_featured: form.is_featured,
  });

  const save = async () => {
    if (!form.label.trim()) return toast.error("Package name is required");
    if (!form.price.trim()) return toast.error("Starting price is required");
    setSaving(true);
    try {
      const payload = buildPayload();
      if (form.id) {
        await pricingService.update(form.id, payload);
        toast.success("Pricing card updated");
      } else {
        await pricingService.create({ ...payload, order_index: tiers.length });
        toast.success("Pricing card created");
      }
      setDialogOpen(false);
      await fetchTiers();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const duplicate = async (t: PricingTier) => {
    try {
      await pricingService.create({
        category: t.category,
        label: `${t.label} (copy)`,
        price: t.price,
        price_range: t.price_range,
        description: t.description,
        included_items: t.included_items,
        price_factors: t.price_factors,
        image_url: t.image_url,
        button_text: t.button_text,
        button_link: t.button_link,
        notes: t.notes,
        is_active: false,
        is_featured: false,
        order_index: tiers.length,
      });
      toast.success("Duplicated — the copy is inactive until you review it.");
      await fetchTiers();
    } catch (e: any) {
      toast.error(e?.message || "Duplicate failed");
    }
  };

  const toggleField = async (t: PricingTier, field: "is_active" | "is_featured") => {
    try {
      await pricingService.update(t.id, { [field]: !t[field] } as Partial<PricingTier>);
      await fetchTiers();
    } catch { toast.error("Could not update"); }
  };

  const remove = async (t: PricingTier) => {
    try { await pricingService.remove(t.id); toast.success("Deleted"); setTiers((prev) => prev.filter((x) => x.id !== t.id)); }
    catch { toast.error("Delete failed"); }
  };

  const move = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tiers.length) return;
    const current = tiers[index];
    const target = tiers[targetIndex];
    try {
      await pricingService.reorder(current.id, target.order_index);
      await pricingService.reorder(target.id, current.order_index);
      await fetchTiers();
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
              <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Pricing</h1>
              <p className="text-brand-muted">Pricing cards shown on the How It Works page, grouped by product type. Add, edit, reorder, or hide any of them without a code change.</p>
            </div>
            <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> New Pricing Card
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : tiers.length === 0 ? (
            <Card className="p-12 text-center border-brand-border bg-white"><p className="text-brand-muted">No pricing cards yet. Create your first one, or apply the pricing_tiers migration to seed the defaults.</p></Card>
          ) : (
            <div className="space-y-3">
              {tiers.map((t, index) => (
                <Card key={t.id} className="p-4 border-brand-border bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-md bg-brand-sand flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {t.image_url && <img src={t.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-brand-espresso truncate">{t.label}</h3>
                        <Badge variant="outline" className="bg-brand-sand border-brand-border text-brand-muted text-[10px]">{categoryLabel(t.category)}</Badge>
                        {t.is_featured && <Badge className="bg-brand-copper/15 text-brand-copper border-brand-copper/30 text-[10px]"><Star className="w-2.5 h-2.5 mr-1" />Featured</Badge>}
                        {!t.is_active && <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">{t.price}{t.price_range ? ` · ${t.price_range}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => move(index, "up")} disabled={index === 0}>
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => move(index, "down")} disabled={index === tiers.length - 1}>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => duplicate(t)} title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => openEdit(t)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete pricing card</AlertDialogTitle>
                            <AlertDialogDescription>This permanently deletes "{t.label}". This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(t)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-brand-border">
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_active} onCheckedChange={() => toggleField(t, "is_active")} />
                      <Label className="text-xs text-brand-muted">Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_featured} onCheckedChange={() => toggleField(t, "is_featured")} />
                      <Label className="text-xs text-brand-muted">Featured / recommended</Label>
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
          <DialogHeader><DialogTitle className="text-brand-espresso">{form.id ? "Edit Pricing Card" : "New Pricing Card"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">Product category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as PricingCategory }))}>
                  <SelectTrigger className="border-brand-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICING_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Package name" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="e.g. Walk-in Closet — Essentials" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Starting price" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} placeholder="e.g. $4,500+" />
              <Field label="Price range (optional)" value={form.price_range} onChange={(v) => setForm((f) => ({ ...f, price_range: v }))} placeholder="e.g. $4,500 – $9,000" />
            </div>

            <AreaField label="Short description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} rows={2} />

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">What's included (one per line)</Label>
              <textarea
                value={form.includedText}
                onChange={(e) => setForm((f) => ({ ...f, includedText: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm"
                placeholder={"Custom shelving & hanging\nSoft-close drawers\nDesign consultation\nLocal installation"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">What affects the price (one per line)</Label>
              <textarea
                value={form.factorsText}
                onChange={(e) => setForm((f) => ({ ...f, factorsText: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm"
                placeholder={"Total linear footage\nFinish & hardware selection\nInstallation vs. pickup"}
              />
            </div>

            <ImageField label="Image / icon (optional)" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} folder="pricing" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Button text (optional)" value={form.button_text} onChange={(v) => setForm((f) => ({ ...f, button_text: v }))} placeholder="e.g. Get a Free Quote" />
              <Field label="Button link (optional)" value={form.button_link} onChange={(v) => setForm((f) => ({ ...f, button_link: v }))} placeholder="/space-planner" />
            </div>

            <AreaField label="Notes / disclaimer (optional)" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} rows={2} />

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label className="text-brand-espresso">Active (visible on site)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} />
                <Label className="text-brand-espresso">Featured / recommended</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-brand-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{form.id ? "Save changes" : "Create card"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPricing;
