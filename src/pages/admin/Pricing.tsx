import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Edit2, X, Check } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { PricingTier } from "@/types";

const AdminPricing = () => {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ price: string; label: string }>({ price: "", label: "" });
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ price: "", label: "", is_active: true });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          setTimeout(() => navigate("/auth"), 0);
        } else {
          setTimeout(() => checkAdminRole(session.user.id), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (error && error.code !== "PGRST116") {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isAdmin && session) {
      fetchTiers();
    }
  }, [isAdmin, session]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_tiers")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch {
      toast.error("Failed to load pricing tiers");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  const startEdit = (tier: PricingTier) => {
    setEditingId(tier.id);
    setEditData({ price: tier.price, label: tier.label });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ price: "", label: "" });
  };

  const saveEdit = async (id: string) => {
    if (!editData.price.trim() || !editData.label.trim()) {
      toast.error("Price and label are required");
      return;
    }
    try {
      const { error } = await supabase
        .from("pricing_tiers")
        .update({
          price: editData.price,
          label: editData.label,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Pricing tier updated");
      cancelEdit();
      fetchTiers();
    } catch {
      toast.error("Failed to update pricing tier");
    }
  };

  const addTier = async () => {
    if (!addFormData.price.trim() || !addFormData.label.trim()) {
      toast.error("Price and label are required");
      return;
    }

    const nextIndex = Math.max(0, ...tiers.map((t) => t.order_index)) + 1;

    try {
      const { error } = await supabase
        .from("pricing_tiers")
        .insert({
          price: addFormData.price,
          label: addFormData.label,
          order_index: nextIndex,
          is_active: addFormData.is_active,
        });

      if (error) throw error;
      toast.success("Pricing tier added");
      setAddDialogOpen(false);
      setAddFormData({ price: "", label: "", is_active: true });
      fetchTiers();
    } catch {
      toast.error("Failed to add pricing tier");
    }
  };

  const openAddDialog = () => {
    setAddFormData({ price: "", label: "", is_active: true });
    setAddDialogOpen(true);
  };

  const deleteTier = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pricing_tiers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Pricing tier deleted");
      fetchTiers();
    } catch {
      toast.error("Failed to delete pricing tier");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("pricing_tiers")
        .update({ is_active: !current, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      fetchTiers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const moveTier = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tiers.length) return;

    const current = tiers[index];
    const target = tiers[targetIndex];

    try {
      await supabase
        .from("pricing_tiers")
        .update({ order_index: target.order_index, updated_at: new Date().toISOString() })
        .eq("id", current.id);

      await supabase
        .from("pricing_tiers")
        .update({ order_index: current.order_index, updated_at: new Date().toISOString() })
        .eq("id", target.id);

      fetchTiers();
    } catch {
      toast.error("Failed to reorder");
    }
  };

  if (checkingAuth || !session) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-64 flex items-center justify-center px-6">
          <Card className="p-8 text-center border-brand-border">
            <h2 className="text-2xl font-semibold text-brand-espresso mb-2">Access Denied</h2>
            <p className="text-brand-muted">You don't have admin privileges.</p>
          </Card>
        </div>
      </>
    );
  }

  if (loading) {
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
      <AdminTopBar onLogout={handleLogout} />
      <div className="min-h-screen bg-brand-cream lg:pl-64 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Admin</span>
              <h1
                className="text-3xl md:text-4xl text-brand-espresso font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Pricing Management
              </h1>
              <p className="text-brand-muted">Manage pricing tiers shown on the How It Works page</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-brand-cream border-brand-border">
                <DialogHeader>
                  <DialogTitle className="text-brand-espresso">Add Pricing Tier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-espresso" htmlFor="add-price">Price</Label>
                    <Input
                      id="add-price"
                      value={addFormData.price}
                      onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                      className="border-brand-border"
                      placeholder='e.g. $2,500+'
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="add-label">Label</Label>
                    <Input
                      id="add-label"
                      value={addFormData.label}
                      onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })}
                      className="border-brand-border"
                      placeholder="e.g. Sliding Wardrobes"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={addFormData.is_active}
                      onCheckedChange={(checked) => setAddFormData({ ...addFormData, is_active: checked })}
                    />
                    <Label className="text-brand-espresso">Active (visible on site)</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" className="border-brand-border" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={addTier}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-muted">{tiers.length} tier(s)</span>
          </div>

          <div className="space-y-3">
            {tiers.map((tier, index) => (
              <Card key={tier.id} className="p-5 border-brand-border bg-white">
                {editingId === tier.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                      className="border-brand-border"
                      placeholder="Price"
                    />
                    <Input
                      value={editData.label}
                      onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                      className="border-brand-border"
                      placeholder="Label"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-brand-copper hover:bg-brand-copper-dark text-white"
                        onClick={() => saveEdit(tier.id)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="border-brand-border" onClick={cancelEdit}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-brand-espresso">{tier.price}</h3>
                          {!tier.is_active && (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-brand-muted">{tier.label}</p>
                        <span className="text-[10px] text-brand-muted mt-1">Order: {tier.order_index}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveTier(index, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveTier(index, "down")}
                          disabled={index === tiers.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => toggleActive(tier.id, tier.is_active)}
                          title={tier.is_active ? "Set inactive" : "Set active"}
                        >
                          <Switch checked={tier.is_active} className="scale-75" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => startEdit(tier)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Pricing Tier</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{tier.price} — {tier.label}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteTier(tier.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {tiers.length === 0 && (
              <Card className="p-12 text-center border-brand-border bg-white">
                <p className="text-brand-muted">No pricing tiers yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPricing;
