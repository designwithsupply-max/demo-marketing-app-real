import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminTopBar from "@/components/layout/AdminTopBar";
import { Loader2, Edit2, X, Check } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { ContactInfo } from "@/types";

const AdminContactInfo = () => {
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ email: "", phone: "", address_line1: "", address_line2: "", business_hours: "" });
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
      if (!session) {
        navigate("/auth");
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
      fetchContactInfo();
    }
  }, [isAdmin, session]);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code === "PGRST116") {
        setContactInfo(null);
        return;
      }
      if (error) throw error;
      setContactInfo(data);
    } catch {
      toast.error("Failed to load contact information");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  const startEdit = () => {
    if (!contactInfo) return;
    setEditData({
      email: contactInfo.email,
      phone: contactInfo.phone,
      address_line1: contactInfo.address_line1,
      address_line2: contactInfo.address_line2,
      business_hours: contactInfo.business_hours,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!contactInfo) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("contact_info")
        .update({
          email: editData.email,
          phone: editData.phone,
          address_line1: editData.address_line1,
          address_line2: editData.address_line2,
          business_hours: editData.business_hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactInfo.id);

      if (error) throw error;
      toast.success("Contact information updated");
      setEditing(false);
      fetchContactInfo();
    } catch {
      toast.error("Failed to update contact information");
    } finally {
      setSaving(false);
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
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-2">Admin</span>
              <h1
                className="text-3xl md:text-4xl text-brand-espresso font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Contact Information
              </h1>
              <p className="text-brand-muted">Manage phone, email, address, and business hours</p>
            </div>
            {!editing && (
              <Button className="bg-brand-copper hover:bg-brand-copper-dark text-white" onClick={startEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {contactInfo ? (
            <Card className="p-6 border-brand-border bg-white">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-brand-espresso" htmlFor="ci-email">Email</Label>
                    <Input
                      id="ci-email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="border-brand-border"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="ci-phone">Phone</Label>
                    <Input
                      id="ci-phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="border-brand-border"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="ci-addr1">Address Line 1</Label>
                    <Input
                      id="ci-addr1"
                      value={editData.address_line1}
                      onChange={(e) => setEditData({ ...editData, address_line1: e.target.value })}
                      className="border-brand-border"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="ci-addr2">Address Line 2</Label>
                    <Input
                      id="ci-addr2"
                      value={editData.address_line2}
                      onChange={(e) => setEditData({ ...editData, address_line2: e.target.value })}
                      className="border-brand-border"
                      placeholder="City, State ZIP"
                    />
                  </div>
                  <div>
                    <Label className="text-brand-espresso" htmlFor="ci-hours">Business Hours</Label>
                    <Input
                      id="ci-hours"
                      value={editData.business_hours}
                      onChange={(e) => setEditData({ ...editData, business_hours: e.target.value })}
                      className="border-brand-border"
                      placeholder="e.g. Mon–Fri: 9:00 AM to 6:00 PM"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="bg-brand-copper hover:bg-brand-copper-dark text-white"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" className="border-brand-border" onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
                    <span className="font-medium text-brand-espresso">Email</span>
                    <span className="text-brand-muted">{contactInfo.email}</span>

                    <span className="font-medium text-brand-espresso">Phone</span>
                    <span className="text-brand-muted">{contactInfo.phone}</span>

                    <span className="font-medium text-brand-espresso">Address</span>
                    <div className="text-brand-muted">
                      <div>{contactInfo.address_line1}</div>
                      <div>{contactInfo.address_line2}</div>
                    </div>

                    <span className="font-medium text-brand-espresso">Hours</span>
                    <span className="text-brand-muted">{contactInfo.business_hours}</span>
                  </div>
                  <p className="text-[10px] text-brand-muted pt-2 border-t border-brand-border">
                    Last updated: {new Date(contactInfo.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center border-brand-border bg-white">
              <p className="text-brand-muted">No contact information found. Run the database migration first.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminContactInfo;
