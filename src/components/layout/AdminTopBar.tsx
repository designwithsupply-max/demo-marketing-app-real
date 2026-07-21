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
    ScrollText,
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
    { to: "/admin/legal", label: "Terms & Privacy", icon: ScrollText },
    { to: "/admin/contact", label: "Contact Info", icon: Mail },
    { to: "/file-manager", label: "File Manager", icon: FolderOpen },
];

/**
 * The admin chrome. Despite the historical name, this now renders a professional
 * FIXED VERTICAL SIDEBAR on desktop (≥ lg) and a compact top bar + slide-down
 * drawer on mobile. Pages keep rendering `<AdminTopBar />` at the top of their
 * markup and add `lg:pl-64` to their content wrapper so it clears the sidebar.
 */
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

    // Close the mobile drawer whenever the route changes.
    useEffect(() => {
        setMenuOpen(false);
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
    // Name of the section currently open — shown in the mobile top bar so the
    // admin always knows where they are without opening the drawer.
    const currentTitle =
        navLinks.find((l) => l.to === location.pathname)?.label ?? "Admin Dashboard";

    const NavItem = ({ to, label, Icon }: { to: string; label: string; Icon: any }) => (
        <Link
            to={to}
            onClick={() => setMenuOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(to)
                    ? "bg-brand-copper text-white font-medium shadow-sm"
                    : "text-brand-espresso/70 hover:text-brand-espresso hover:bg-brand-sand"
            }`}
        >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="truncate">{label}</span>
            {to === "/admin/messages" && unreadCount > 0 && (
                <span
                    className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                        isActive(to) ? "bg-white text-brand-copper" : "bg-brand-copper text-white"
                    }`}
                >
                    {unreadCount}
                </span>
            )}
        </Link>
    );

    // Shared sidebar body (brand → nav → footer actions), reused by the desktop
    // fixed rail and the mobile drawer.
    const SidebarBody = () => (
        <div className="flex flex-col h-full">
            <div className="px-5 py-5 border-b border-brand-border">
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="inline-flex">
                    <Logo tone="dark" size="sm" />
                </Link>
                {/* <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-brand-muted">Admin Dashboard</p> */}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map((link) => (
                    <NavItem key={link.to} to={link.to} label={link.label} Icon={link.icon} />
                ))}
            </nav>

            <div className="px-3 py-4 border-t border-brand-border space-y-1">
                <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-espresso/70 hover:text-brand-espresso hover:bg-brand-sand transition-colors"
                >
                    <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
                    Back to Website
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        setMenuOpen(false);
                        logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left text-brand-copper hover:bg-brand-copper/10 transition-colors"
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop: fixed vertical sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-brand-border z-40">
                <SidebarBody />
            </aside>

            {/* Mobile: top bar — hamburger (left) · current section (center) · logout (right) */}
            <div className="lg:hidden sticky top-0 z-40 border-b border-brand-border bg-white/95 backdrop-blur-sm">
                <div className="px-3 py-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-brand-border text-brand-espresso hover:bg-brand-sand transition-colors"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        {!menuOpen && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-copper text-white text-[10px] font-semibold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <p className="flex-1 min-w-0 text-center font-semibold text-brand-espresso truncate">
                        {currentTitle}
                    </p>

                    <Button
                        onClick={() => logout()}
                        className="shrink-0 bg-brand-copper hover:bg-brand-copper-dark text-white text-[11px] tracking-[0.15em] uppercase font-medium px-3 py-2 rounded-full h-auto"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* Mobile: slide-over drawer */}
            {menuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-brand-espresso/40 backdrop-blur-sm"
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl animate-in slide-in-from-left duration-200">
                        <SidebarBody />
                    </div>
                </div>
            )}
        </>
    );
}
