import { useState, useEffect } from "react";
import { PlannerHeader } from "@/components/wizard/PlannerHeader";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { SeoHead } from "@/components/seo/SeoHead";
import { StepOne } from "@/components/wizard/StepOne";
import { StepTwo } from "@/components/wizard/StepTwo";
import { StepThree } from "@/components/wizard/StepThree";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw, X } from "lucide-react";

export interface UploadedFile {
  id: string;
  /** Name/size/type are kept separately from `file` so a restored draft (which
   *  has no `File` object) still renders in the list and counts toward quota. */
  name: string;
  size: number;
  type: string;
  preview: string;
  uploadStatus: "pending" | "uploading" | "success" | "error";
  filePath?: string;
  /** Absent for entries rehydrated from a previous visit. */
  file?: File;
}

export interface Space {
  id: string;
  name: string;
  type: "Closet" | "Kitchen" | "Garage";
  ceilingHeight: string;
  /**
   * How this space's measurements were captured. Unset until the customer
   * picks one of the 3 Step-2 options. "upload" means they chose not to draw —
   * wall measurements aren't required for that space, since we'll work from
   * photos/video instead.
   */
  inputMethod?: "shape" | "draw" | "upload";
  drawingData?: string;
  wallMeasurements?: Array<{ label: string; length: string }>;
  unit?: "cm" | "in";
  totalPerimeter?: number;
  totalArea?: number;
  /** Chosen predetermined layout template id (e.g. "k-galley", "c-double"). */
  layout?: string;
  /** Storage priorities in tap order: index 0 = 1st (green), 1 = 2nd (yellow), 2 = 3rd (red). */
  storagePriorities?: string[];
  /**
   * The editable (vector) form of the drawing, as produced by DrawingCanvas.
   * `drawingData` is only a flat PNG for the summary and the admin dashboard —
   * this is what lets a returning visitor keep drawing where they left off.
   */
  canvasJson?: any;
}

const STORAGE_KEYS = {
  step: "wizardStep",
  formData: "wizardFormData",
  spaces: "wizardSpaces",
  notes: "wizardNotes",
  files: "wizardFiles",
};

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  postalCode: "",
};

/** Read + parse a saved value, tolerating anything corrupt left behind. */
const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Persist, but never let a full/blocked localStorage (private browsing, quota
 * exceeded by a large drawing) throw and take the planner down with it.
 */
const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Could not save "${key}" — the draft may not survive a refresh.`, err);
  }
};

const Wizard = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEYS.step) ?? "", 10);
    return Number.isFinite(saved) && saved >= 0 && saved <= 2 ? saved : 0;
  });

  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM,
    ...readJson(STORAGE_KEYS.formData, {}),
  }));

  const [spaces, setSpaces] = useState<Space[]>(() => readJson<Space[]>(STORAGE_KEYS.spaces, []));

  // Only files that finished uploading are restorable: the browser can't hand a
  // `File` object back after a reload, but the copy already in Supabase storage
  // is all the submission actually needs.
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    readJson<UploadedFile[]>(STORAGE_KEYS.files, []).map((f) => ({
      ...f,
      file: undefined,
      preview:
        f.filePath
          ? supabase.storage.from("images").getPublicUrl(f.filePath).data.publicUrl
          : f.preview,
    })),
  );

  const [additionalNotes, setAdditionalNotes] = useState(
    () => localStorage.getItem(STORAGE_KEYS.notes) || "",
  );

  // A draft is worth mentioning only if there's real work in it.
  const [showResumed, setShowResumed] = useState(
    () => readJson<Space[]>(STORAGE_KEYS.spaces, []).length > 0,
  );

  // Lets the SalesCaptain chat launcher (mounted globally, see App.tsx) know to
  // move above the wizard's own fixed bottom action bar instead of covering it.
  useEffect(() => {
    document.body.classList.add("wizard-active");
    return () => document.body.classList.remove("wizard-active");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.step, currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.formData, formData);
  }, [formData]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.spaces, spaces);
  }, [spaces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notes, additionalNotes);
  }, [additionalNotes]);

  useEffect(() => {
    // `file` and blob: previews are per-session, so they're stripped on the way out.
    writeJson(
      STORAGE_KEYS.files,
      files
        .filter((f) => f.uploadStatus === "success" && f.filePath)
        .map(({ file, preview, ...rest }) => rest),
    );
  }, [files]);

  const clearStorage = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  const handleComplete = () => {
    // The project is safely stored server-side now, so the local draft can go —
    // but we deliberately do NOT navigate away. StepThree shows its own
    // confirmation screen (title, next steps, book/home/text-us actions) and the
    // customer decides when to leave, instead of being redirected off the page
    // before they can read the confirmation.
    clearStorage();
    localStorage.setItem("planner_submitted", "true");
  };

  return (
    // overflow-x-clip stops the drawing canvas (which can be a touch wider than
    // its container on small screens) from pushing the whole page sideways. The
    // canvas keeps its own internal horizontal scroll; the fixed bottom nav is
    // unaffected since fixed elements aren't clipped by an ancestor's overflow.
    <div className="min-h-screen bg-brand-cream overflow-x-clip">
      <SeoHead
        title="3-Step Space Planner | Design & Supply"
        description="Enter your details, draw your space, upload photos, and submit for a live online CAD design call."
      />
      <PlannerHeader />
      <div className="pt-8 pb-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-3">
              {t("wz.eyebrow")}
            </span>
            <h1
              className="text-brand-espresso font-light leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              }}
            >
              {t("wz.title")}
            </h1>
          </div>

          {/* Returning visitors: make it obvious their work is still here. */}
          {showResumed && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-copper/40 bg-brand-copper/10 px-4 py-3">
              <RotateCcw className="w-4 h-4 mt-0.5 text-brand-copper flex-shrink-0" />
              <p className="flex-1 text-sm text-brand-espresso">
                <span className="font-semibold">{t("wz.welcomeBack")}</span>{" "}
                {t("wz.welcomeBackBody").replace(
                  "{spaces}",
                  spaces.length === 1 ? t("wz.savedSpace") : t("wz.savedSpaces").replace("{count}", String(spaces.length))
                )}{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(t("wz.startOverConfirm"))) return;
                    clearStorage();
                    setSpaces([]);
                    setFiles([]);
                    setAdditionalNotes("");
                    setFormData(INITIAL_FORM);
                    setCurrentStep(0);
                    setShowResumed(false);
                  }}
                  className="underline font-medium hover:text-brand-copper-dark"
                >
                  {t("wz.startOver")}
                </button>
                .
              </p>
              <button
                type="button"
                onClick={() => setShowResumed(false)}
                aria-label={t("wz.dismiss")}
                className="text-brand-muted hover:text-brand-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <ProgressBar currentStep={currentStep} totalSteps={3} />

          <div className="bg-white rounded-2xl border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] p-6 md:p-10">
            {currentStep === 0 && (
              <StepOne
                formData={formData}
                setFormData={setFormData}
                spaces={spaces}
                setSpaces={setSpaces}
                onNext={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 1 && (
              <StepTwo
                formData={formData}
                spaces={spaces}
                setSpaces={setSpaces}
                files={files}
                setFiles={setFiles}
                additionalNotes={additionalNotes}
                setAdditionalNotes={setAdditionalNotes}
                onNext={() => setCurrentStep(2)}
                onBack={() => setCurrentStep(0)}
              />
            )}

            {currentStep === 2 && (
              <StepThree
                formData={formData}
                spaces={spaces}
                files={files}
                additionalNotes={additionalNotes}
                onBack={() => setCurrentStep(1)}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
