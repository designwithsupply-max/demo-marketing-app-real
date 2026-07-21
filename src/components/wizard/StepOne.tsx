import { useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Space } from "@/pages/Wizard";
import { Mail, CheckCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WizardNav } from "@/components/wizard/WizardNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_FEATURES } from "@/lib/siteContent";

interface StepOneProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    postalCode: string;
  };
  setFormData: (data: any) => void;
  spaces: Space[];
  setSpaces: Dispatch<SetStateAction<Space[]>>;
  onNext: () => void;
}

export const StepOne = ({ formData, setFormData, onNext }: StepOneProps) => {
  const { t } = useLanguage();
  // Admins can switch email verification off entirely (/admin/settings). When
  // it's off the visitor moves straight to Step 2 and never sees a magic link.
  const { content: features } = useSiteContent(SITE_KEYS.features, DEFAULT_FEATURES);
  const verificationRequired = features.emailVerification;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() =>
    localStorage.getItem("wizardVerifiedEmail")
  );
  const [modalStage, setModalStage] = useState<"none" | "confirm" | "sent" | "verified">("none");
  const [sending, setSending] = useState(false);
  // A magic-link redirect can surface the same session through both getSession()
  // and onAuthStateChange, and across component re-renders — this makes sure we
  // only celebrate a fresh verification once.
  const celebratedRef = useRef(false);

  const isEmailVerified =
    !!verifiedEmail &&
    formData.email.trim().length > 0 &&
    verifiedEmail.toLowerCase() === formData.email.trim().toLowerCase();

  useEffect(() => {
    // Recognise a verified Supabase session regardless of WHICH browser or tab
    // completed the magic-link click. The magic link often opens in a different
    // browser than the one the form was filled in (e.g. the default mail app on a
    // phone), where `formData.email` is still empty — so if this browser holds a
    // session and no email has been typed yet, adopt the session's email and mark
    // it verified. Otherwise it must match the address the user entered.
    const adopt = (sessionEmail?: string | null) => {
      if (!sessionEmail) return;
      const typed = formData.email.trim().toLowerCase();
      const matches = typed.length === 0 || typed === sessionEmail.toLowerCase();
      if (!matches) return;

      const wasVerified =
        localStorage.getItem("wizardVerifiedEmail")?.toLowerCase() === sessionEmail.toLowerCase();
      localStorage.setItem("wizardVerifiedEmail", sessionEmail);
      setVerifiedEmail(sessionEmail);
      // If the user hadn't typed the email in this browser yet, fill it in so the
      // verified state lines up with the input.
      setFormData((prev: typeof formData) =>
        prev.email?.trim() ? prev : { ...prev, email: sessionEmail },
      );

      // A *fresh* verification (not a page-load rehydrate of an already-verified
      // email) gets an explicit confirmation the visitor can't miss, plus a
      // button to move on to Step 2. We key off `wasVerified` rather than the
      // auth event because a magic-link redirect can report the session via
      // getSession() (no event) or an INITIAL_SESSION event, not only SIGNED_IN.
      if (!wasVerified && !celebratedRef.current && verificationRequired) {
        celebratedRef.current = true;
        sessionStorage.removeItem("wizardAwaitingVerification");
        setModalStage("verified");
        toast.success(t("s1.toastVerified"));
      }
    };

    // Catch a session that already exists on load (the browser that opened the
    // magic link) in addition to live auth-state changes.
    supabase.auth.getSession().then(({ data }) => adopt(data.session?.user?.email));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      adopt(session?.user?.email),
    );
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, verificationRequired]);

  const sendVerificationEmail = async () => {
    setSending(true);
    sessionStorage.setItem("wizardAwaitingVerification", "1");
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      // Send them back to the planner itself (a clean, stable URL that can be
      // allow-listed in Supabase Auth → URL Configuration). window.location.href
      // can carry transient query/hash params that fail the allow-list match,
      // which makes Supabase silently fall back to the Site URL (the home page).
      options: { emailRedirectTo: `${window.location.origin}/space-planner` },
    });
    setSending(false);
    if (error) {
      sessionStorage.removeItem("wizardAwaitingVerification");
      console.error("Supabase signInWithOtp error:", error);
      toast.error(error.message || t("s1.toastErr"));
      return;
    }
    toast.success(t("s1.toastSent"));
    setModalStage("sent");
  };

  const validateName = (name: string) => name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
  const validatePhone = (phone: string) => phone.trim() === "" || (phone.replace(/\D/g, "").length === 10 && /^\d+$/.test(phone.replace(/\D/g, "")));
  const validatePostalCode = (code: string) => {
    const cleaned = code.replace(/\s|-/g, "").toUpperCase();
    return /^\d{5}$/.test(cleaned) || /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned);
  };

  // Enforce the format AS THE USER TYPES so an invalid code can't be entered:
  //  - If the first character is a digit  -> USA mode:  digits only, max 5 (07302)
  //  - If the first character is a letter -> Canada mode: Letter Number Letter
  //    Number Letter Number, max 6 (H4W2H8). Any character that doesn't fit the
  //    next expected slot is dropped.
  const maskPostalCode = (raw: string) => {
    const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (s.length === 0) return "";

    if (/[0-9]/.test(s[0])) {
      // USA: numeric only, 5 digits max
      return s.replace(/\D/g, "").slice(0, 5);
    }

    // Canada: alternating letter / number, 6 chars max
    let out = "";
    for (let i = 0; i < s.length && out.length < 6; i++) {
      const ch = s[i];
      const expectLetter = out.length % 2 === 0; // slots 0,2,4 = letters; 1,3,5 = digits
      if (expectLetter && /[A-Z]/.test(ch)) out += ch;
      else if (!expectLetter && /[0-9]/.test(ch)) out += ch;
      // otherwise skip the character that doesn't fit the pattern
    }
    return out;
  };

  const isFormValid = () => {
    return (
      validateName(formData.fullName) &&
      validateEmail(formData.email) &&
      (formData.phone.trim() === "" || validatePhone(formData.phone)) &&
      validatePostalCode(formData.postalCode)
    );
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, phone: numbersOnly });
      setErrors(prev => ({
        ...prev,
        phone: numbersOnly.length > 0 && numbersOnly.length !== 10
          ? t("s1.errPhone")
          : "",
      }));
      return;
    }

    if (field === "postalCode") {
      // Mask to a valid US (07302) or Canadian (H4W2H8) format while typing.
      const cleaned = maskPostalCode(value);
      setFormData({ ...formData, postalCode: cleaned });
      setErrors(prev => ({
        ...prev,
        postalCode: cleaned.length > 0 && !validatePostalCode(cleaned)
          ? t("s1.errPostal")
          : "",
      }));
      return;
    }

    setFormData({ ...formData, [field]: value });

    setErrors(prev => {
      const next = { ...prev };
      if (field === "fullName") {
        next.fullName = value.trim().length > 0 && !validateName(value)
          ? t("s1.errName")
          : "";
      } else if (field === "email") {
        next.email = value.trim().length > 0 && !validateEmail(value)
          ? t("s1.errEmail")
          : "";
      }
      return next;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.fullName)) {
      newErrors.fullName = t("s1.errName");
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = t("s1.errEmail");
    }
    if (formData.phone.trim() !== "" && !validatePhone(formData.phone)) {
      newErrors.phone = t("s1.errPhone");
    }
    if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = t("s1.errPostal");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Email verification is mandatory before moving to Step 2 — unless an
      // admin has turned the requirement off.
      if (!verificationRequired) {
        onNext();
      } else if (verifiedEmail && verifiedEmail.toLowerCase() === formData.email.trim().toLowerCase()) {
        onNext();
      } else {
        setModalStage("confirm");
      }
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {t("s1.title")}
        </h2>
        <p className="text-brand-muted mt-1">{t("s1.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-espresso">{t("s1.name")}</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className={`w-full p-3 border rounded-md text-brand-espresso focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper outline-none transition-all ${errors.fullName ? "border-red-500" : "border-brand-border"}`}
            placeholder={t("s1.namePh")}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-espresso flex items-center gap-2">
            {t("s1.email")}
            {isEmailVerified && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                <CheckCircle size={14} /> {t("s1.verified")}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full p-3 ${isEmailVerified ? "pr-10" : ""} border rounded-md text-brand-espresso focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper outline-none transition-all ${
                errors.email
                  ? "border-red-500"
                  : isEmailVerified
                    ? "border-green-500 bg-green-50/40"
                    : "border-brand-border"
              }`}
              placeholder={t("s1.emailPh")}
            />
            {isEmailVerified && (
              <CheckCircle
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none"
              />
            )}
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          {isEmailVerified && !errors.email && (
            <p className="text-xs text-green-600">{t("s1.verifiedHelp")}</p>
          )}
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-espresso">{t("s1.postal")}</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
            className={`w-full p-3 border rounded-md text-brand-espresso focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper outline-none transition-all ${errors.postalCode ? "border-red-500" : "border-brand-border"}`}
            placeholder={t("s1.postalPh")}
            maxLength={6}
          />
          {errors.postalCode && <p className="text-xs text-red-500">{errors.postalCode}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-espresso">{t("s1.phone")}</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={`w-full p-3 border rounded-md text-brand-espresso focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper outline-none transition-all ${errors.phone ? "border-red-500" : "border-brand-border"}`}
            placeholder={t("s1.phonePh")}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      {/* Navigation (floating) */}
      <WizardNav
        right={
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`inline-flex items-center justify-center gap-3 text-[11px] sm:text-sm tracking-[0.1em] sm:tracking-[0.2em] uppercase font-medium px-4 sm:px-8 py-3 sm:py-4 rounded-full whitespace-nowrap transition-all duration-300 shadow-lg ${isFormValid()
              ? "bg-brand-copper text-white hover:bg-brand-copper-dark animate-wizard-pulse"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {t("s1.continue")}
          </button>
        }
      />

      <Dialog open={modalStage === "confirm"} onOpenChange={(open) => !open && setModalStage("none")}>
        <DialogContent className="max-w-md text-center">
          <h3 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {t("s1.verifyTitle")}
          </h3>
          <p className="text-brand-muted mt-2">
            {t("s1.verifyBody")}{" "}
            <span className="font-semibold text-brand-espresso">{formData.email}</span>
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={sendVerificationEmail}
              disabled={sending}
              className="w-full py-3 rounded-full bg-brand-copper text-white font-medium tracking-wide hover:bg-brand-copper-dark transition-colors disabled:opacity-60"
            >
              {sending ? t("s1.sending") : t("s1.verifyCta")}
            </button>
            <button
              type="button"
              onClick={() => setModalStage("none")}
              className="w-full py-3 rounded-full border border-brand-border text-brand-espresso font-medium hover:bg-brand-sand/50 transition-colors"
            >
              {t("s1.cancel")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalStage === "sent"} onOpenChange={(open) => !open && setModalStage("none")}>
        <DialogContent className="max-w-md text-center">
          <h3 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {t("s1.sentTitle")}
          </h3>
          <p className="text-brand-muted mt-2">
            {t("s1.sentBody1")} <span className="font-semibold text-brand-espresso">{formData.email}</span>. {t("s1.sentBody2")}
          </p>
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 rounded-full bg-brand-sand flex items-center justify-center">
              <Mail className="w-7 h-7 text-brand-copper" />
            </div>
          </div>
          <p className="text-sm text-brand-muted">
            {t("s1.sentBody3")}
          </p>
        </DialogContent>
      </Dialog>

      {/* Shown when a magic-link click lands back here and the session is
          detected — the explicit "you're verified, continue" confirmation. */}
      <Dialog open={modalStage === "verified"} onOpenChange={(open) => !open && setModalStage("none")}>
        <DialogContent className="max-w-md text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {t("s1.verifiedModalTitle")}
          </h3>
          <p className="text-brand-muted mt-2">
            <span className="font-semibold text-brand-espresso">{formData.email}</span>{" "}
            {t("s1.verifiedModalBody")}
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setModalStage("none");
                onNext();
              }}
              className="w-full py-3 rounded-full bg-brand-copper text-white font-medium tracking-wide hover:bg-brand-copper-dark transition-colors"
            >
              {t("s1.verifiedModalCta")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};
