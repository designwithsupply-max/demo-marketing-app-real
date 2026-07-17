import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_PROMO } from "@/lib/siteContent";

/**
 * Small promotional card that slides in from the BOTTOM-RIGHT of the screen so
 * it never blocks the planner or the rest of the site. Behaviour is admin
 * editable (see /admin/promo):
 *  - appears `delaySeconds` after load, on customer pages only (never /admin),
 *  - auto-dismisses `autoDismissSeconds` later — unless the visitor is
 *    interacting with it (hover / focus), so an engaged user is never cut off,
 *  - shows once per browser session, and never again once the code is claimed.
 */
export const PromoPopup = () => {
    const { content } = useSiteContent(SITE_KEYS.promo, DEFAULT_PROMO);
    const { pathname } = useLocation();
    const isAdminRoute = pathname.startsWith("/admin");

    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    // While the visitor is engaging with the card we pause the auto-dismiss so
    // they can finish typing their email.
    const [engaged, setEngaged] = useState(false);

    const delayMs = Math.max(0, (content.delaySeconds ?? DEFAULT_PROMO.delaySeconds) * 1000);
    const autoDismissMs = Math.max(
        0,
        (content.autoDismissSeconds ?? DEFAULT_PROMO.autoDismissSeconds) * 1000,
    );

    // ---- Appearance timer: wait `delaySeconds`, then reveal on a customer page.
    useEffect(() => {
        if (!content.enabled) return;
        if (isAdminRoute) return; // customer pages only
        if (localStorage.getItem("promo_claimed")) return;
        if (sessionStorage.getItem("promo_shown")) return;

        const timer = setTimeout(() => {
            // Guard again in case the visitor navigated to /admin while we waited.
            if (window.location.pathname.startsWith("/admin")) return;
            setOpen(true);
            sessionStorage.setItem("promo_shown", "1");
        }, delayMs);
        return () => clearTimeout(timer);
    }, [content.enabled, isAdminRoute, delayMs]);

    // ---- Auto-dismiss timer: hide after `autoDismissSeconds` unless engaged.
    const engagedRef = useRef(engaged);
    engagedRef.current = engaged;
    useEffect(() => {
        if (!open || engaged) return;
        if (autoDismissMs === 0) return;
        const timer = setTimeout(() => {
            if (!engagedRef.current) setOpen(false);
        }, autoDismissMs);
        return () => clearTimeout(timer);
    }, [open, engaged, autoDismissMs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("send-promo-code", {
                body: { email },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            localStorage.setItem("promo_claimed", "true");
            // The toast is the only confirmation — close the card instead of
            // swapping it for a separate "Code Sent!" panel.
            setOpen(false);
            toast.success("Promo code sent to your email!");
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            toast.error(message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] sm:w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-300"
            role="dialog"
            aria-label="Promotion"
            onMouseEnter={() => setEngaged(true)}
            onFocusCapture={() => setEngaged(true)}
        >
            <div className="relative rounded-xl border border-brand-border bg-white shadow-[0_12px_40px_-12px_rgba(45,36,30,0.35)] overflow-hidden">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="absolute right-2 top-2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-brand-muted hover:text-brand-espresso hover:bg-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {content.imageUrl && (
                    <div className="relative h-24 w-full">
                        <img
                            src={content.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                        <div className="absolute inset-0 bg-brand-espresso/20" />
                    </div>
                )}
                <div className="p-5 space-y-3">
                    <div className="space-y-1">
                        {content.eyebrow && (
                            <span className="text-brand-copper text-[10px] tracking-[0.25em] uppercase block">
                                {content.eyebrow}
                            </span>
                        )}
                        <h2
                            className="text-brand-espresso font-light leading-tight"
                            style={{
                                fontFamily: "'Cormorant Garamond', Georgia, serif",
                                fontSize: "1.4rem",
                            }}
                        >
                            {content.title}
                        </h2>
                        <p className="text-brand-muted text-xs leading-relaxed">
                            {content.description}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                        <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEngaged(true)}
                            required
                            className="h-10 text-sm border-brand-border focus:border-brand-copper"
                        />
                        {content.terms && (
                            <p className="text-[10px] text-brand-muted">{content.terms}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-brand-copper text-white text-xs tracking-[0.15em] uppercase font-medium rounded-full hover:bg-brand-copper-dark transition-all duration-300 shadow h-10"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : content.ctaLabel}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
