import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import Link from "next/link";
import { ArrowRight, Mail, Phone, Clock, Loader2 } from "lucide-react";
import { useContactInfo } from "@/hooks/useContactInfo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const { contactInfo } = useContactInfo();

  const email = contactInfo?.email || "saminew3919@gmail.com";
  const phone = contactInfo?.phone || "+1 (800) 555-0192";
  const hours = contactInfo?.business_hours || "Mon–Fri: 9:00 AM to 6:00 PM";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      // Messages land in the `contact_messages` table and are read by the admin
      // dashboard at /admin/messages — no email hop in between.
      const { error } = await supabase.from("contact_messages" as any).insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
        status: "new",
      });
      if (error) throw error;
      toast.success("Thanks! Your message has been sent — we'll be in touch shortly.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message || "Sorry, we couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <SeoHead
        title="Contact Design & Supply"
        description="Contact Design & Supply for custom closet, kitchen, and garage design help."
      />
      <Navigation />
      <main className="pt-24 lg:pt-28 pb-20">
        <section className="px-6 lg:px-10 mb-12">
          <div className="max-w-7xl mx-auto">
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">Contact</span>
            <h1 className="text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>
              Let's talk about your space
            </h1>
            <p className="text-brand-muted text-sm leading-relaxed mt-4 max-w-2xl">
              Tell us what you need for your closet, kitchen, or garage. We design live online and supply fully assembled cabinets.
            </p>
          </div>
        </section>

        <section className="px-6 lg:px-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-brand-border rounded-2xl p-8">
              <h2 className="text-brand-espresso text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Contact info</h2>
              <div className="space-y-5 text-sm text-brand-muted">
                <p className="flex items-start gap-3"><Mail size={16} className="text-brand-copper mt-0.5" />{email}</p>
                <p className="flex items-start gap-3"><Phone size={16} className="text-brand-copper mt-0.5" />{phone}</p>
                <p className="flex items-start gap-3"><Clock size={16} className="text-brand-copper mt-0.5" />{hours}</p>
              </div>

              <div className="mt-8">
                <Link href="/space-planner" className="group inline-flex items-center gap-3 bg-brand-copper text-white text-sm tracking-[0.2em] uppercase font-medium px-8 py-4 rounded-full hover:bg-brand-copper-dark transition-all duration-300 shadow-lg">
                  Start 3-Step Space Planner
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <form onSubmit={onSubmit} className="bg-white border border-brand-border rounded-2xl p-8 space-y-4">
              <h2 className="text-brand-espresso text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Send a message</h2>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:border-brand-copper" required />
              <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:border-brand-copper" required />
              <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone (optional)" className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:border-brand-copper" />
              <textarea value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Tell us about your project" rows={5} className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:border-brand-copper" required />
              <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 bg-brand-copper text-white text-sm tracking-[0.2em] uppercase font-medium px-8 py-4 rounded-full hover:bg-brand-copper-dark transition-all duration-300 shadow-lg disabled:opacity-60">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send Message"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
