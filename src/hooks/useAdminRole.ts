import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminRoleState {
  loading: boolean;
  /** There is an authenticated session (regardless of role). */
  hasSession: boolean;
  /** admin OR super_admin — may open the dashboard. */
  isAdmin: boolean;
  /** super_admin — may grant/revoke access. */
  isSuperAdmin: boolean;
}

/**
 * Resolves the current user's admin standing from the `user_roles` table and
 * keeps it in sync with auth changes. Used to gate the admin routes and to
 * decide whether the "Manage Access" panel is shown.
 */
export function useAdminRole(): AdminRoleState {
  const [state, setState] = useState<AdminRoleState>({
    loading: true,
    hasSession: false,
    isAdmin: false,
    isSuperAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const resolve = async (userId?: string) => {
      if (!userId) {
        if (active) setState({ loading: false, hasSession: false, isAdmin: false, isSuperAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = (data ?? []).map((r: { role: string }) => r.role);
      const isSuperAdmin = roles.includes("super_admin");
      const isAdmin = isSuperAdmin || roles.includes("admin");
      if (active) setState({ loading: false, hasSession: true, isAdmin, isSuperAdmin });
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session?.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      resolve(session?.user?.id),
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
