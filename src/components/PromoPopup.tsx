import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PromoPopup = () => {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const { pathname } = useLocation();
    const isAdminRoute = pathname.startsWith("/admin");

    useEffect(() => {
        // Only show the promo popup on customer-facing pages, never on admin.
        if (isAdminRoute) return;

        const hasClaimed = localStorage.getItem("promo_claimed");

        if (!hasClaimed) {
            const timer = setTimeout(() => {
                setOpen(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isAdminRoute]);

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

            setClaimed(true);
            localStorage.setItem("promo_claimed", "true");
            toast.success("Promo code sent to your email!");
        } catch (error: any) {
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (claimed) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-brand-border">
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-copper/10 rounded-full flex items-center justify-center">
                            <Gift className="w-8 h-8 text-brand-copper" />
                        </div>
                        <h2 className="text-2xl text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                            Code Sent!
                        </h2>
                        <p className="text-sm text-brand-muted">
                            We've sent your promo code to <strong>{email}</strong>.
                            <br />
                            Check your inbox to claim your free color upgrade.
                        </p>
                        <Button
                            onClick={() => setOpen(false)}
                            className="bg-brand-copper text-white text-sm tracking-[0.2em] uppercase rounded-full hover:bg-brand-copper-dark transition-all duration-300 px-8"
                        >
                            Got it, thanks!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden gap-0 bg-white border border-brand-border">
                <div className="grid md:grid-cols-2">
                    {/* Image Side */}
                    <div className="relative hidden md:block h-full min-h-[400px]">
                        <img
                            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80"
                            alt="Custom walk-in closet"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-brand-espresso/30" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                            <h3
                                className="text-4xl font-light mb-2"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                Custom Storage
                            </h3>
                            <p className="text-sm tracking-wider text-white/80">Designed live from your home</p>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="relative p-6 sm:p-10 flex flex-col justify-center bg-brand-cream">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="space-y-2">
                                <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block">
                                    Limited Time Offer
                                </span>
                                <h2
                                    className="text-brand-espresso font-light leading-tight"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
                                >
                                    FREE COLOR UPGRADE
                                </h2>
                                <p className="text-brand-muted text-sm leading-relaxed">
                                    Love to save? Sign up now and receive a promo code for a FREE COLOR UPGRADE on your first design order.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 text-sm border-brand-border focus:border-brand-copper"
                                    />
                                    <p className="text-xs text-brand-muted text-center md:text-left">
                                        *Valid for orders above $3,500. Cannot be combined.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-brand-copper text-white text-sm tracking-[0.2em] uppercase font-medium rounded-full hover:bg-brand-copper-dark transition-all duration-300 shadow-lg h-12"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Get My Code!"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
