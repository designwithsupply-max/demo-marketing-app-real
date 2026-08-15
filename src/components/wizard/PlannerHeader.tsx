import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContactInfo } from "@/hooks/useContactInfo";

/**
 * A stripped-down header for the Space Planner: logo, a way back to the main
 * site, the language toggle, and a help contact — instead of the full
 * marketing navigation (services dropdown, gallery, blog, FAQ, payment
 * button…), which only adds noise while someone is mid-submission.
 */
export const PlannerHeader = () => {
  const { language, setLanguage, t } = useLanguage();
  const { contactInfo } = useContactInfo();
  const smsPhone = (contactInfo?.phone || "+1 (800) 555-0192").replace(/[^\d+]/g, "");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center flex-shrink-0">
          <Logo tone="dark" size="sm" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-espresso transition-colors"
          >
            <ArrowLeft size={14} /> {t("wz.backToSite")}
          </Link>

          <a
            href={`sms:${smsPhone}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-espresso transition-colors"
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">{t("wz.help")}</span>
          </a>

          <div className="inline-flex items-center rounded-full border border-brand-border bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              className={`px-3 py-1 text-xs font-semibold tracking-wide rounded-full transition-colors ${
                language === "en" ? "bg-brand-copper text-white" : "text-brand-muted hover:text-brand-espresso"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("fr")}
              aria-pressed={language === "fr"}
              className={`px-3 py-1 text-xs font-semibold tracking-wide rounded-full transition-colors ${
                language === "fr" ? "bg-brand-copper text-white" : "text-brand-muted hover:text-brand-espresso"
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
