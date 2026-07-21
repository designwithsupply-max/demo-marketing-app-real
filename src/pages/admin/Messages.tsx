import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Search, Trash2, Mail, Phone, Reply } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

const STATUSES = ["new", "read", "replied", "archived"] as const;

const statusBadgeClasses: Record<string, string> = {
  new: "bg-brand-copper/20 text-brand-copper-dark border-brand-copper/40 hover:bg-brand-copper/20",
  read: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-50",
  replied: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50",
  archived: "bg-brand-sand text-brand-espresso border-brand-border hover:bg-brand-sand",
};

const AdminMessages = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ---- Auth (mirrors the other admin pages) ----
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
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      const ok = roles.includes("admin") || roles.includes("super_admin");
      setIsAdmin(ok);
      if (!ok) {
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
    if (isAdmin) fetchMessages();
  }, [isAdmin]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMessages((data ?? []) as unknown as ContactMessage[]);
    } catch (error: any) {
      console.error("Error fetching contact messages:", error);
      toast.error(error?.message || "Failed to load messages. Is the contact_messages migration applied?");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    // Optimistic: the list re-sorts on nothing, so a local patch is enough.
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    const { error } = await supabase.from("contact_messages" as any).update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      fetchMessages();
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages" as any).delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete message");
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
      );
    });
  }, [messages, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { total: messages.length, new: 0, read: 0, replied: 0, archived: 0 };
    messages.forEach((m) => {
      base[m.status] = (base[m.status] || 0) + 1;
    });
    return base;
  }, [messages]);

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
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div>
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
            <h1
              className="text-3xl md:text-4xl text-brand-espresso font-light"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Contact Messages
            </h1>
            <p className="text-brand-muted">Everything sent through the website contact form.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: counts.total },
              { label: "New", value: counts.new },
              { label: "Replied", value: counts.replied },
              { label: "Archived", value: counts.archived },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 border-brand-border bg-white">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">{stat.label}</p>
                <p className="text-2xl font-semibold text-brand-espresso mt-2">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-brand-border bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <Input
                  placeholder="Search by name, email, or message…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-brand-border"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-brand-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="mt-4 text-sm text-brand-muted">
              Showing {filtered.length} of {messages.length} messages
            </p>
          </Card>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-brand-border bg-white">
              <p className="text-brand-muted">
                {messages.length === 0 ? "No messages yet" : "No messages match your filters"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map((m) => (
                <Card
                  key={m.id}
                  className={`p-5 border-brand-border bg-white ${
                    m.status === "new" ? "border-l-4 border-l-brand-copper" : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-brand-espresso break-words">{m.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-brand-muted">
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-espresso break-all">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {m.email}
                        </a>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-brand-espresso">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {m.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Badge variant="outline" className={statusBadgeClasses[m.status] || statusBadgeClasses.archived}>
                        {m.status}
                      </Badge>
                      <span className="text-sm text-brand-muted">
                        {format(new Date(m.created_at), "MMM d, yyyy · h:mm a")}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete message</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently deletes the message from <strong>{m.name}</strong>. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteMessage(m.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm text-brand-espresso bg-brand-sand/40 border border-brand-border rounded-xl p-4">
                    {m.message}
                  </p>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(
                        "Re: your message to Design & Supply",
                      )}`}
                      onClick={() => m.status !== "replied" && updateStatus(m.id, "replied")}
                      className="inline-flex items-center justify-center gap-2 bg-brand-copper text-white text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2.5 rounded-full hover:bg-brand-copper-dark transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply by email
                    </a>
                    <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)}>
                      <SelectTrigger className="w-full sm:w-[180px] border-brand-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMessages;
