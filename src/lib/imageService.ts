import { supabase } from "@/integrations/supabase/client";
import { storageService } from "./storageService";
import {
  type ImageAsset,
  type GalleryImage,
  type SupabaseFile,
  type ServiceItem,
  type BeforeAfterItem,
  type GalleryProject,
  type GalleryProjectWithImages,
  type GalleryRow,
} from "@/types/image";

export type {
  ServiceItem,
  BeforeAfterItem,
  SupabaseFile,
  GalleryImage,
  ImageAsset,
  GalleryProject,
  GalleryProjectWithImages,
  GalleryRow,
};

export const IMAGE_BUCKET = "images";

export const IMAGE_FOLDERS = {
  GALLERY: "gallery",
  BEFORE_AFTER: "before-after",
  SERVICES: "service",
} as const;

// --------------- VIEW MODEL (for UI components) ---------------
export interface GalleryViewItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  type: "closet" | "kitchen" | "garage" | "other";
  thumbnail: string;
  images: {
    src: string;
    title: string;
    description: string;
    spec?: string;
  }[];
  description: string;
  tags: string[];
  city: string | null;
  clientNeeded: string | null;
  whatWeDesigned: string | null;
  mainFeatures: string[];
}

function projectToViewItem(
  project: GalleryProject,
  images: GalleryImage[],
): GalleryViewItem {
  const thumbnail = images.find((i) => i.is_thumbnail) || images[0];
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    type: project.type,
    thumbnail: thumbnail?.image_url ?? "",
    images: images
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        src: i.image_url,
        title: i.title,
        description: i.description ?? "",
        spec: i.spec ?? undefined,
      })),
    description: project.description ?? "",
    tags: project.tags ?? [],
    city: project.city ?? null,
    clientNeeded: project.client_needed ?? null,
    whatWeDesigned: project.what_we_designed ?? null,
    mainFeatures: project.main_features ?? [],
  };
}

export const imageService = {
  async uploadImage(
    file: File,
    folder: string,
    options?: { originalName?: string; uploadedBy?: string },
    retries = 3,
  ): Promise<{ url: string; path: string }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/\s+/g, "_")}`;
        const path = `${folder}/${fileName}`;
        const data = await storageService.uploadFile(file, IMAGE_BUCKET, path);
        return data;
      } catch (error) {
        console.error(`Upload image attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error("Upload failed after retries");
  },

  // ---------------- Gallery Projects ----------------

  async fetchGalleryProjects(): Promise<GalleryViewItem[]> {
    try {
      const { data: projects, error: projectsError } = await supabase
        .from("gallery_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const { data: allImages, error: imagesError } = await supabase
        .from("gallery")
        .select("*")
        .order("sort_order", { ascending: true });

      if (imagesError) throw imagesError;

      const imagesByProject = new Map<string, GalleryImage[]>();
      (allImages || []).forEach((img: GalleryImage) => {
        const arr = imagesByProject.get(img.project_id) || [];
        arr.push(img);
        imagesByProject.set(img.project_id, arr);
      });

      return (projects as GalleryProject[]).map((p) =>
        projectToViewItem(p, imagesByProject.get(p.id) || []),
      );
    } catch (error) {
      console.error("fetchGalleryProjects failed:", error);
      throw error;
    }
  },

  async fetchGalleryProjectBySlug(
    slug: string,
  ): Promise<GalleryViewItem | null> {
    try {
      const { data: project, error: projectsError } = await supabase
        .from("gallery_projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (projectsError) throw projectsError;
      if (!project) return null;

      const { data: images, error: imagesError } = await supabase
        .from("gallery")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true });

      if (imagesError) throw imagesError;

      return projectToViewItem(
        project as GalleryProject,
        (images || []) as GalleryImage[],
      );
    } catch (error) {
      console.error("fetchGalleryProjectBySlug failed:", error);
      throw error;
    }
  },

  // ---------------- Create / Add Images ----------------

  async createGalleryProject(
    projectData: {
      title: string;
      slug: string;
      category: string;
      type: "closet" | "kitchen" | "garage" | "other";
      description?: string;
      tags?: string[];
      city?: string;
      clientNeeded?: string;
      whatWeDesigned?: string;
      mainFeatures?: string[];
    },
    files: Array<{
      file: File;
      title: string;
      description?: string;
      spec?: string;
      isThumbnail?: boolean;
    }>,
  ): Promise<GalleryViewItem> {
    const { data: project, error: projectError } = await supabase
      .from("gallery_projects")
      .insert({
        title: projectData.title,
        slug: projectData.slug,
        category: projectData.category,
        type: projectData.type,
        description: projectData.description || null,
        tags: projectData.tags || [],
        city: projectData.city || null,
        client_needed: projectData.clientNeeded || null,
        what_we_designed: projectData.whatWeDesigned || null,
        main_features: projectData.mainFeatures || [],
      })
      .select()
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error("Failed to create project");

    const projectId = project.id;
    const uploadedImages: GalleryImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const { file, title, description, spec, isThumbnail } = files[i];
      const { url, path } = await this.uploadImage(file, IMAGE_FOLDERS.GALLERY);
      const { data: img, error: imgError } = await supabase
        .from("gallery")
        .insert({
          project_id: projectId,
          image_url: url,
          public_id: path,
          title,
          description: description || null,
          spec: spec || null,
          type: projectData.type,
          is_thumbnail: isThumbnail ?? false,
          sort_order: i,
        })
        .select()
        .single();

      if (imgError) {
        await storageService.deleteFile(IMAGE_BUCKET, path).catch(() => {});
        throw imgError;
      }
      uploadedImages.push(img as GalleryImage);
    }
    return projectToViewItem(project as GalleryProject, uploadedImages);
  },

  async addImagesToProject(
    projectId: string,
    projectType: "closet" | "kitchen" | "garage" | "other",
    files: Array<{
      file: File;
      title: string;
      description?: string;
      spec?: string;
      isThumbnail?: boolean;
    }>,
  ): Promise<GalleryImage[]> {
    const uploadedImages: GalleryImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const { file, title, description, spec, isThumbnail } = files[i];
      const { url, path } = await this.uploadImage(file, IMAGE_FOLDERS.GALLERY);
      const { data: img, error: imgError } = await supabase
        .from("gallery")
        .insert({
          project_id: projectId,
          image_url: url,
          public_id: path,
          title,
          description: description || null,
          spec: spec || null,
          type: projectType,
          is_thumbnail: isThumbnail ?? false,
          sort_order: i,
        })
        .select()
        .single();

      if (imgError) {
        await storageService.deleteFile(IMAGE_BUCKET, path).catch(() => {});
        throw imgError;
      }
      uploadedImages.push(img as GalleryImage);
    }
    return uploadedImages;
  },

  // ---------------- Edit Project ----------------
  async updateProject(
    projectId: string,
    data: {
      title?: string;
      slug?: string;
      category?: string;
      type?: string;
      description?: string;
      tags?: string[];
      city?: string;
      clientNeeded?: string;
      whatWeDesigned?: string;
      mainFeatures?: string[];
    },
  ): Promise<void> {
    const { clientNeeded, whatWeDesigned, mainFeatures, ...rest } = data;
    const { error } = await supabase
      .from("gallery_projects")
      .update({
        ...rest,
        ...(clientNeeded !== undefined ? { client_needed: clientNeeded || null } : {}),
        ...(whatWeDesigned !== undefined ? { what_we_designed: whatWeDesigned || null } : {}),
        ...(mainFeatures !== undefined ? { main_features: mainFeatures } : {}),
      } as any)
      .eq("id", projectId);
    if (error) throw error;
  },

  // ---------------- Image Reorder ----------------
  async updateImageOrder(
    items: Array<{ id: string; sort_order: number }>,
  ): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from("gallery")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
      if (error) throw error;
    }
  },

  // ---------------- Legacy / Services / BA ----------------
  async fetchGalleryLegacy(retries = 3): Promise<GalleryRow[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Fetch gallery attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    return [];
  },

  async fetchServices(retries = 3): Promise<ServiceItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Fetch services attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    return [];
  },

  async fetchBeforeAfter(retries = 3): Promise<BeforeAfterItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("before_after")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as BeforeAfterItem[];
      } catch (error) {
        console.error(`Fetch before_after attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    return [];
  },

  async uploadBeforeAfter(
    beforeFile: File,
    afterFile: File,
    data: {
      title: string;
      description?: string;
      type: string;
      location?: string;
      project_date?: string;
      before_label?: string;
      after_label?: string;
      tagline?: string;
      stat_value?: string;
      stat_label?: string;
    },
    retries = 3,
  ): Promise<void> {
    const timestamp = Date.now();
    const beforePath = `${IMAGE_FOLDERS.BEFORE_AFTER}/before-${timestamp}-${beforeFile.name.replace(/\s+/g, "_")}`;
    const afterPath = `${IMAGE_FOLDERS.BEFORE_AFTER}/after-${timestamp}-${afterFile.name.replace(/\s+/g, "_")}`;
    const cleanup = async (paths: string[]) => {
      for (const p of paths) {
        await storageService.deleteFile(IMAGE_BUCKET, p).catch(() => {});
      }
    };
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { url: bUrl, path: bPath } = await storageService.uploadFile(
          beforeFile,
          IMAGE_BUCKET,
          beforePath,
        );
        let aUrl: string, aPath: string;
        try {
          const r = await storageService.uploadFile(
            afterFile,
            IMAGE_BUCKET,
            afterPath,
          );
          aUrl = r.url;
          aPath = r.path;
        } catch (e) {
          if (bPath) await cleanup([bPath]);
          throw e;
        }
        const { error } = await supabase
          .from("before_after")
          .insert({
            title: data.title,
            description: data.description || null,
            type: data.type as any,
            before_image_url: bUrl,
            before_public_id: bPath,
            after_image_url: aUrl,
            after_public_id: aPath,
            is_active: true,
            location: data.location || null,
            project_date: data.project_date || null,
            before_label: data.before_label || null,
            after_label: data.after_label || null,
            tagline: data.tagline || null,
            stat_value: data.stat_value || null,
            stat_label: data.stat_label || null,
          } as any);
        if (error) {
          await cleanup([bPath, aPath]);
          throw error;
        }
        return;
      } catch (error) {
        console.error(`Upload before_after attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  },

  async deleteItem(
    id: string,
    table: string,
    publicIds: string[],
  ): Promise<void> {
    for (const path of publicIds) {
      await storageService.deleteFile(IMAGE_BUCKET, path);
    }
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteImage(
    publicId: string,
    table: "gallery" | "services" | "before_after",
  ): Promise<void> {
    await storageService.deleteFile(IMAGE_BUCKET, publicId);
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq("public_id", publicId);
    if (error) throw error;
  },

  async deleteProject(projectId: string): Promise<void> {
    const { data: images } = await supabase
      .from("gallery")
      .select("public_id")
      .eq("project_id", projectId);
    if (images) {
      for (const img of images) {
        await storageService
          .deleteFile(IMAGE_BUCKET, img.public_id)
          .catch(() => {});
      }
    }
    const { error } = await supabase
      .from("gallery_projects")
      .delete()
      .eq("id", projectId);
    if (error) throw error;
  },
};
