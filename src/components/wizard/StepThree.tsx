import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Space, UploadedFile } from "@/pages/Wizard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Home, MessageCircle, CalendarCheck } from "lucide-react";
import { WizardNav } from "@/components/wizard/WizardNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContactInfo } from "@/hooks/useContactInfo";

interface StepThreeProps {
  formData: any;
  spaces: Space[];
  files: UploadedFile[];
  additionalNotes: string;
  onBack: () => void;
  onComplete: () => void;
}

declare global {
  interface Window {
    Calendly?: any;
  }
}

export const StepThree = ({ formData, spaces, files, additionalNotes, onBack, onComplete }: StepThreeProps) => {
  const { t } = useLanguage();
  const { contactInfo } = useContactInfo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [calendlyReady, setCalendlyReady] = useState(false);
  const calendlyContainerRef = useRef<HTMLDivElement>(null);
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  const autoSubmitRef = useRef(false);
  const calendlyInitedRef = useRef(false);
  // The event_scheduled postMessage only carries API URIs — the actual time and
  // Google Meet / Zoom link are fetched server-side from these in the edge
  // function, so the confirmation email can show them.
  const calendlyBookingRef = useRef<{ eventUri?: string; inviteeUri?: string }>({});

  const smsPhone = (contactInfo?.phone || "+1 (800) 555-0192").replace(/[^\d+]/g, "");

  const calendlyUrl = `https://calendly.com/designandsupply/30min?name=${encodeURIComponent(
    formData.fullName
  )}&email=${encodeURIComponent(formData.email)}&hide_event_type_details=1&hide_gdpr_banner=1`;

  // Load Calendly's script AND explicitly initialise the inline widget.
  // Auto-init (via the data-url attribute) only fires for divs present when the
  // script first loads — in this SPA the div mounts later, so we must call
  // Calendly.initInlineWidget ourselves once the script is available.
  useEffect(() => {
    const SCRIPT_ID = "calendly-widget-script";
    const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

    const initWidget = () => {
      const container = calendlyContainerRef.current;
      if (!container || !window.Calendly || calendlyInitedRef.current) return;
      calendlyInitedRef.current = true;
      // `container` has no JSX children, so React won't reconcile away the iframe.
      window.Calendly.initInlineWidget({ url: calendlyUrl, parentElement: container });
      setCalendlyReady(true);
    };

    // Ensure Calendly's stylesheet is present (needed for correct inline sizing).
    if (!document.getElementById("calendly-widget-style")) {
      const link = document.createElement("link");
      link.id = "calendly-widget-style";
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.Calendly) {
      initWidget();
    } else if (script) {
      script.addEventListener("load", initWidget);
    } else {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.addEventListener("load", initWidget);
      document.body.appendChild(script);
    }

    // Fallback poll in case the script's load event already fired earlier.
    const poll = setInterval(() => {
      if (window.Calendly) {
        initWidget();
        clearInterval(poll);
      }
    }, 300);
    const stopPoll = setTimeout(() => clearInterval(poll), 6000);

    return () => {
      clearInterval(poll);
      clearTimeout(stopPoll);
      script?.removeEventListener("load", initWidget);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for the Calendly "event_scheduled" message so we know booking succeeded.
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event && typeof e.data.event === "string" && e.data.event.indexOf("calendly") === 0) {
        if (e.data.event === "calendly.event_scheduled") {
          const payload = e.data.payload || {};
          calendlyBookingRef.current = {
            eventUri: payload.event?.uri,
            inviteeUri: payload.invitee?.uri,
          };
          setIsScheduled(true);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const submitData = async () => {
    setIsSubmitting(true);
    try {
      const filePaths = files.filter(f => f.uploadStatus === 'success').map(f => f.filePath);

      const { error } = await supabase.from('submissions').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        postal_code: formData.postalCode,
        spaces: spaces,
        additional_notes: additionalNotes,
        file_paths: filePaths,
        status: 'pending',
      });

      if (error) throw error;

      // Invoke edge function to send emails. When the user booked a Calendly
      // slot, flag it as a booking and forward the event URIs so the function
      // can pull the real date/time and video link into the confirmation.
      const booked = calendlyBookingRef.current.eventUri != null;
      await supabase.functions.invoke('send-submission-emails', {
        body: {
          clientEmail: formData.email,
          clientName: formData.fullName,
          emailType: booked ? 'booking' : 'submission',
          adminEmail: contactInfo?.email || undefined,
          submissionData: {
            ...formData,
            spaces,
            additionalNotes,
            filePaths,
            calendlyEventUri: calendlyBookingRef.current.eventUri,
            calendlyInviteeUri: calendlyBookingRef.current.inviteeUri,
          }
        }
      });

      toast.success(t("s3.toastOk"));
      setHasSubmitted(true);
      // The project is safely stored server-side now — clear the local draft
      // so a refresh doesn't resurrect it, but stay on this screen so the
      // customer actually sees the confirmation (see success state below)
      // instead of being redirected away from it.
      onComplete();
      return true;
    } catch (error: any) {
      toast.error(error.message || t("s3.toastFail"));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (isSubmitting || hasSubmitted) return;
    await submitData();
  };

  // When the Calendly booking succeeds, submit the planner automatically (once).
  useEffect(() => {
    if (!isScheduled || autoSubmitRef.current || hasSubmitted) return;
    autoSubmitRef.current = true;
    handleFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScheduled]);

  const scrollToBooking = () => {
    bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {hasSubmitted ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle size={22} />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {t("s3.receivedTitle")}
            </h2>
          </div>
          <p className="text-brand-espresso/80 mb-5">{t("s3.receivedBody")}</p>

          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {["s3.next1", "s3.next2", "s3.next3", "s3.next4"].map((key, i) => (
              <li key={key} className="flex items-start gap-3 bg-white rounded-md border border-brand-border px-3 py-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-copper text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-brand-espresso">{t(key)}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3">
            {!isScheduled && (
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex items-center gap-2 bg-brand-copper hover:bg-brand-copper-dark text-white text-sm font-medium px-5 py-3 rounded-full transition-colors"
              >
                <CalendarCheck size={16} /> {t("s3.bookLiveDesign")}
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-brand-border text-brand-espresso text-sm font-medium px-5 py-3 rounded-full hover:border-brand-copper transition-colors"
            >
              <Home size={16} /> {t("s3.returnHome")}
            </Link>
            <a
              href={`sms:${smsPhone}`}
              className="inline-flex items-center gap-2 border border-brand-border text-brand-espresso text-sm font-medium px-5 py-3 rounded-full hover:border-brand-copper transition-colors"
            >
              <MessageCircle size={16} /> {t("s3.textUsMore")}
            </a>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {t("s3.title")}
          </h2>
          <p className="text-brand-muted mt-1">{t("s3.subtitle")}</p>
        </div>
      )}

      {/* Summary Section — reviewed first, before booking */}
      <div className="space-y-6 rounded-lg border border-brand-border bg-brand-sand/30 p-6">
        <h3 className="text-xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {t("s3.summary")}
        </h3>

        <div className="pb-4 border-b border-brand-border">
          <h3 className="font-semibold text-brand-espresso">{t("s3.contact")}</h3>
          <p><strong>{t("s3.name")}</strong> {formData.fullName}</p>
          <p><strong>{t("s3.email")}</strong> {formData.email}</p>
          {formData.phone && <p><strong>{t("s3.phone")}</strong> {formData.phone}</p>}
          <p><strong>{t("s3.postal")}</strong> {formData.postalCode}</p>
        </div>

        <div className="pb-4 border-b border-brand-border">
          <h3 className="font-semibold text-brand-espresso">{t("s3.spaces")}</h3>
          {spaces.map(space => (
            <div key={space.id} className="mt-4 space-y-2">
              <p><strong>{space.name}</strong> ({space.type})</p>
              <p>{t("s3.ceiling")} {space.ceilingHeight} {space.unit || 'in'}</p>
              {space.drawingData && <img src={space.drawingData} alt={`Drawing for ${space.name}`} className="w-full h-auto max-h-48 object-contain rounded-md border border-brand-border mt-2"/>}

              {/* Wall Measurements Table */}
              {space.wallMeasurements && space.wallMeasurements.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-brand-muted mb-1">{t("s3.walls")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {space.wallMeasurements.map((wall) => (
                      <div key={wall.label} className="flex items-center gap-2 bg-white rounded-md border border-brand-border px-3 py-2">
                        <span className="text-brand-copper font-bold text-sm">{wall.label}</span>
                        <span className="text-brand-espresso text-sm">{wall.length || '—'} {space.unit || 'in'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              {(space.totalPerimeter || space.totalArea) ? (
                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <p>
                    <strong>{t("s3.perimeter")}</strong>{" "}
                    {(space.totalPerimeter ?? 0).toFixed(2)} {space.unit || 'in'}
                  </p>
                  <p>
                    <strong>{t("s3.area")}</strong>{" "}
                    {(space.totalArea ?? 0).toFixed(2)} {space.unit || 'in'}²
                  </p>
                </div>
              ) : null}

              {/* Storage Priorities */}
              {space.storagePriorities && space.storagePriorities.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-brand-muted mb-1">{t("s3.storage")}</p>
                  <div className="flex flex-wrap gap-2">
                    {["Hanging", "Drawers", "Shelves"].map((option) => {
                      const rank = space.storagePriorities!.indexOf(option);
                      const color =
                        rank === 0 ? "bg-green-500" : rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-red-500" : "bg-brand-muted";
                      const label = rank === 0 ? "1st" : rank === 1 ? "2nd" : rank === 2 ? "3rd" : "—";
                      return (
                        <span key={option} className={`text-xs font-semibold text-white rounded-full px-3 py-1 ${color}`}>
                          {label === "—" ? t("s2." + option.toLowerCase()) : `${label} · ${t("s2." + option.toLowerCase())}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {additionalNotes && (
          <div className="pb-4 border-b border-brand-border">
            <h3 className="font-semibold text-brand-espresso">{t("s3.notes")}</h3>
            <p>{additionalNotes}</p>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-brand-espresso">{t("s3.files")}</h3>
          <p>{files.length} {t("s3.filesCount")}</p>
        </div>
      </div>

      {/* Submit — never blocked on booking a time */}
      {!hasSubmitted && (
        <div className="rounded-lg border border-brand-copper/30 bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <p className="text-sm text-brand-muted">{t("s3.submitHelp")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 border border-brand-copper text-brand-copper text-sm font-medium px-5 py-3 rounded-full hover:bg-brand-copper hover:text-white transition-colors disabled:opacity-50"
            >
              {t("s3.submit")}
            </button>
            <button
              type="button"
              onClick={scrollToBooking}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 bg-brand-copper hover:bg-brand-copper-dark text-white text-sm font-medium px-5 py-3 rounded-full transition-colors disabled:opacity-50"
            >
              {t("s3.submitBookNow")}
            </button>
          </div>
        </div>
      )}

      {/* Calendly Scheduling (embedded, not an external link) — optional, shown after the summary */}
      <div ref={bookingSectionRef} className="rounded-lg border border-brand-border overflow-hidden scroll-mt-24">
        <div className="px-4 py-3 bg-brand-sand/50 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-semibold text-brand-espresso">{t("s3.schedule")}</h3>
          {isScheduled && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle size={16} /> {t("s3.scheduled")}
            </span>
          )}
        </div>
        <div className="relative bg-white" style={{ minWidth: "320px", height: "700px" }}>
          {/* Loading overlay — a sibling, NOT a child of the Calendly container,
              so React never touches the injected iframe. */}
          {!calendlyReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="flex items-center gap-2 text-sm text-brand-muted">
                <Loader2 className="w-4 h-4 animate-spin text-brand-copper" /> {t("s3.loadingScheduler")}
              </span>
            </div>
          )}
          {/* Calendly injects its iframe here. Keep this div empty (no children). */}
          <div ref={calendlyContainerRef} className="w-full h-full" />
        </div>
      </div>

      {/* Navigation (floating) */}
      <WizardNav
        left={
          <button onClick={onBack} disabled={isSubmitting} className="inline-flex items-center gap-1 px-2 sm:px-3 py-3 text-sm font-medium text-brand-muted hover:text-brand-espresso transition-colors disabled:opacity-50">{t("s3.back")}</button>
        }
        right={
          isSubmitting ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-copper">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("s3.submitting")}
            </span>
          ) : hasSubmitted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle className="w-4 h-4" /> {t("s3.submitted")}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-brand-muted text-right max-w-[240px] leading-snug">
              {t("s3.bookHint")}
            </span>
          )
        }
      />
    </div>
  );
};
