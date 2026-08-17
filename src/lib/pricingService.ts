import { supabase } from "@/integrations/supabase/client";

// pricing_tiers' new columns aren't in the generated Supabase types yet —
// same escape hatch servicePagesService.ts / blogService.ts use.
const db = supabase as unknown as { from: (t: string) => any };

export const PRICING_CATEGORIES = [
  { value: "closets", label: "Closets" },
  { value: "walk-in-closets", label: "Walk-in Closets" },
  { value: "wardrobes", label: "Wardrobes" },
  { value: "kitchen-cabinets", label: "Kitchen Cabinets" },
  { value: "garage-cabinets", label: "Garage Cabinets" },
  { value: "pantries", label: "Pantries" },
  { value: "laundry-rooms", label: "Laundry Rooms" },
  { value: "mudrooms", label: "Mudrooms" },
] as const;

export type PricingCategory = (typeof PRICING_CATEGORIES)[number]["value"];

export interface PricingTier {
  id: string;
  category: PricingCategory;
  /** The package/tier name, e.g. "Walk-in Closet — Essentials". */
  label: string;
  /** Starting price, e.g. "$4,500+". */
  price: string;
  price_range: string | null;
  description: string | null;
  included_items: string[];
  price_factors: string[];
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  notes: string | null;
  order_index: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const pricingService = {
  /** Active tiers, in display order — for the public pricing display. */
  async fetchActive(): Promise<PricingTier[]> {
    const { data, error } = await db
      .from("pricing_tiers")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PricingTier[];
  },

  /** All tiers (incl. inactive) — for the admin manager. */
  async fetchAll(): Promise<PricingTier[]> {
    const { data, error } = await db
      .from("pricing_tiers")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as PricingTier[];
  },

  async create(tier: Partial<PricingTier>): Promise<void> {
    const { error } = await db.from("pricing_tiers").insert(tier);
    if (error) throw error;
  },

  async update(id: string, tier: Partial<PricingTier>): Promise<void> {
    const { error } = await db.from("pricing_tiers").update(tier).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("pricing_tiers").delete().eq("id", id);
    if (error) throw error;
  },

  async reorder(id: string, order_index: number): Promise<void> {
    const { error } = await db.from("pricing_tiers").update({ order_index }).eq("id", id);
    if (error) throw error;
  },
};
