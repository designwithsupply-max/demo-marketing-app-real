import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Edit2, Star } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Testimonial } from "@/types";

const AdminTestimonials = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    avatar: "",
    rating: 5,
    review: "",
    project: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isAdmin && session) {
      fetchTestimonials();
    }
  }, [isAdmin, session]);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({
      name: "",
      location: "",
      avatar: "",
      rating: 5,
      review: "",
      project: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (t: Testimonial) => {
    setEditingId(t.id);
    setFormData({
      name: t.name,
      location: t.location,
      avatar: t.avatar,
      rating: t.rating,
      review: t.review,
      project: t.project,
      is_active: t.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.avatar.trim() || !formData.review.trim() || !formData.project.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            name: formData.name,
            location: formData.location,
            avatar: formData.avatar,
            rating: formData.rating,
            review: formData.review,
            project: formData.project,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Testimonial updated");
      } else {
        const maxOrder = testimonials.reduce((max, t) => Math.max(max, t.order_index), 0);
        const { error } = await supabase
          .from("testimonials")
          .insert({
            name: formData.name,
            location: formData.location,
            avatar: formData.avatar,
            rating: formData.rating,
            review: formData.review,
            project: formData.project,
            is_active: formData.is_active,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Testimonial added");
      }

      setDialogOpen(false);
      fetchTestimonials();
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial");
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const moveTestimonial = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const current = testimonials[index];
    const target = testimonials[targetIndex];

    try {
      await supabase
        .from("testimonials")
        .update({ order_index: target.order_index, updated_at: new Date().toISOString() })
        .eq("id", current.id);

      await supabase
        .from("testimonials")
        .update({ order_index: current.order_index, updated_at: new Date().toISOString() })
        .eq("id", target.id);

      fetchTestimonials();
    } catch (error) {
      console.error("Error reordering testimonials:", error);
      toast.error("Failed to reorder testimonials");
    }
  };

  if (checkingAuth || !session) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
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
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar onLogout={handleLogout} />
      <div className="min-h-screen bg-brand-cream py-6 sm:py-10 px-4 overflow-x-clip">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Admin</span>
              <h1
                className="text-3xl md:text-4xl text-brand-espresso font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Testimonial Management
              </h1>
              <p className="text-brand-muted">Manage client testimonials and reviews</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-brand-cream border-brand-border">
                <DialogHeader>
                  <DialogTitle className="text-brand-espresso">
                    {editingId ? "Edit Testimonial" : "Add Testimonial"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-espresso" htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-brand-border"
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="border-brand-border"
                      placeholder="Beverly Hills, CA"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="border-brand-border"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    {formData.avatar && (
                      <div className="mt-2 w-14 h-14 rounded-full overflow-hidden border border-brand-border">
                        <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-brand-espresso">Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                        >
                          <Star
                            size={20}
                            className={`${star <= formData.rating ? "fill-brand-copper text-brand-copper" : "text-brand-muted"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="review">Review</Label>
                    <Textarea
                      id="review"
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      className="border-brand-border min-h-[100px]"
                      placeholder="Client review..."
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="project">Project</Label>
                    <Input
                      id="project"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="border-brand-border"
                      placeholder="Luxury Dressing Room"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label className="text-brand-espresso">Active (visible on site)</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" className="border-brand-border" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={handleSubmit}>
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-muted">
            {testimonials.length} testimonials
          </div>

          <div className="space-y-3">
            {testimonials.map((t, index) => (
              <Card
                key={t.id}
                className="p-4 sm:p-5 border-brand-border bg-white shadow-[0_10px_30px_-20px_rgba(45,36,30,0.25)] transition-shadow hover:shadow-[0_16px_38px_-18px_rgba(45,36,30,0.3)]"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 border border-brand-border bg-brand-sand">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info column takes the remaining width; actions live only on
                      the top row so the review and project chip get full width. */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-brand-espresso truncate">{t.name}</h3>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${
                              t.is_active
                                ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                : "text-red-600 border-red-200 bg-red-50"
                            }`}
                          >
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-brand-muted truncate">{t.location}</p>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveTestimonial(index, "up")}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveTestimonial(index, "down")}
                          disabled={index === testimonials.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => openEditDialog(t)}
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" aria-label="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {t.name}'s testimonial. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteTestimonial(t.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="flex gap-0.5 mt-1.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={13} className="fill-brand-copper text-brand-copper" />
                      ))}
                    </div>

                    <p className="text-sm text-brand-espresso mt-2 italic line-clamp-2">"{t.review}"</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                      <span className="inline-block max-w-full truncate rounded-full bg-brand-sand border border-brand-border text-brand-muted text-[10px] font-medium px-2.5 py-1">
                        {t.project}
                      </span>
                      <span className="text-[10px] text-brand-muted shrink-0">Order: {t.order_index}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {testimonials.length === 0 && (
              <Card className="p-12 text-center border-brand-border bg-white">
                <p className="text-brand-muted">No testimonials yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminTestimonials;
