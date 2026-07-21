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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Loader2, Plus, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { blogService, slugify, type BlogPost } from "@/lib/blogService";

const emptyForm = {
  id: "" as string,
  title: "",
  slug: "",
  author: "",
  excerpt: "",
  content: "",
  cover_image_url: "" as string | null,
  cover_public_id: "" as string | null,
  is_published: false,
};

const AdminBlog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => { if (isAdmin && session) fetchPosts(); }, [isAdmin, session]);

  const fetchPosts = async () => {
    try { setPosts(await blogService.fetchAll()); }
    catch { toast.error("Failed to load posts"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); toast.success("Logged out"); navigate("/auth"); };

  const openAdd = () => { setForm({ ...emptyForm }); setSlugTouched(false); setDialogOpen(true); };
  const openEdit = (p: BlogPost) => {
    setForm({
      id: p.id, title: p.title, slug: p.slug, author: p.author ?? "", excerpt: p.excerpt ?? "",
      content: p.content ?? "", cover_image_url: p.cover_image_url, cover_public_id: p.cover_public_id,
      is_published: p.is_published,
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const onTitle = (v: string) =>
    setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));

  const handleCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, path } = await blogService.uploadCover(file);
      setForm((f) => ({ ...f, cover_image_url: url, cover_public_id: path }));
      toast.success("Cover uploaded");
    } catch { toast.error("Cover upload failed"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.slug.trim()) return toast.error("Slug is required");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: slugify(form.slug),
        author: form.author.trim() || null,
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        cover_image_url: form.cover_image_url || null,
        cover_public_id: form.cover_public_id || null,
        is_published: form.is_published,
      };
      if (form.id) {
        // set published_at when publishing for the first time
        const existing = posts.find((p) => p.id === form.id);
        const published_at =
          form.is_published && !existing?.published_at ? new Date().toISOString() : existing?.published_at ?? null;
        await blogService.update(form.id, { ...payload, published_at });
        toast.success("Post updated");
      } else {
        await blogService.create(payload);
        toast.success("Post created");
      }
      setDialogOpen(false);
      await fetchPosts();
    } catch (e: any) {
      if (String(e?.message || "").includes("duplicate") || e?.code === "23505")
        toast.error("That slug is already used — choose a different one.");
      else toast.error("Save failed");
    } finally { setSaving(false); }
  };

  const togglePublish = async (p: BlogPost) => {
    try {
      await blogService.update(p.id, {
        is_published: !p.is_published,
        published_at: !p.is_published ? p.published_at ?? new Date().toISOString() : p.published_at,
      });
      await fetchPosts();
    } catch { toast.error("Could not update"); }
  };

  const remove = async (p: BlogPost) => {
    try { await blogService.remove(p); toast.success("Deleted"); setPosts((prev) => prev.filter((x) => x.id !== p.id)); }
    catch { toast.error("Delete failed"); }
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
              <h1 className="text-3xl md:text-4xl text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Blog Management</h1>
              <p className="text-brand-muted">Write, edit, publish, and remove blog posts.</p>
            </div>
            <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
          ) : posts.length === 0 ? (
            <Card className="p-12 text-center border-brand-border bg-white"><p className="text-brand-muted">No posts yet. Create your first one.</p></Card>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <Card key={p.id} className="p-4 border-brand-border bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 rounded-md overflow-hidden bg-brand-sand flex-shrink-0">
                      {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-espresso truncate">{p.title}</h3>
                        {p.is_published
                          ? <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">Published</Badge>
                          : <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">Draft</Badge>}
                      </div>
                      <p className="text-xs text-brand-muted truncate">/blog/{p.slug}</p>
                      {p.excerpt && <p className="text-sm text-brand-muted line-clamp-1 mt-0.5">{p.excerpt}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" title={p.is_published ? "Unpublish" : "Publish"} onClick={() => togglePublish(p)}>
                        {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-brand-muted hover:text-brand-espresso" onClick={() => openEdit(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete post</AlertDialogTitle>
                            <AlertDialogDescription>This permanently deletes “{p.title}”. This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(p)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          <DialogHeader><DialogTitle className="text-brand-espresso">{form.id ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-brand-espresso">Title</Label>
              <Input value={form.title} onChange={(e) => onTitle(e.target.value)} className="border-brand-border" placeholder="Post title" />
            </div>
            <div>
              <Label className="text-brand-espresso">Slug (URL)</Label>
              <Input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                className="border-brand-border" placeholder="post-url-slug"
              />
              <p className="text-[11px] text-brand-muted mt-1">Lives at /blog/{slugify(form.slug || "your-title")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-brand-espresso">Author (optional)</Label>
                <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="border-brand-border" placeholder="e.g. Design & Supply" />
              </div>
              <div>
                <Label className="text-brand-espresso">Cover image</Label>
                <Input type="file" accept="image/*" onChange={(e) => handleCover(e.target.files?.[0])} className="border-brand-border" />
                {uploading && <p className="text-[11px] text-brand-muted mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
              </div>
            </div>
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="cover preview" className="w-full max-h-40 object-cover rounded-md border border-brand-border" />
            )}
            <div>
              <Label className="text-brand-espresso">Excerpt (optional)</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="border-brand-border min-h-[60px]" placeholder="Short summary shown on the blog list" />
            </div>
            <div>
              <Label className="text-brand-espresso">Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="border-brand-border min-h-[220px] font-mono text-sm" placeholder={"Write your post here.\n\nSupports Markdown-lite:\n# Heading\n## Subheading\n- bullet point\n**bold**, *italic*, [link](https://…)"} />
              <p className="text-[11px] text-brand-muted mt-1">Formatting: # / ## / ### headings, - bullets, 1. numbered, &gt; quote, **bold**, *italic*, [text](url).</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))} />
              <Label className="text-brand-espresso">Published (visible on site)</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-brand-border" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={save} disabled={saving || uploading}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{form.id ? "Save changes" : "Create post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBlog;
