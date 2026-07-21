import { useRef, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { imageService } from "@/lib/imageService";

/** Shared form-field helpers used by the admin content editors. */

export const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="border-brand-border" />
  </div>
);

export const AreaField = ({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="border-brand-border" />
  </div>
);

export const ImageField = ({
  label,
  value,
  onChange,
  folder = "site-content",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Storage sub-folder in the `images` bucket that device uploads land in. */
  folder?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const { url } = await imageService.uploadImage(file, folder);
      onChange(url);
      toast.success("Image uploaded.");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.15em] text-brand-muted">{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="w-16 h-16 rounded-md object-cover border border-brand-border flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-md border border-dashed border-brand-border flex-shrink-0" />
        )}
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL, or upload from your device →" className="border-brand-border" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 border-brand-border text-brand-espresso hover:bg-brand-sand"
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
};

export const SectionCard = ({ title, description, saving, onSave, children }: { title: string; description?: string; saving: boolean; onSave: () => void; children: React.ReactNode }) => (
  <Card className="p-6 border-brand-border bg-white space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-espresso" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</h2>
        {description && <p className="text-sm text-brand-muted mt-0.5">{description}</p>}
      </div>
      <Button onClick={onSave} disabled={saving} className="bg-brand-copper text-white hover:bg-brand-copper-dark flex-shrink-0">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save
      </Button>
    </div>
    <div className="space-y-4">{children}</div>
  </Card>
);
