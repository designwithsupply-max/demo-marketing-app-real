import type { ServicePage } from "@/lib/servicePagesService";

/**
 * Fallback content for the 7 built-in service pages, keyed by slug — used
 * whenever the `service_pages` table can't be reached (migration not applied
 * yet, or a transient network error) so the pages work immediately instead of
 * redirecting away. Mirrors the seed data in
 * supabase/migrations/20260814090000_create_service_pages.sql; once that
 * migration is applied and rows are edited in /admin/services, the live DB
 * content takes over and this is only a safety net.
 */
export const DEFAULT_SERVICE_PAGES: Record<string, Omit<ServicePage, "id" | "created_at" | "updated_at">> = {
  closets: {
    slug: "closets",
    nav_label: "Custom Closets",
    category: "closet",
    hero_eyebrow: "Custom Closets",
    hero_heading: "Custom Closets in Greater Montréal, Designed Live Online",
    hero_description:
      "We design live online and supply fully assembled cabinets. Plan your walk-in, reach-in, or wardrobe system from home in a live CAD session, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your closet with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD design together",
      "Get a same-day quote and choose pickup, delivery or installation",
    ],
    features: [
      "Walk-in, reach-in, and wardrobe layouts",
      "Soft-close drawers and doors",
      "Adjustable shelves and hanging rods",
      "Shoe racks and accessory drawers",
      "Finish options that match your style",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Custom Closets in Greater Montréal, Designed Live Online | Design & Supply",
    seo_description:
      "Custom walk-in and reach-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 0,
  },
  "walk-in-closets": {
    slug: "walk-in-closets",
    nav_label: "Walk-In Closets",
    category: "closet",
    hero_eyebrow: "Walk-In Closets",
    hero_heading: "Walk-In Closets in Greater Montréal, Designed Live Online",
    hero_description:
      "Turn a spare room or primary suite into a walk-in closet built around your wardrobe. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your walk-in with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD layout together",
      "Get a same-day quote and choose pickup, delivery or installation",
    ],
    features: [
      "Island with drawers, where space allows",
      "Adjustable shelves and hanging rods",
      "Shoe shelving and accessory drawers",
      "Soft-close drawers and doors",
      "Finish options that match your style",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Walk-In Closets in Greater Montréal, Designed Live Online | Design & Supply",
    seo_description:
      "Custom walk-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 1,
  },
  "reach-in-closets": {
    slug: "reach-in-closets",
    nav_label: "Reach-In Closets",
    category: "closet",
    hero_eyebrow: "Reach-In Closets",
    hero_heading: "Reach-In Closets in Greater Montréal, Designed Live Online",
    hero_description:
      "Make the most of a standard bedroom closet with a reach-in system built to fit. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your reach-in with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD layout together",
      "Get a same-day quote and choose pickup, delivery or installation",
    ],
    features: [
      "Double and single hang sections",
      "Adjustable shelving",
      "Drawer banks for folded clothing",
      "Soft-close hardware",
      "Finish options that match your style",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Reach-In Closets in Greater Montréal, Designed Live Online | Design & Supply",
    seo_description:
      "Custom reach-in closets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 2,
  },
  wardrobes: {
    slug: "wardrobes",
    nav_label: "Wardrobes",
    category: "closet",
    hero_eyebrow: "Wardrobes",
    hero_heading: "Custom Wardrobes in Greater Montréal, Designed Live Online",
    hero_description:
      "A freestanding or built-in wardrobe designed for rooms without a closet. We design live online and supply fully assembled cabinetry, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your space with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD wardrobe design together",
      "Get a same-day quote and choose pickup, delivery or installation",
    ],
    features: [
      "Hinged or sliding door options",
      "Adjustable shelves and hanging rods",
      "Mirror door options",
      "Soft-close hardware",
      "Finish options that match your style",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Custom Wardrobes in Greater Montréal, Designed Live Online | Design & Supply",
    seo_description:
      "Custom wardrobes designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 3,
  },
  "garage-cabinets": {
    slug: "garage-cabinets",
    nav_label: "Garage Cabinets",
    category: "garage",
    hero_eyebrow: "Garage Cabinets",
    hero_heading: "Garage Cabinets & Storage in Greater Montréal",
    hero_description:
      "We design live online and supply fully assembled cabinets, with local installation across Greater Montréal. Organize tools, gear, and seasonal items with a layout built around your space.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your garage with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD garage plan",
      "Get a same-day quote and supply plan",
    ],
    features: [
      "Heavy-duty wall and base cabinets",
      "Slatwall and accessory storage",
      "Workbench and tool organization layouts",
      "Overhead and vertical storage options",
      "Durable finishes for garage use",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Garage Cabinets & Storage in Greater Montréal | Design & Supply",
    seo_description:
      "Custom garage cabinets, slatwall, and workbench storage designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 4,
  },
  kitchens: {
    slug: "kitchens",
    nav_label: "Kitchen Cabinets",
    category: "kitchen",
    hero_eyebrow: "Kitchen Cabinets",
    hero_heading: "Kitchen Cabinets in Greater Montréal, Designed Live Online",
    hero_description:
      "We design live online and supply fully assembled cabinets. Build a better kitchen flow with a live CAD design session from home, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your kitchen with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD kitchen layout",
      "Get a same-day quote and cabinet supply plan",
    ],
    features: [
      "Base cabinets, wall cabinets, and islands",
      "Soft-close hinges and drawer slides",
      "Pantry and corner storage solutions",
      "Cabinet options for your appliances",
      "Style and finish choices for your space",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Kitchen Cabinets in Greater Montréal, Designed Live Online | Design & Supply",
    seo_description:
      "Custom kitchen cabinets designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 5,
  },
  "pantries-laundry-mudrooms": {
    slug: "pantries-laundry-mudrooms",
    nav_label: "Pantries / Laundry / Mudrooms",
    category: "closet",
    hero_eyebrow: "Pantries, Laundry & Mudrooms",
    hero_heading: "Pantries, Laundry & Mudroom Storage in Greater Montréal",
    hero_description:
      "Custom storage for pantries, laundry rooms and mudrooms — designed live online and supplied fully assembled, with local installation across Greater Montréal.",
    hero_image_url: "",
    primary_button_label: "Start Free Design",
    primary_button_link: "/space-planner",
    steps: [
      "Measure your space with our 3-Step Space Planner",
      "Meet live with a designer online",
      "Review your custom CAD layout together",
      "Get a same-day quote and choose pickup, delivery or installation",
    ],
    features: [
      "Adjustable pantry shelving",
      "Laundry cabinets and folding counters",
      "Mudroom lockers, hooks and bench storage",
      "Durable finishes for high-use spaces",
      "Storage built around your appliances",
      "Fully assembled cabinet supply",
    ],
    pricing_note:
      "Your final quote is based on the approved design, measurements, finishes, accessories, delivery method and installation option.",
    delivery_note: "Choose pickup, curbside delivery, or local installation across Greater Montréal.",
    seo_title: "Pantries, Laundry & Mudroom Storage in Greater Montréal | Design & Supply",
    seo_description:
      "Custom pantry, laundry and mudroom storage designed live online. Local installation in Greater Montréal, supply-only shipping options across Canada where available.",
    is_active: true,
    show_in_nav: true,
    display_order: 6,
  },
};
