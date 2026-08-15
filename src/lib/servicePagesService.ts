import { supabase } from "@/integrations/supabase/client";

// service_pages isn't in the generated Supabase types yet — same escape hatch
// blogService.ts uses for blog_posts.
const db = supabase as unknown as { from: (t: string) => any };

export type ServiceCategory = "closet" | "kitchen" | "garage";

export interface ServicePage {
  id: string;
  slug: string;
  nav_label: string;
  category: ServiceCategory;
  hero_eyebrow: string;
  hero_heading: string;
  hero_description: string;
  hero_image_url: string;
  primary_button_label: string;
  primary_button_link: string;
  steps: string[];
  features: string[];
  pricing_note: string;
  delivery_note: string;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  show_in_nav: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const slugifyServicePage = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export const servicePagesService = {
  /** Active pages, in display order — for the public nav/footer and routing. */
  async fetchActive(): Promise<ServicePage[]> {
    const { data, error } = await db
      .from("service_pages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ServicePage[];
  },

  async fetchBySlug(slug: string): Promise<ServicePage | null> {
    const { data, error } = await db
      .from("service_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return (data as ServicePage) ?? null;
  },

  /** All pages (incl. inactive) — for the admin manager. */
  async fetchAll(): Promise<ServicePage[]> {
    const { data, error } = await db
      .from("service_pages")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ServicePage[];
  },

  async create(page: Partial<ServicePage>): Promise<void> {
    const { error } = await db.from("service_pages").insert(page);
    if (error) throw error;
  },

  async update(id: string, page: Partial<ServicePage>): Promise<void> {
    const { error } = await db.from("service_pages").update(page).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("service_pages").delete().eq("id", id);
    if (error) throw error;
  },

  async reorder(id: string, display_order: number): Promise<void> {
    const { error } = await db.from("service_pages").update({ display_order }).eq("id", id);
    if (error) throw error;
  },
};
