import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { FAQ } from "@/types";

const AdminFaqs = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ question: string; answer: string; category: string }>({ question: "", answer: "", category: "" });
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ question: "", answer: "", category: "", is_active: true });

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
      fetchFaqs();
    }
  }, [isAdmin, session]);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditData({ question: faq.question, answer: faq.answer, category: faq.category });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ question: "", answer: "", category: "" });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .update({
          question: editData.question,
          answer: editData.answer,
          category: editData.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("FAQ updated");
      cancelEdit();
      fetchFaqs();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    }
  };

  const addFaq = async () => {
    if (!addFormData.question.trim() || !addFormData.answer.trim() || !addFormData.category.trim()) {
      toast.error("All fields are required");
      return;
    }

    const nextIndex = Math.max(0, ...faqs.map((f) => f.order_index)) + 1;

    try {
      const { error } = await supabase
        .from("faqs")
        .insert({
          question: addFormData.question,
          answer: addFormData.answer,
          category: addFormData.category,
          order_index: nextIndex,
          is_active: addFormData.is_active,
        });

      if (error) throw error;
      toast.success("FAQ added");
      setAddDialogOpen(false);
      setAddFormData({ question: "", answer: "", category: "", is_active: true });
      fetchFaqs();
    } catch (error) {
      console.error("Error adding FAQ:", error);
      toast.error("Failed to add FAQ");
    }
  };

  const openAddDialog = () => {
    setAddFormData({ question: "", answer: "", category: "", is_active: true });
    setAddDialogOpen(true);
  };

  const deleteFaq = async (id: string) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("FAQ deleted");
      fetchFaqs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  const moveFaq = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const currentFaq = faqs[index];
    const targetFaq = faqs[targetIndex];

    try {
      await supabase
        .from("faqs")
        .update({ order_index: targetFaq.order_index, updated_at: new Date().toISOString() })
        .eq("id", currentFaq.id);

      await supabase
        .from("faqs")
        .update({ order_index: currentFaq.order_index, updated_at: new Date().toISOString() })
        .eq("id", targetFaq.id);

      fetchFaqs();
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      toast.error("Failed to reorder FAQs");
    }
  };

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  const filteredFaqs = categoryFilter === "all" ? faqs : faqs.filter((f) => f.category === categoryFilter);

  if (checkingAuth || !session) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminTopBar />
        <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center px-6">
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
        <div className="min-h-screen bg-brand-cream lg:pl-72 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar onLogout={handleLogout} />
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Admin</span>
              <h1
                className="text-3xl md:text-4xl text-brand-espresso font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                FAQ Management
              </h1>
              <p className="text-brand-muted">Create, edit, reorder, and manage FAQ content</p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-brand-cream border-brand-border">
                <DialogHeader>
                  <DialogTitle className="text-brand-espresso">Add FAQ</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-espresso" htmlFor="add-question">Question</Label>
                    <Input
                      id="add-question"
                      value={addFormData.question}
                      onChange={(e) => setAddFormData({ ...addFormData, question: e.target.value })}
                      className="border-brand-border"
                      placeholder="Enter the question"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="add-answer">Answer</Label>
                    <Textarea
                      id="add-answer"
                      value={addFormData.answer}
                      onChange={(e) => setAddFormData({ ...addFormData, answer: e.target.value })}
                      className="border-brand-border min-h-[100px]"
                      placeholder="Enter the answer"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="add-category">Category</Label>
                    <Input
                      id="add-category"
                      value={addFormData.category}
                      onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                      className="border-brand-border"
                      placeholder="e.g. Process, Delivery, Design"
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
                    <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={addFaq}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] border-brand-border">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-brand-muted">{filteredFaqs.length} of {faqs.length} FAQs</span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <Card key={faq.id} className="p-5 border-brand-border bg-white">
                {editingId === faq.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.question}
                      onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                      className="border-brand-border"
                      placeholder="Question"
                    />
                    <Textarea
                      value={editData.answer}
                      onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                      className="border-brand-border min-h-[100px]"
                      placeholder="Answer"
                    />
                    <Input
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="border-brand-border w-[200px]"
                      placeholder="Category"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-brand-copper hover:bg-brand-copper-dark text-white"
                        onClick={() => saveEdit(faq.id)}
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
                          <h3 className="text-lg font-semibold text-brand-espresso">{faq.question}</h3>
                          {!faq.is_active && (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-brand-muted line-clamp-2">{faq.answer}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-brand-sand border-brand-border text-brand-muted text-[10px]">
                            {faq.category}
                          </Badge>
                          <span className="text-[10px] text-brand-muted">Order: {faq.order_index}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveFaq(faqs.findIndex((f) => f.id === faq.id), "up")}
                          disabled={faqs.findIndex((f) => f.id === faq.id) === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => moveFaq(faqs.findIndex((f) => f.id === faq.id), "down")}
                          disabled={faqs.findIndex((f) => f.id === faq.id) === faqs.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-brand-muted hover:text-brand-espresso"
                          onClick={() => startEdit(faq)}
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
                              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this FAQ. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteFaq(faq.id)}
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

            {filteredFaqs.length === 0 && (
              <Card className="p-12 text-center border-brand-border bg-white">
                <p className="text-brand-muted">No FAQs found.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminFaqs;
