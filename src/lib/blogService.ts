import { supabase } from "@/integrations/supabase/client";
import { storageService } from "./storageService";

const db = supabase as unknown as { from: (t: string) => any };

export const BLOG_IMAGE_BUCKET = "images";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_public_id: string | null;
  author: string | null;
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  image_alt: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export const blogService = {
  /** Published posts, newest first — for the public blog list. */
  async fetchPublished(): Promise<BlogPost[]> {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  },

  async fetchBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return (data as BlogPost) ?? null;
  },

  /** All posts (incl. drafts) — for the admin manager. */
  async fetchAll(): Promise<BlogPost[]> {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  },

  async uploadCover(file: File): Promise<{ url: string; path: string }> {
    const path = `blog/${Date.now()}-${file.name.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "")}`;
    return storageService.uploadFile(file, BLOG_IMAGE_BUCKET, path);
  },

  async create(post: Partial<BlogPost>): Promise<void> {
    const { error } = await db.from("blog_posts").insert({
      ...post,
      published_at: post.is_published ? post.published_at ?? new Date().toISOString() : null,
    });
    if (error) throw error;
  },

  async update(id: string, post: Partial<BlogPost>): Promise<void> {
    const { error } = await db.from("blog_posts").update(post).eq("id", id);
    if (error) throw error;
  },

  async remove(post: BlogPost): Promise<void> {
    if (post.cover_public_id) {
      await storageService.deleteFile(BLOG_IMAGE_BUCKET, post.cover_public_id).catch(() => {});
    }
    const { error } = await db.from("blog_posts").delete().eq("id", post.id);
    if (error) throw error;
  },
};
