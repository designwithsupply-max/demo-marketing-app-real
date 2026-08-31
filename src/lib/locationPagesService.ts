import { supabase } from "@/integrations/supabase/client";

// location_pages isn't in the generated Supabase types yet — same escape
// hatch servicePagesService.ts / blogService.ts use.
const db = supabase as unknown as { from: (t: string) => any };

export interface LocationPage {
  id: string;
  slug: string;
  city_name: string;
  hero_eyebrow: string;
  hero_heading: string;
  hero_description: string;
  hero_image_url: string;
  additional_image_urls: string[];
  content: string;
  primary_button_label: string;
  primary_button_link: string;
  city_filter: string;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const slugifyLocationPage = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export const locationPagesService = {
  /** Active pages, in display order — for the public site (nav links, sitemap-adjacent listing). */
  async fetchActive(): Promise<LocationPage[]> {
    const { data, error } = await db
      .from("location_pages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LocationPage[];
  },

  async fetchBySlug(slug: string): Promise<LocationPage | null> {
    const { data, error } = await db
      .from("location_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return (data as LocationPage) ?? null;
  },

  /** All pages (incl. inactive) — for the admin manager. */
  async fetchAll(): Promise<LocationPage[]> {
    const { data, error } = await db
      .from("location_pages")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LocationPage[];
  },

  async create(page: Partial<LocationPage>): Promise<void> {
    const { error } = await db.from("location_pages").insert(page);
    if (error) throw error;
  },

  async update(id: string, page: Partial<LocationPage>): Promise<void> {
    const { error } = await db.from("location_pages").update(page).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("location_pages").delete().eq("id", id);
    if (error) throw error;
  },

  async reorder(id: string, display_order: number): Promise<void> {
    const { error } = await db.from("location_pages").update({ display_order }).eq("id", id);
    if (error) throw error;
  },
};
