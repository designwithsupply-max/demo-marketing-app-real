import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface AdminTopBarProps {
    onLogout?: () => void;
}

export default function AdminTopBar({ onLogout }: AdminTopBarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Logged out");
            navigate("/auth");
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error("Error logging out");
        }
    };

    const logout = onLogout || handleLogout;

    const navLinks = [
        { to: "/admin", label: "Submissions" },
        { to: "/admin/content", label: "Homepage" },
        { to: "/admin/faqs", label: "FAQs" },
        { to: "/admin/how-it-works", label: "How It Works" },
        { to: "/admin/about-us", label: "About Us" },
        { to: "/admin/testimonials", label: "Testimonials" },
        { to: "/admin/pricing", label: "Pricing" },
        { to: "/admin/blog", label: "Blog" },
        { to: "/admin/promo", label: "Promo" },
        { to: "/admin/contact", label: "Contact Info" },
        { to: "/file-manager", label: "File Manager" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="border-b border-brand-border bg-white/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-brand-espresso text-white flex items-center justify-center font-serif font-bold">
                        D
                    </div>
                    <div>
                        <p className="text-brand-espresso font-semibold">Admin Dashboard</p>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">Design & Supply</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 border border-brand-border text-brand-espresso hover:bg-brand-sand text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Website
                    </Link>
                    <Button
                        onClick={logout}
                        className="bg-brand-copper hover:bg-brand-copper-dark text-white text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2 rounded-full"
                    >
                        Logout
                    </Button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 flex items-center gap-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 rounded transition-colors ${
                            isActive(link.to)
                                ? "bg-brand-copper/10 text-brand-copper font-medium"
                                : "text-brand-muted hover:text-brand-espresso hover:bg-brand-sand"
                        }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}