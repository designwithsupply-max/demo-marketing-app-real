import { supabase } from "@/integrations/supabase/client";
import { storageService } from "./storageService";

// project_videos is not in the generated Supabase types yet, so we access it
// through an untyped handle. All row shapes are typed locally below.
const db = supabase as unknown as {
  from: (table: string) => any;
};

export const VIDEO_BUCKET = "videos";
export const IMAGE_BUCKET = "images";

export type ProjectVideoType = "closet" | "kitchen" | "garage" | "other";

export interface ProjectVideo {
  id: string;
  title: string;
  description: string | null;
  type: ProjectVideoType;
  city: string | null;
  transcript: string | null;
  video_url: string;
  video_public_id: string;
  thumbnail_url: string | null;
  thumbnail_public_id: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

const sanitize = (name: string) => name.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "");

export const videoService = {
  /** Active videos for the public gallery page. */
  async fetchProjectVideos(): Promise<ProjectVideo[]> {
    const { data, error } = await db
      .from("project_videos")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProjectVideo[];
  },

  /** All videos (incl. inactive) for the admin manager. */
  async fetchAllProjectVideos(): Promise<ProjectVideo[]> {
    const { data, error } = await db
      .from("project_videos")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProjectVideo[];
  },

  /** Upload a video (and optional poster thumbnail) then insert the DB row. */
  async uploadProjectVideo(
    videoFile: File,
    thumbFile: File | null,
    data: { title: string; description?: string; type: ProjectVideoType; city?: string; transcript?: string },
  ): Promise<void> {
    const ts = Date.now();
    const videoPath = `projects/${ts}-${sanitize(videoFile.name)}`;
    const { url: videoUrl, path: videoId } = await storageService.uploadFile(
      videoFile,
      VIDEO_BUCKET,
      videoPath,
    );

    let thumbUrl: string | null = null;
    let thumbId: string | null = null;
    if (thumbFile) {
      try {
        const thumbPath = `video-thumbs/${ts}-${sanitize(thumbFile.name)}`;
        const r = await storageService.uploadFile(thumbFile, IMAGE_BUCKET, thumbPath);
        thumbUrl = r.url;
        thumbId = r.path;
      } catch (e) {
        // thumbnail is optional — ignore failures
        console.error("Thumbnail upload failed (continuing without it):", e);
      }
    }

    const { error } = await db.from("project_videos").insert({
      title: data.title,
      description: data.description || null,
      type: data.type,
      city: data.city || null,
      transcript: data.transcript || null,
      video_url: videoUrl,
      video_public_id: videoId,
      thumbnail_url: thumbUrl,
      thumbnail_public_id: thumbId,
      is_active: true,
      order_index: 0,
    });

    if (error) {
      await storageService.deleteFile(VIDEO_BUCKET, videoId).catch(() => {});
      if (thumbId) await storageService.deleteFile(IMAGE_BUCKET, thumbId).catch(() => {});
      throw error;
    }
  },

  async deleteProjectVideo(video: ProjectVideo): Promise<void> {
    await storageService.deleteFile(VIDEO_BUCKET, video.video_public_id).catch(() => {});
    if (video.thumbnail_public_id) {
      await storageService.deleteFile(IMAGE_BUCKET, video.thumbnail_public_id).catch(() => {});
    }
    const { error } = await db.from("project_videos").delete().eq("id", video.id);
    if (error) throw error;
  },
};
