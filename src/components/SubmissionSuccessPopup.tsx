import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/**
 * Lightweight, auto-dismissing confirmation shown once on the home page right
 * after the Space Planner is submitted. The wizard sets the `planner_submitted`
 * localStorage flag before redirecting to "/"; this reads and clears it, slides
 * in a toast, and removes itself after ~6s (with a countdown bar).
 *
 * This mounts globally (outside the wizard's route), so it can't use the
 * wizard's LanguageProvider/useLanguage() — it reads the same "wizardLanguage"
 * localStorage key directly instead, so the toast still matches whichever
 * language the visitor used in the planner.
 */
const DURATION_MS = 6000; // visible time before auto-dismiss (5–7s range)
const SLIDE_MS = 500; // in/out transition duration

const COPY = {
  en: {
    title: "Successfully submitted",
    body: "Your Space Planner is in — our design team will be in touch shortly.",
  },
  fr: {
    title: "Envoi réussi",
    body: "Votre planificateur d'espace a été reçu — notre équipe de conception vous contactera sous peu.",
  },
};

export const SubmissionSuccessPopup = () => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState("100%");
  const lang = localStorage.getItem("wizardLanguage") === "fr" ? "fr" : "en";
  const copy = COPY[lang];

  useEffect(() => {
    if (localStorage.getItem("planner_submitted") !== "true") return;
    localStorage.removeItem("planner_submitted");

    setMounted(true);
    const slideIn = setTimeout(() => {
      setVisible(true);
      setBarWidth("0%"); // triggers the countdown-bar transition
    }, 50);
    const hide = setTimeout(() => setVisible(false), DURATION_MS);
    const unmount = setTimeout(() => setMounted(false), DURATION_MS + SLIDE_MS);

    return () => {
      clearTimeout(slideIn);
      clearTimeout(hide);
      clearTimeout(unmount);
    };
  }, []);

  if (!mounted) return null;

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), SLIDE_MS);
  };

  return (
    <div className="fixed top-6 right-4 sm:right-6 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto overflow-hidden rounded-xl border border-brand-border bg-white shadow-[0_12px_40px_-12px_rgba(45,36,30,0.35)] transition-all ease-out ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
        }`}
        style={{ transitionDuration: `${SLIDE_MS}ms` }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-lg leading-tight text-brand-espresso"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {copy.title}
            </p>
            <p className="mt-0.5 text-sm text-brand-muted">
              {copy.body}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-brand-muted transition-colors hover:text-brand-espresso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Countdown bar */}
        <div className="h-1 bg-brand-sand">
          <div
            className="h-full bg-brand-copper"
            style={{ width: barWidth, transition: `width ${DURATION_MS}ms linear` }}
          />
        </div>
      </div>
    </div>
  );
};
