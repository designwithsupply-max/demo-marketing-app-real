import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { imageService, type BeforeAfterItem } from "@/lib/imageService";

const TYPES = ["closet", "kitchen", "garage", "other"] as const;

export const BeforeAfterManager = () => {
  const [items, setItems] = useState<BeforeAfterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("closet");
  const [beforeLabel, setBeforeLabel] = useState("");
  const [afterLabel, setAfterLabel] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [projectDate, setProjectDate] = useState("");
  const [statValue, setStatValue] = useState("");
  const [statLabel, setStatLabel] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setItems(await imageService.fetchBeforeAfter());
    } catch (e) {
      toast.error("Failed to load before/after items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setTitle(""); setDescription(""); setType("closet");
    setBeforeLabel(""); setAfterLabel(""); setTagline("");
    setLocation(""); setProjectDate(""); setStatValue(""); setStatLabel("");
    setBeforeFile(null); setAfterFile(null);
    if (beforeRef.current) beforeRef.current.value = "";
    if (afterRef.current) afterRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!title.trim()) return toast.error("Please enter a title");
    if (!beforeFile || !afterFile) return toast.error("Please choose both a before and an after image");
    setUploading(true);
    try {
      await imageService.uploadBeforeAfter(beforeFile, afterFile, {
        title: title.trim(),
        description,
        type,
        before_label: beforeLabel.trim() || undefined,
        after_label: afterLabel.trim() || undefined,
        tagline: tagline.trim() || undefined,
        location: location.trim() || undefined,
        project_date: projectDate.trim() || undefined,
        stat_value: statValue.trim() || undefined,
        stat_label: statLabel.trim() || undefined,
      });
      toast.success("Before/after added");
      reset();
      await load();
    } catch (e) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: BeforeAfterItem) => {
    try {
      await imageService.deleteItem(item.id, "before_after", [item.before_public_id, item.after_public_id]);
      toast.success("Deleted");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-brand-border bg-white">
        <h3 className="text-lg font-semibold text-brand-espresso mb-1">Add a before / after</h3>
        <p className="text-sm text-brand-muted mb-5">
          These appear in the “Transformations” slider on the homepage. Upload a matching pair of photos taken from the same angle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Before image</Label>
            <Input ref={beforeRef} type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>After image</Label>
            <Input ref={afterRef} type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Master walk-in closet" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short caption" />
          </div>

          <div className="space-y-2">
            <Label>Before label (optional)</Label>
            <Input value={beforeLabel} onChange={(e) => setBeforeLabel(e.target.value)} placeholder="e.g. Cluttered Before" />
          </div>
          <div className="space-y-2">
            <Label>After label (optional)</Label>
            <Input value={afterLabel} onChange={(e) => setAfterLabel(e.target.value)} placeholder="e.g. Transformed After" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tagline (optional)</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Cluttered Before → Transformed After" />
          </div>
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Laval, QC" />
          </div>
          <div className="space-y-2">
            <Label>Date (optional)</Label>
            <Input value={projectDate} onChange={(e) => setProjectDate(e.target.value)} placeholder="e.g. January 2025" />
          </div>
          <div className="space-y-2">
            <Label>Stat value (optional)</Label>
            <Input value={statValue} onChange={(e) => setStatValue(e.target.value)} placeholder="e.g. 3x" />
          </div>
          <div className="space-y-2">
            <Label>Stat label (optional)</Label>
            <Input value={statLabel} onChange={(e) => setStatLabel(e.target.value)} placeholder="e.g. more storage" />
          </div>
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="mt-5 bg-brand-copper text-white hover:bg-brand-copper-dark">
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading..." : "Add before / after"}
        </Button>
      </Card>

      <Card className="p-6 border-brand-border bg-white">
        <h3 className="text-lg font-semibold text-brand-espresso mb-4">
          Existing pairs {loading ? "" : `(${items.length})`}
        </h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-brand-muted">Nothing yet. Add your first pair above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border border-brand-border rounded-lg overflow-hidden bg-brand-sand/30">
                <div className="grid grid-cols-2">
                  <div className="relative aspect-[4/3]">
                    <img src={item.before_image_url} alt="before" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 text-[10px] bg-brand-espresso/80 text-white px-1.5 py-0.5 rounded">BEFORE</span>
                  </div>
                  <div className="relative aspect-[4/3]">
                    <img src={item.after_image_url} alt="after" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 text-[10px] bg-brand-copper text-white px-1.5 py-0.5 rounded">AFTER</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-espresso truncate">{item.title}</p>
                    <p className="text-xs text-brand-muted capitalize">{item.type}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete before/after pair</AlertDialogTitle>
                        <AlertDialogDescription>This permanently deletes "{item.title}". This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BeforeAfterManager;
