import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Gates admin-only routes. A session alone is NOT enough — the user must hold
 * the admin (or super_admin) role. Signed-in users without a role are sent to
 * /admin, which shows the "pending approval" screen.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { loading, hasSession, isAdmin } = useAdminRole();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!hasSession) {
        // Not signed in — send to login, remembering where they were headed.
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        // Signed in but not approved — the dashboard shows the pending screen.
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
