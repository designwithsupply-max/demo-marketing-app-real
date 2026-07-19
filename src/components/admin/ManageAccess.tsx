import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserPlus, UserMinus, Search } from "lucide-react";

interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  roles: string[];
}

/**
 * Super-admin only. Lists every account and lets a super-admin grant or revoke
 * the `admin` role. The `super_admin` role itself is intentionally not editable
 * here — it's managed directly in the database to avoid accidental lockout or
 * privilege escalation from the UI. All writes are additionally enforced by RLS
 * (only super_admins can change `user_roles`).
 */
export default function ManageAccess({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
      supabase.from("profiles" as any).select("id, email, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (pErr || rErr) {
      console.error("Failed to load users/roles:", pErr || rErr);
      toast.error("Could not load users.");
      setLoading(false);
      return;
    }

    const rolesByUser = new Map<string, string[]>();
    (roleRows ?? []).forEach((r: { user_id: string; role: string }) => {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role]);
    });

    setUsers(
      ((profiles ?? []) as unknown as Array<{ id: string; email: string | null; created_at: string }>).map((p) => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        roles: rolesByUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setAdmin = async (userId: string, grant: boolean) => {
    setPendingId(userId);
    try {
      if (grant) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        // A duplicate role is not a real failure — treat it as already granted.
        if (error && error.code !== "23505") throw error;
        toast.success("Admin access granted.");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
        toast.success("Admin access revoked.");
      }
      await load();
    } catch (e: any) {
      console.error("Role change failed:", e);
      toast.error(e.message || "Could not update access.");
    } finally {
      setPendingId(null);
    }
  };

  const filtered = users.filter((u) =>
    (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="p-4 sm:p-6 border-brand-border bg-white">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-brand-copper" />
        <h2 className="text-lg font-semibold text-brand-espresso">Manage Access</h2>
      </div>
      <p className="text-sm text-brand-muted mb-4">
        Grant or revoke admin access. New sign-ups have no access until you grant it.
        Super-admins are managed in the database.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-brand-border"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-muted py-8 text-center">No users found.</p>
      ) : (
        <div className="flex flex-col divide-y divide-brand-border">
          {filtered.map((u) => {
            const isSuper = u.roles.includes("super_admin");
            const isAdmin = isSuper || u.roles.includes("admin");
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-brand-espresso break-all">
                      {u.email ?? "(no email)"}
                    </span>
                    {isSelf && <span className="text-xs text-brand-muted">(you)</span>}
                    {isSuper && (
                      <Badge className="bg-brand-copper/20 text-brand-copper-dark border-brand-copper/40">
                        Super Admin
                      </Badge>
                    )}
                    {!isSuper && isAdmin && (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">Admin</Badge>
                    )}
                    {!isAdmin && (
                      <Badge variant="outline" className="text-brand-muted border-brand-border">
                        No access
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Super-admins can't be demoted from here. */}
                {!isSuper && (
                  <div className="shrink-0">
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingId === u.id}
                        onClick={() => setAdmin(u.id, false)}
                        className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4 mr-1.5" /> Revoke Admin
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={pendingId === u.id}
                        onClick={() => setAdmin(u.id, true)}
                        className="w-full sm:w-auto bg-brand-copper text-white hover:bg-brand-copper-dark"
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1.5" /> Grant Admin
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
