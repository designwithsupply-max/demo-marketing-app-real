import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Film } from "lucide-react";
import { toast } from "sonner";
import { videoService, type ProjectVideo, type ProjectVideoType } from "@/lib/videoService";

const TYPES: ProjectVideoType[] = ["closet", "kitchen", "garage", "other"];
const MAX_VIDEO_MB = 200;

export const VideoManager = () => {
  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectVideoType>("closet");
  const [city, setCity] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setVideos(await videoService.fetchAllProjectVideos());
    } catch (e) {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setTitle(""); setDescription(""); setType("closet");
    setCity(""); setTranscript("");
    setVideoFile(null); setThumbFile(null);
    if (videoRef.current) videoRef.current.value = "";
    if (thumbRef.current) thumbRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!title.trim()) return toast.error("Please enter a title");
    if (!videoFile) return toast.error("Please choose a video file");
    if (videoFile.size > MAX_VIDEO_MB * 1024 * 1024)
      return toast.error(`Video is over the ${MAX_VIDEO_MB} MB limit`);
    setUploading(true);
    try {
      await videoService.uploadProjectVideo(videoFile, thumbFile, { title: title.trim(), description, type, city, transcript });
      toast.success("Video added");
      reset();
      await load();
    } catch (e) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: ProjectVideo) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await videoService.deleteProjectVideo(video);
      toast.success("Deleted");
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-brand-border bg-white">
        <h3 className="text-lg font-semibold text-brand-espresso mb-1">Add a project video</h3>
        <p className="text-sm text-brand-muted mb-2">
          Videos appear in the “Project Videos” section on the Gallery page. A poster image is optional but recommended. Max {MAX_VIDEO_MB} MB per video.
        </p>
        <p className="text-xs text-brand-muted mb-5 bg-brand-sand/50 border border-brand-border rounded-md px-3 py-2">
          Compress before uploading so the site stays fast — H.264 MP4, roughly 1080p, aiming well under the {MAX_VIDEO_MB} MB limit. Free tools: HandBrake or CloudConvert.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Video file</Label>
            <Input ref={videoRef} type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>Poster / thumbnail (optional)</Label>
            <Input ref={thumbRef} type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk-in closet reveal" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProjectVideoType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>City / Location (optional)</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Laval, QC" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short caption" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Transcript (optional)</Label>
            <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Short transcript of what's said in the video, for accessibility." rows={3} />
          </div>
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="mt-5 bg-brand-copper text-white hover:bg-brand-copper-dark">
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Film className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading..." : "Add video"}
        </Button>
      </Card>

      <Card className="p-6 border-brand-border bg-white">
        <h3 className="text-lg font-semibold text-brand-espresso mb-4">
          Uploaded videos {loading ? "" : `(${videos.length})`}
        </h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-copper" /></div>
        ) : videos.length === 0 ? (
          <p className="text-sm text-brand-muted">No videos yet. Add your first one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div key={v.id} className="border border-brand-border rounded-lg overflow-hidden bg-brand-sand/30">
                <div className="aspect-video bg-black">
                  <video controls preload="metadata" poster={v.thumbnail_url ?? undefined} className="w-full h-full object-cover">
                    <source src={v.video_url} />
                  </video>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-espresso truncate">{v.title}</p>
                    <p className="text-xs text-brand-muted capitalize">{v.type}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(v)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default VideoManager;
