import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { Space, UploadedFile } from "@/pages/Wizard";
import { DrawingCanvas } from "./DrawingCanvas";
import { WizardNav } from "./WizardNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, X, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepTwoProps {
  formData: any;
  spaces: Space[];
  setSpaces: Dispatch<SetStateAction<Space[]>>;
  files: UploadedFile[];
  setFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

// Upload limits (tune these to match your Supabase storage / plan limits)
const MAX_FILE_SIZE_MB = 50;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export const StepTwo = ({ spaces, setSpaces, files, setFiles, additionalNotes, setAdditionalNotes, onNext, onBack, formData }: StepTwoProps) => {
  const { t } = useLanguage();
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(spaces.length > 0 ? spaces[0].id : null);
  // Adopt the unit the saved spaces were measured in, so a restored draft
  // doesn't silently re-label centimetre measurements as inches.
  const [unit, setUnit] = useState<"cm" | "in">(spaces[0]?.unit ?? "in");
  const [spacesError, setSpacesError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const addSpace = () => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name: `New Space ${spaces.length + 1}`,
      type: "Closet",
      ceilingHeight: unit === "in" ? "96" : "244",
      unit,
      storagePriorities: [],
    };
    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
    setSpacesError("");
  };

  const removeSpace = (id: string) => {
    setSpaces(prev => prev.filter((s) => s.id !== id));
    setActiveSpaceId(prev => {
      if (prev !== id) return prev;
      const remaining = spaces.filter((s) => s.id !== id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  };

  const updateSpace = (id: string, field: keyof Space, value: string) => {
    setSpaces(prev => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // Storage priorities: 1st tap = GREEN (1st), 2nd tap = YELLOW (2nd).
  // Anything that is not one of your top two automatically shows RED.
  const STORAGE_OPTIONS = ["Hanging", "Drawers", "Shelves"];
  const ORDINALS = ["1st", "2nd"];

  const togglePriority = (spaceId: string, option: string) => {
    setSpaces(prev => prev.map((s) => {
      if (s.id !== spaceId) return s;
      const current = s.storagePriorities ?? [];
      const idx = current.indexOf(option);
      let next: string[];
      if (idx >= 0) {
        // deselect -> it drops back to red, remaining picks re-rank
        next = current.filter((o) => o !== option);
      } else if (current.length < 2) {
        // 1st pick -> green, 2nd pick -> yellow
        next = [...current, option];
      } else {
        // already have a 1st and 2nd: pressing a red one makes it the new 2nd (yellow)
        next = [current[0], option];
      }
      return { ...s, storagePriorities: next };
    }));
  };

  const INCH_TO_CM = 2.54;

  const convertValue = (value: string, fromUnit: "cm" | "in", toUnit: "cm" | "in") => {
    if (fromUnit === toUnit) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    const converted = fromUnit === "in" ? num * INCH_TO_CM : num / INCH_TO_CM;
    return (Math.round(converted * 100) / 100).toString();
  };

  const handleUnitChange = (newUnit: "cm" | "in") => {
    if (newUnit === unit) return;
    setSpaces(prev => prev.map(s => ({
      ...s,
      unit: newUnit,
      ceilingHeight: convertValue(s.ceilingHeight, unit, newUnit),
      wallMeasurements: s.wallMeasurements
        ? s.wallMeasurements.map(w => ({ ...w, length: convertValue(w.length, unit, newUnit) }))
        : s.wallMeasurements,
    })));
    setUnit(newUnit);
  };

  const handleDrawingComplete = useCallback((
    spaceId: string,
    dataUrl: string,
    wallMeasurements: { label: string; length: string }[],
    totalPerimeter: number,
    totalArea: number,
    canvasJson: any,
  ) => {
    setSpaces(prev => prev.map(s =>
      s.id === spaceId
        ? { ...s, drawingData: dataUrl, wallMeasurements, totalPerimeter, totalArea, canvasJson }
        : s
    ));
  }, [setSpaces]);

  const isFormValid = () => {
    if (spaces.length === 0) return false;
    if (files.some(f => f.uploadStatus === "uploading")) return false;

    for (const space of spaces) {
      if (!space.name || space.name.trim() === "") return false;

      const ceilingHeight = parseFloat(space.ceilingHeight);
      if (!ceilingHeight || ceilingHeight <= 0) return false;

      if (space.wallMeasurements && space.wallMeasurements.length > 0) {
        for (const wall of space.wallMeasurements) {
          if (!wall.length || wall.length.trim() === "") return false;
          const length = parseFloat(wall.length);
          if (isNaN(length) || length <= 0) return false;
        }
      } else {
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (spaces.length === 0) {
      setSpacesError(t("s2.tAddOne"));
      toast.error(t("s2.tAddOne"));
      return;
    }
    setSpacesError("");
    if (files.some(f => f.uploadStatus === "uploading")) {
      toast.error(t("s2.tUploading"));
      return;
    }
    for (const space of spaces) {
      if (!space.name || space.name.trim() === "") {
        toast.error(t("s2.tName"));
        return;
      }
      const ceilingHeight = parseFloat(space.ceilingHeight);
      if (!ceilingHeight || ceilingHeight <= 0) {
        toast.error(t("s2.tCeiling"));
        return;
      }
      if (!space.wallMeasurements || space.wallMeasurements.length === 0) {
        toast.error(t("s2.tDraw"));
        return;
      }
      for (const wall of space.wallMeasurements) {
        if (!wall.length || wall.length.trim() === "") {
          toast.error(t("s2.tWalls"));
          return;
        }
        const length = parseFloat(wall.length);
        if (isNaN(length) || length <= 0) {
          toast.error(t("s2.tWallNums"));
          return;
        }
      }
    }
    onNext();
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const userEmail = formData.email || "anonymous";
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, "_");
    const filePath = `submissions/${safeEmail}/${fileName}`;

    const { error } = await supabase.storage.from("images").upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
    let runningTotal = usedBytes;
    const accepted: File[] = [];
    const errors: string[] = [];

    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`"${f.name}" (${formatBytes(f.size)}) is over the ${MAX_FILE_SIZE_MB} MB per-file limit.`);
        continue;
      }
      if (runningTotal + f.size > MAX_TOTAL_SIZE) {
        errors.push(`"${f.name}" (${formatBytes(f.size)}) would exceed the ${MAX_TOTAL_SIZE_MB} MB total upload limit.`);
        continue;
      }
      runningTotal += f.size;
      accepted.push(f);
    }

    // Reset the input so the same file can be re-selected after fixing an error.
    e.target.value = "";

    if (errors.length > 0) {
      setUploadError(errors.join(" "));
      toast.error(errors[0]);
    } else {
      setUploadError("");
    }

    if (accepted.length === 0) return;

    const newFiles: UploadedFile[] = accepted.map(f => ({
      file: f,
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      preview: URL.createObjectURL(f),
      uploadStatus: "pending" as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(async (uploadedFile) => {
      setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "uploading" } : f));
      try {
        const filePath = await uploadFileToSupabase(uploadedFile.file!);
        setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "success", filePath } : f));
      } catch (error) {
        toast.error(`${t("s2.tFailUpload")} ${uploadedFile.name}`);
        setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, uploadStatus: "error" } : f));
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {t("s2.title")}
        </h2>
        <p className="text-brand-muted mt-1">{t("s2.subtitle")}</p>
      </div>

      {/* Your Spaces */}
      <div>
        {/* <h3 className="text-xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t("s2.yourSpaces")}</h3>
        <p className="text-brand-muted mt-1">{t("s2.yourSpacesDesc")}</p> */}
        {spacesError && <p className="text-xs text-red-500 mt-2">{spacesError}</p>}

        <div className="space-y-4 mt-4">
          {spaces.map((space) => (
            <div key={space.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-brand-sand/50 rounded-lg border border-brand-border">
              <input
                type="text"
                value={space.name}
                onChange={(e) => updateSpace(space.id, "name", e.target.value)}
                placeholder={t("s2.spaceNamePh")}
                className={`flex-grow min-w-0 bg-transparent focus:outline-none text-brand-espresso placeholder:text-red-400 ${!space.name || space.name.trim() === "" ? "border-b border-red-400" : ""
                  }`}
              />
              <select
                value={space.type}
                onChange={(e) => updateSpace(space.id, "type", e.target.value as Space["type"])}
                className="flex-shrink-0 bg-transparent focus:outline-none text-brand-muted"
              >
                <option value="Closet">{t("s2.closet")}</option>
                <option value="Kitchen">{t("s2.kitchen")}</option>
                <option value="Garage">{t("s2.garage")}</option>
              </select>
              <button
                type="button"
                onClick={() => removeSpace(space.id)}
                aria-label="Remove space"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-100/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSpace}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-copper hover:text-brand-copper-dark transition-colors"
        >
          <Plus size={16} />
          {t("s2.addAnother")}
        </button>
        <p className="mt-2 text-xs font-medium tracking-[0.18em] uppercase text-brand-muted">
          {t("s2.cats")}
        </p>
      </div>

      {spaces.length === 0 ? (
        <p className="text-sm text-brand-muted">{t("s2.addAbove")}</p>
      ) : (
        <>
          {/* Space Tabs + Unit Toggle */}
          <div className="flex items-center justify-between border-b border-brand-border">
            <div className="flex items-center">
              {spaces.map(space => (
                <button
                  key={space.id}
                  onClick={() => setActiveSpaceId(space.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeSpaceId === space.id ? 'border-b-2 border-brand-copper text-brand-copper' : 'text-brand-muted hover:text-brand-espresso'}`}>
                  {space.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pr-2">
              <span className="text-xs text-brand-muted">{t("s2.unit")}</span>
              <button
                onClick={() => handleUnitChange("in")}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${unit === "in" ? 'bg-brand-copper text-white' : 'bg-brand-sand text-brand-muted hover:text-brand-espresso'}`}
              >
                in
              </button>
              <button
                onClick={() => handleUnitChange("cm")}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${unit === "cm" ? 'bg-brand-copper text-white' : 'bg-brand-sand text-brand-muted hover:text-brand-espresso'}`}
              >
                cm
              </button>
            </div>
          </div>

          {/* Active Space Content */}
          {spaces.map(space => (
            <div key={space.id} className={activeSpaceId === space.id ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-muted">
                    {t("s2.ceiling")} ({unit}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={space.ceilingHeight}
                    onChange={(e) => setSpaces(prev => prev.map(s => s.id === space.id ? { ...s, ceilingHeight: e.target.value } : s))}
                    className={`w-full p-2 border rounded-md focus:ring-brand-copper focus:border-brand-copper ${!space.ceilingHeight || parseFloat(space.ceilingHeight) <= 0 ? "border-red-400" : "border-brand-border"
                      }`}
                  />
                </div>
              </div>

              <DrawingCanvas
                spaceId={space.id}
                unit={unit}
                spaceType={space.type}
                // Put back whatever this visitor drew last time they were here.
                initialCanvasJson={space.canvasJson}
                initialWallMeasurements={space.wallMeasurements}
                onDrawingComplete={(dataUrl, wallMeasurements, totalPerimeter, totalArea, canvasJson) =>
                  handleDrawingComplete(space.id, dataUrl, wallMeasurements, totalPerimeter, totalArea, canvasJson)
                }
              />

              {/* Storage priorities */}
              <div className="mt-8 space-y-2">
                <h4 className="text-lg font-semibold text-brand-espresso">{t("s2.storage")}</h4>
                <p className="text-sm text-brand-muted">{t("s2.storageHelp")}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {STORAGE_OPTIONS.map((option) => {
                    const rank = (space.storagePriorities ?? []).indexOf(option);
                    const style =
                      rank === 0
                        ? "bg-green-500 text-white border-green-500"
                        : rank === 1
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : "bg-red-500 text-white border-red-500";
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => togglePriority(space.id, option)}
                        className={`px-5 py-3 rounded-lg border-2 font-medium transition-all ${style}`}
                      >
                        {t("s2." + option.toLowerCase())}
                        {rank >= 0 && <span className="ml-1.5 opacity-90">({ORDINALS[rank]})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* File Uploader */}
      <div className="space-y-4 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-brand-espresso">{t("s2.uploadTitle")}</h3>
          <p className="text-xs text-brand-muted">
            {t("s2.max")} <span className="font-semibold text-brand-espresso">{MAX_FILE_SIZE_MB}  MB</span> {t("s2.perFile")}
            {" · "}
            <span className="font-semibold text-brand-espresso">{MAX_TOTAL_SIZE_MB} MB</span> {t("s2.totalWord")}
          </p>
        </div>

        <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-brand-border rounded-lg p-10 cursor-pointer hover:bg-brand-sand/50 transition-colors">
          <Upload className="w-8 h-8 text-brand-copper" />
          <p className="font-medium text-brand-espresso">{t("s2.browse")}</p>
          <p className="text-sm text-brand-muted">{t("s2.uploadHintA")} {MAX_FILE_SIZE_MB} {t("s2.mbEach")}</p>
        </label>

        {/* Error message when a file is too large */}
        {uploadError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Capacity meter */}
        {(() => {
          const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
          const remaining = Math.max(0, MAX_TOTAL_SIZE - usedBytes);
          const pct = Math.min(100, (usedBytes / MAX_TOTAL_SIZE) * 100);
          const nearFull = pct >= 90;
          return (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>{t("s2.used")} <span className="font-semibold text-brand-espresso">{formatBytes(usedBytes)}</span> {t("s2.of")} {MAX_TOTAL_SIZE_MB} MB</span>
                <span>{t("s2.remaining")} <span className={`font-semibold ${nearFull ? "text-red-600" : "text-brand-espresso"}`}>{formatBytes(remaining)}</span></span>
              </div>
              <div className="h-2 w-full rounded-full bg-brand-sand overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${nearFull ? "bg-red-500" : "bg-brand-copper"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-brand-sand/50 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                {file.type.startsWith('image/') ? <img src={file.preview} alt="preview" className="w-10 h-10 object-cover rounded flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-brand-sand flex items-center justify-center flex-shrink-0"><Upload size={20} /></div>}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-espresso truncate">{file.name}</p>
                  <p className="text-xs text-brand-muted">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {file.uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-brand-copper" />}
                {file.uploadStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {file.uploadStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                <button onClick={() => removeFile(file.id)}><X size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2 pt-8">
        <label className="text-lg font-semibold text-brand-espresso">{t("s2.notes")}</label>
        <textarea
          value={additionalNotes}
          onChange={e => setAdditionalNotes(e.target.value)}
          rows={4}
          className="w-full p-2 border border-brand-border rounded-md focus:ring-brand-copper focus:border-brand-copper"
          placeholder={t("s2.notesPh")}
        />
      </div>

      {/* Navigation (floating) */}
      <WizardNav
        left={
          <button onClick={onBack} className="inline-flex items-center gap-1 px-2 sm:px-3 py-3 text-sm font-medium text-brand-muted hover:text-brand-espresso transition-colors">{t("s2.back")}</button>
        }
        right={
          <button
            onClick={handleNext}
            disabled={!isFormValid()}
            className={`inline-flex items-center justify-center gap-3 text-[11px] sm:text-sm tracking-[0.1em] sm:tracking-[0.2em] uppercase font-medium px-4 sm:px-8 py-3 sm:py-4 rounded-full whitespace-nowrap transition-all duration-300 shadow-lg ${isFormValid()
                ? "bg-brand-copper text-white hover:bg-brand-copper-dark animate-wizard-pulse"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {t("s2.review")}
          </button>
        }
      />
    </div>
  );
};
