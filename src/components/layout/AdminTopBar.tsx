import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    ArrowLeft,
    Menu,
    X,
    LogOut,
    Inbox,
    Home,
    HelpCircle,
    ListChecks,
    Info,
    MessageSquareQuote,
    Tag,
    Newspaper,
    Gift,
    Mail,
    MessagesSquare,
    SlidersHorizontal,
    FolderOpen,
} from "lucide-react";
import Logo from "@/components/layout/Logo";

interface AdminTopBarProps {
    onLogout?: () => void;
}

const navLinks = [
    { to: "/admin", label: "Submissions", icon: Inbox },
    { to: "/admin/messages", label: "Contact Messages", icon: MessagesSquare },
    { to: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
    { to: "/admin/content", label: "Homepage", icon: Home },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
    { to: "/admin/how-it-works", label: "How It Works", icon: ListChecks },
    { to: "/admin/about-us", label: "About Us", icon: Info },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/pricing", label: "Pricing", icon: Tag },
    { to: "/admin/blog", label: "Blog", icon: Newspaper },
    { to: "/admin/promo", label: "Promo", icon: Gift },
    { to: "/admin/contact", label: "Contact Info", icon: Mail },
    { to: "/file-manager", label: "File Manager", icon: FolderOpen },
];

export default function AdminTopBar({ onLogout }: AdminTopBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    // Unread ("new") contact messages, shown as a badge on the Contact Messages
    // link so a fresh enquiry is visible from any admin page.
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { count, error } = await supabase
                .from("contact_messages" as any)
                .select("id", { count: "exact", head: true })
                .eq("status", "new");
            // Silent on error — the badge is a nicety, and the table may not
            // exist yet if the migration hasn't been applied.
            if (!cancelled && !error) setUnreadCount(count ?? 0);
        })();
        return () => {
            cancelled = true;
        };
        // Re-check on navigation so the badge clears after triaging the inbox.
    }, [location.pathname]);

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
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="border-b border-brand-border bg-white/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Top row: brand + actions */}
                <div className="py-3 sm:py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <Logo tone="dark" size="sm" />
                        <p className="hidden sm:block text-brand-espresso font-semibold leading-tight truncate border-l border-brand-border pl-3">
                            Admin Dashboard
                        </p>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 border border-brand-border text-brand-espresso hover:bg-brand-sand text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Website
                        </Link>
                        <Button
                            onClick={() => logout()}
                            className="bg-brand-copper hover:bg-brand-copper-dark text-white text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2 rounded-full"
                        >
                            Logout
                        </Button>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-brand-border text-brand-espresso hover:bg-brand-sand transition-colors"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Desktop nav links (wrap instead of overflowing) */}
                <div className="hidden lg:flex flex-wrap items-center gap-1 pb-3">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 rounded transition-colors ${
                                    isActive(link.to)
                                        ? "bg-brand-copper/10 text-brand-copper font-medium"
                                        : "text-brand-muted hover:text-brand-espresso hover:bg-brand-sand"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {link.label}
                                {link.to === "/admin/messages" && unreadCount > 0 && (
                                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-copper text-white text-[10px] font-semibold flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="lg:hidden border-t border-brand-border bg-white animate-in slide-in-from-top-2 fade-in duration-200">
                    <nav className="max-w-7xl mx-auto px-3 py-2 flex flex-col">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                                        isActive(link.to)
                                            ? "bg-brand-copper/10 text-brand-copper font-medium"
                                            : "text-brand-espresso hover:bg-brand-sand"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {link.label}
                                    {link.to === "/admin/messages" && unreadCount > 0 && (
                                        <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-brand-copper text-white text-[11px] font-semibold flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        <div className="border-t border-brand-border my-2" />

                        <Link
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-brand-espresso hover:bg-brand-sand transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" />
                            Back to Website
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                logout();
                            }}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left text-brand-copper hover:bg-brand-sand transition-colors"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Logout
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
}
