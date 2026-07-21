import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Download, Loader2, Upload, Trash2, Copy } from "lucide-react";
import AdminTopBar from "@/components/layout/AdminTopBar";
import ManageAccess from "@/components/admin/ManageAccess";
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
import type { Session } from "@supabase/supabase-js";

interface Submission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  postal_code: string;
  spaces: any;
  storage_priorities: string[];
  additional_notes: string | null;
  meeting_date: string | null;
  meeting_link: string | null;
  meeting_platform: string | null;
  file_paths: string[] | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const statusBadgeClasses: Record<string, string> = {
    pending: "bg-brand-sand text-brand-espresso border-brand-border hover:bg-brand-sand",
    reviewed: "bg-brand-copper/20 text-brand-copper-dark border-brand-copper/40 hover:bg-brand-copper/20",
    in_progress: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-50",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50",
    cancelled: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
  };

  const getStatusBadgeClass = (status: string) => statusBadgeClasses[status] || "bg-brand-sand text-brand-espresso border-brand-border";

  const getSpaceSummary = (spaces: any) => {
    if (!Array.isArray(spaces) || spaces.length === 0) return "No spaces submitted";
    const types = Array.from(new Set(spaces.map((space: any) => space.type).filter(Boolean)));
    return `${spaces.length} space${spaces.length > 1 ? "s" : ""}${types.length ? `: ${types.join(", ")}` : ""}`;
  };

  const statusCounts = submissions.reduce(
    (acc, submission) => {
      acc.total += 1;
      acc[submission.status] = (acc[submission.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, reviewed: 0, in_progress: 0, completed: 0, cancelled: 0 } as Record<string, number>
  );

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (!session) {
          setTimeout(() => {
            navigate("/auth");
          }, 0);
        } else {
          // Check if user is admin
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        }
      }
    );

    // Check existing session
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
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking admin role:", error);
        toast.error("Error checking permissions");
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      const roles = (data ?? []).map((r: { role: string }) => r.role);
      const superAdmin = roles.includes("super_admin");
      // A non-admin is NOT redirected away — the dashboard shows a clear
      // "access pending" screen so they know approval is required.
      setIsSuperAdmin(superAdmin);
      setIsAdmin(superAdmin || roles.includes("admin"));
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isAdmin && session) {
      fetchSubmissions();
    }
  }, [isAdmin, session]);

  // Auto-logout functionality
  useEffect(() => {
    if (!session) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout("Logged out due to inactivity");
      }, 60000); // 1 minute
    };

    // Events to detect activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    // Set up listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
      setFilteredSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = submissions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.postal_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [searchTerm, statusFilter, submissions]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Submission deleted');
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleLogout = async (reason?: string) => {
    // Guard against being wired directly to onClick (which would pass a React
    // event as `reason` and crash the toast when it renders a non-string).
    const message = typeof reason === "string" ? reason : "Logged out successfully";
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(message);
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };

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
          <Card className="p-8 text-center border-brand-border max-w-md">
            <h2 className="text-2xl font-semibold text-brand-espresso mb-2">Access pending</h2>
            <p className="text-brand-muted mb-6">
              Your account has been created but isn't approved yet. An administrator
              must grant you access before you can use the dashboard.
            </p>
            <Button
              variant="outline"
              onClick={() => handleLogout()}
              className="border-brand-border text-brand-espresso hover:bg-brand-sand hover:text-brand-espresso"
            >
              Sign out
            </Button>
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
          <p className="text-brand-muted">Loading submissions...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar onLogout={handleLogout} />
      <div className="min-h-screen bg-brand-cream lg:pl-72 py-6 sm:py-10 px-4 sm:px-6 overflow-x-clip">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Dashboard</span>
              <h1
                className="text-3xl md:text-4xl text-brand-espresso font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Admin Overview
              </h1>
              <p className="text-brand-muted">Review and manage client submissions</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={() => navigate("/file-manager")}
                className="w-full md:w-auto bg-white border border-brand-border text-brand-espresso hover:bg-brand-sand hover:text-brand-espresso"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: statusCounts.total },
              { label: "Pending", value: statusCounts.pending },
              { label: "Reviewed", value: statusCounts.reviewed },
              { label: "Completed", value: statusCounts.completed },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 border-brand-border bg-white">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">{stat.label}</p>
                <p className="text-2xl font-semibold text-brand-espresso mt-2">{stat.value}</p>
              </Card>
            ))}
          </div>

          {isSuperAdmin && <ManageAccess currentUserId={session?.user?.id} />}

          <Card className="p-6 border-brand-border bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <Input
                    placeholder="Search by name, email, or postal code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-brand-border"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-brand-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-brand-muted">
              <p>Showing {filteredSubmissions.length} of {submissions.length} submissions</p>
            </div>
          </Card>

          <div className="grid gap-6">
            {filteredSubmissions.length === 0 ? (
              <Card className="p-12 text-center border-brand-border bg-white">
                <p className="text-brand-muted">
                  {submissions.length === 0 ? "No submissions yet" : "No submissions match your filters"}
                </p>
              </Card>
            ) : (
              filteredSubmissions.map((submission) => {
                const hasSpaces = Array.isArray(submission.spaces) && submission.spaces.length > 0;
                return (
                  <Card key={submission.id} className="p-4 sm:p-6 border-brand-border bg-white shadow-[0_10px_30px_-20px_rgba(45,36,30,0.25)]">
                    <div className="space-y-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-semibold text-brand-espresso break-words">{submission.full_name}</h3>
                          <p className="text-sm text-brand-muted break-all">{submission.email}</p>
                          {submission.phone && (
                            <p className="text-sm text-brand-muted">{submission.phone}</p>
                          )}
                          <p className="text-sm text-brand-muted">Postal: {submission.postal_code}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`${getStatusBadgeClass(submission.status)}`}>
                            {submission.status}
                          </Badge>
                          <span className="text-sm text-brand-muted">
                            {format(new Date(submission.created_at), "MMM d, yyyy")}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the submission from <strong>{submission.full_name}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteSubmission(submission.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="rounded-xl border border-brand-border bg-brand-sand/40 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-brand-muted mb-1">Spaces</p>
                            <p className="text-sm font-semibold text-brand-espresso">{getSpaceSummary(submission.spaces)}</p>
                          </div>
                          {hasSpaces && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto border-brand-border text-brand-espresso hover:bg-brand-sand hover:text-brand-espresso">
                                  View Space Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl bg-brand-cream border-brand-border">
                                <DialogHeader>
                                  <DialogTitle className="text-brand-espresso">Space Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                  {submission.spaces.map((space: any, index: number) => (
                                    <div key={index} className="bg-white border border-brand-border rounded-xl p-4">
                                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                        <div>
                                          <p className="text-base font-semibold text-brand-espresso">
                                            {space.name || `Space ${index + 1}`}
                                          </p>
                                          <p className="text-xs text-brand-muted">
                                            {space.type || "Space"} • Ceiling: {space.ceilingHeight || "N/A"} {space.unit || "cm"}
                                          </p>
                                        </div>
                                        <div className="text-xs text-brand-muted">Unit: {space.unit || "cm"}</div>
                                      </div>

                                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                          <p className="uppercase tracking-[0.2em] text-brand-muted">Perimeter</p>
                                          <p className="text-brand-espresso font-semibold">
                                            {space.totalPerimeter ? `${space.totalPerimeter.toFixed(2)} ${space.unit || "cm"}` : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="uppercase tracking-[0.2em] text-brand-muted">Area</p>
                                          <p className="text-brand-espresso font-semibold">
                                            {space.totalArea ? `${space.totalArea.toFixed(2)} ${space.unit || "cm"}²` : "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="uppercase tracking-[0.2em] text-brand-muted">Ceiling</p>
                                          <p className="text-brand-espresso font-semibold">
                                            {space.ceilingHeight || "N/A"} {space.unit || "cm"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="uppercase tracking-[0.2em] text-brand-muted">Type</p>
                                          <p className="text-brand-espresso font-semibold">{space.type || "Space"}</p>
                                        </div>
                                      </div>

                                      {space.wallMeasurements && space.wallMeasurements.length > 0 && (
                                        <div className="mt-4">
                                          <p className="text-xs uppercase tracking-[0.2em] text-brand-muted mb-2">
                                            Wall Measurements ({space.unit || "cm"})
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {space.wallMeasurements.map((wall: any, wallIndex: number) => (
                                              <span key={wallIndex} className="text-xs bg-brand-sand-light text-brand-espresso px-2.5 py-1 rounded-full">
                                                Wall {wall.label}: {wall.length || "—"} {space.unit || "cm"}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="mt-4">
                                        {space.drawingData ? (
                                          <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-cream">
                                            <img
                                              src={space.drawingData}
                                              alt={`${space.name || `Space ${index + 1}`} drawing`}
                                              className="w-full h-auto"
                                            />
                                          </div>
                                        ) : (
                                          <p className="text-sm text-brand-muted">No drawing uploaded.</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                    {/* Meeting Details */}
                    {submission.meeting_date && submission.meeting_link && (
                      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">🗓️</span>
                          <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                            Scheduled Meeting
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              Date & Time
                            </p>
                            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-50">
                              {format(new Date(submission.meeting_date), 'MMMM do, yyyy h:mm a')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              Platform
                            </p>
                            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-50 capitalize">
                              {submission.meeting_platform || 'Video Call'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 space-y-3">
                          <Button
                            size="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={() => {
                              const link = submission.meeting_link || '';
                              const targetUrl = link.includes('api.calendly.com')
                                ? 'https://calendly.com/app/scheduled_events/user/me'
                                : link;
                              window.open(targetUrl, '_blank');
                            }}
                          >
                            {submission.meeting_link?.includes('api.calendly.com') ? 'Manage Meeting' : 'Join Meeting'}
                          </Button>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Link:</span>
                            <a
                              href={submission.meeting_link?.includes('api.calendly.com') ? 'https://calendly.com/app/scheduled_events/user/me' : submission.meeting_link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                            >
                              {submission.meeting_link?.includes('api.calendly.com') ? 'View in Calendly Dashboard' : submission.meeting_link}
                            </a>
                          </div>
                        </div>
                      </Card>
                    )}

                    {submission.storage_priorities.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-brand-espresso mb-2">Storage Priorities</p>
                        <div className="flex flex-wrap gap-2">
                          {submission.storage_priorities.map((priority) => (
                            <Badge key={priority} className="border-brand-border text-brand-espresso bg-brand-sand-light">
                              {priority}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2 Uploaded Files */}
                    {submission.file_paths && submission.file_paths.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-brand-espresso mb-3">Allocated Files (Step 2)</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {submission.file_paths.map((path, index) => {
                            const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
                            return (
                              <div key={index} className="border border-brand-border rounded-lg overflow-hidden group relative bg-white">
                                <img
                                  src={publicUrl}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => window.open(publicUrl, '_blank')}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {submission.additional_notes && (
                      <div>
                        <p className="text-sm font-semibold text-brand-espresso mb-1">Notes</p>
                        <p className="text-sm text-brand-muted">{submission.additional_notes}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <Label className="text-sm font-semibold text-brand-espresso mb-2 block">Update Status</Label>
                      <Select
                        value={submission.status}
                        onValueChange={(value) => updateStatus(submission.id, value)}
                      >
                        <SelectTrigger className="w-full md:w-[200px] border-brand-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-muted">
                      <span className="shrink-0">Submission ID:</span>
                      <span className="font-mono text-[11px] text-brand-espresso break-all min-w-0">{submission.id}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-brand-muted hover:text-brand-espresso shrink-0"
                        onClick={() => navigator.clipboard.writeText(submission.id)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
