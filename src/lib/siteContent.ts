import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/images/hero_image.jpg";
import closetImage from "@/assets/images/closet_service.jpg";
import kitchenImage from "@/assets/images/kitchen_service.jpg";
import garageImage from "@/assets/images/garage_service.jpg";
import step1Image from "@/assets/images/step1.jpg";
import step2Image from "@/assets/images/step2.jpg";
import step3Image from "@/assets/images/step3.jpg";

/**
 * Editable site content lives in the `site_content` table: one row per section,
 * `key` -> `value` (a JSON blob shaped like the interfaces below). Public
 * components read via `useSiteContent(key, DEFAULT)` and fall back to the
 * DEFAULT_* objects here (which mirror the original hardcoded copy) whenever a
 * row is missing or the migration hasn't been applied yet.
 */

export const SITE_KEYS = {
  hero: "home_hero",
  services: "home_services",
  cta: "home_cta",
  howItWorksSteps: "howitworks_steps",
  about: "about_page",
  promo: "promo_popup",
  features: "site_features",
  terms: "legal_terms",
  privacy: "legal_privacy",
} as const;

/** An editable legal page (Terms of Service / Privacy Policy). Body is Markdown. */
export interface LegalContent {
  title: string;
  /** Small line under the title, e.g. "Last updated July 2026". */
  updated: string;
  /** Page body, written in the Markdown-lite supported by renderMarkdown(). */
  body: string;
}

export const DEFAULT_TERMS: LegalContent = {
  title: "Terms of Service",
  updated: "Last updated July 2026",
  body: `Welcome to Design & Supply. By accessing or using our website, design tools, and services, you agree to these Terms of Service. Please read them carefully.

## Using Our Services
You may use our Space Planner and related services only for lawful purposes and in accordance with these terms. You are responsible for the accuracy of the measurements, photos, and details you provide.

## Quotes & Pricing
All quotes are estimates until a final design is approved. Pricing may change based on materials, finishes, and the final measured dimensions of your space.

## Payments
Deposits and payments are processed securely through our third-party payment provider. Deposits may be non-refundable once production of custom materials has begun.

## Intellectual Property
All designs, visualizations, images, and content on this site are the property of Design & Supply and may not be reproduced without permission.

## Limitation of Liability
Design & Supply is not liable for any indirect or consequential damages arising from the use of our website or services, to the fullest extent permitted by law.

## Contact
Questions about these terms? Reach us through the [contact page](/contact).`,
};

export const DEFAULT_PRIVACY: LegalContent = {
  title: "Privacy Policy",
  updated: "Last updated July 2026",
  body: `Your privacy matters to us. This policy explains what information Design & Supply collects, how we use it, and the choices you have.

## Information We Collect
We collect the details you submit through our Space Planner and contact forms — such as your name, email, phone number, postal code, room measurements, and any photos or notes you share.

## How We Use Your Information
We use your information to prepare designs and quotes, schedule consultations, respond to your enquiries, and improve our services. We never sell your personal information.

## Email Verification
When email verification is enabled, we send a one-time magic link to confirm ownership of the address you enter. This helps us keep your project details secure.

## Cookies & Storage
We use browser storage to save your planner progress so you can pick up where you left off. You can clear this at any time from your browser settings.

## Data Retention
We keep submission data for as long as needed to serve you and meet legal obligations. You may request deletion of your data at any time.

## Contact
To ask about your data or request deletion, reach us through the [contact page](/contact).`,
};

/** Master on/off switches for optional site behaviour (see /admin/settings). */
export interface FeaturesContent {
  /**
   * When false, Step 1 of the Space Planner stops asking visitors to confirm
   * their address by magic link — they continue straight to Step 2.
   */
  emailVerification: boolean;
  /** When false the bottom-right promo card never appears, whatever its own settings say. */
  promoPopup: boolean;
}

export const DEFAULT_FEATURES: FeaturesContent = {
  emailVerification: true,
  promoPopup: true,
};

export interface HeroContent {
  eyebrow: string;
  headingLine1: string;
  headingEmphasis: string;
  headingLine3: string;
  subheading: string;
  primaryLabel: string;
  primaryLink: string;
  secondaryLabel: string;
  secondaryLink: string;
  imageUrl: string;
}

export interface ServiceCard {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export interface ServicesContent {
  eyebrow: string;
  heading: string;
  cards: ServiceCard[];
}

export interface CtaContent {
  eyebrow: string;
  headingLine1: string;
  headingEmphasis: string;
  buttonLabel: string;
  buttonLink: string;
  imageUrl: string;
}

export interface HowItWorksStep {
  title: string;
  description: string;
  detail: string;
  duration: string;
  imageUrl: string;
}

export interface HowItWorksStepsContent {
  steps: HowItWorksStep[];
}

export interface AboutTimelineItem {
  year: string;
  text: string;
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutContent {
  // Hero
  heroEyebrow: string;
  heroHeadingLine1: string;
  heroHeadingEmphasis: string;
  heroHeadingLine3: string;
  heroIntro: string;
  heroImageUrl: string;
  // Story
  storyEyebrow: string;
  timeline: AboutTimelineItem[];
  storyHeadingLine1: string;
  storyHeadingLine2: string;
  storyParagraphs: string[];
  stats: AboutStat[];
  // Mission & Vision
  missionEyebrow: string;
  missionText: string;
  visionEyebrow: string;
  visionText: string;
  // Values (icons stay fixed; only title + description are editable)
  valuesEyebrow: string;
  valuesHeading: string;
  values: AboutValue[];
}

/** The bottom-right promotional pop-up shown on customer-facing pages. */
export interface PromoContent {
  /** Master on/off switch. When false the popup never appears. */
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  /** Fine print shown under the email field. */
  terms: string;
  ctaLabel: string;
  /** Optional small image shown at the top of the card. Leave blank for none. */
  imageUrl: string;
  /** Seconds the visitor spends on the site before the popup appears. */
  delaySeconds: number;
  /** Seconds the popup stays visible before it auto-dismisses itself. */
  autoDismissSeconds: number;
}

export const DEFAULT_PROMO: PromoContent = {
  enabled: true,
  eyebrow: "Limited Time Offer",
  title: "Free Color Upgrade",
  description:
    "Sign up now and get a promo code for a FREE color upgrade on your first design order.",
  terms: "*Valid for orders above $3,500. Cannot be combined.",
  ctaLabel: "Get My Code",
  imageUrl:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400",
  delaySeconds: 18,
  autoDismissSeconds: 7,
};

export const DEFAULT_HERO: HeroContent = {
  eyebrow: "Online Design & Supply Platform",
  headingLine1: "Custom closets, kitchens & garages",
  headingEmphasis: "designed live",
  headingLine3: "from your home.",
  subheading:
    "Use our 3-Step Space Planner to measure your space, upload photos, and meet with a designer live. We design your project in CAD and give you a same-day quote.",
  primaryLabel: "Start 3-Step Space Planner",
  primaryLink: "/space-planner",
  secondaryLabel: "See How It Works",
  secondaryLink: "/how-it-works",
  imageUrl: heroImage,
};

export const DEFAULT_SERVICES: ServicesContent = {
  eyebrow: "What We Design",
  heading: "One platform for closets, kitchens & garages",
  cards: [
    {
      title: "Closets",
      link: "/closets",
      imageUrl: closetImage,
      description: "Walk-ins, reach-ins, wardrobes, pantries, laundry rooms, and storage walls.",
    },
    {
      title: "Kitchens",
      link: "/kitchens",
      imageUrl: kitchenImage,
      description: "Custom kitchen cabinets designed live in CAD and supplied fully assembled.",
    },
    {
      title: "Garages",
      link: "/garages",
      imageUrl: garageImage,
      description: "Garage cabinets, workbenches, tall storage, and organized storage systems.",
    },
  ],
};

export const DEFAULT_CTA: CtaContent = {
  eyebrow: "Start From Home",
  headingLine1: "Ready to design your",
  headingEmphasis: "space from home?",
  buttonLabel: "Start 3-Step Space Planner",
  buttonLink: "/space-planner",
  imageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1920&h=600&fit=crop",
};

export const DEFAULT_HOWITWORKS_STEPS: HowItWorksStepsContent = {
  steps: [
    {
      title: "Book a Free Consultation",
      description:
        "Start with a complimentary design consultation — either in your home or via video call. Our experts will walk through your space, understand your lifestyle, and begin mapping your ideal closet system.",
      detail: "No commitment required. Just a conversation.",
      duration: "60–90 min",
      imageUrl: step1Image,
    },
    {
      title: "Receive Your Custom 3D Design",
      description:
        "Within 5 business days, your dedicated designer will present a full 3D visualization of your closet system — complete with material choices, hardware options, and itemized pricing.",
      detail: "Revise until it's perfect. We don't build until you're thrilled.",
      duration: "5 business days",
      imageUrl: step2Image,
    },
    {
      title: "Approve & Schedule Installation",
      description:
        "Once you approve the design, we order your custom materials and schedule your installation date. We handle everything — no contractors, no coordination headaches.",
      detail: "Typical lead time: 3–4 weeks from approval.",
      duration: "3–4 weeks lead time",
      imageUrl: step3Image,
    },
  ],
};

export const DEFAULT_ABOUT: AboutContent = {
  heroEyebrow: "Our Story",
  heroHeadingLine1: "We Believe Your",
  heroHeadingEmphasis: "Closet Should Be",
  heroHeadingLine3: "Beautiful",
  heroIntro:
    "Founded in 2015, Design & Supply was born from a simple conviction: that the spaces where we store our lives should be as considered and beautiful as the lives themselves.",
  heroImageUrl: "",
  storyEyebrow: "The Beginning",
  timeline: [
    { year: "2015", text: "Founded in Los Angeles by Alexandra Morse after a decade in luxury interior design." },
    { year: "2018", text: "Expanded nationally. Over 500 projects completed across 12 states." },
    { year: "2021", text: "Launched our proprietary 3D design visualization platform." },
    { year: "2024", text: "Over 1,200 projects. Ranked #1 custom closet brand on Houzz for 3 consecutive years." },
  ],
  storyHeadingLine1: "Design at the Intersection of",
  storyHeadingLine2: "Beauty and Function",
  storyParagraphs: [
    "Design & Supply was built on the belief that premium storage design shouldn't be reserved for those with unlimited budgets — but that quality, craftsmanship, and thoughtful design should be accessible to every discerning homeowner.",
    "Every project we undertake is treated as a unique collaboration. We don't manufacture standard closet kits and call them custom. Every panel, every shelf, every piece of hardware is selected specifically for your space, your wardrobe, and your lifestyle.",
    "Our team of dedicated designers, project managers, and master craftsmen share one obsession: delivering a finished product that makes you feel something the moment you open the door.",
  ],
  stats: [
    { value: "1,200+", label: "Projects" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "10yr", label: "Warranty" },
  ],
  missionEyebrow: "Our Mission",
  missionText:
    "“To transform every storage space into a reflection of the person who inhabits it — with precision, artistry, and enduring quality.”",
  visionEyebrow: "Our Vision",
  visionText:
    "“A world where every home has a closet that brings genuine joy — not just storage, but sanctuary.”",
  valuesEyebrow: "Why Choose Us",
  valuesHeading: "Our Core Values",
  values: [
    { title: "Uncompromising Quality", description: "Only premium materials pass our selection. Every component is sourced from the world's finest suppliers." },
    { title: "Client Partnership", description: "Your vision drives everything. We design with you, not for you — every decision is collaborative." },
    { title: "Space Intelligence", description: "We see potential where others see limitation. Every awkward corner, low ceiling, and narrow corridor is an opportunity." },
    { title: "Lasting Excellence", description: "Our 10-year warranty isn't a promise — it's a certainty. We build to last decades, not seasons." },
  ],
};

/** Fetch every content row as a { key: value } map. Returns {} on any error
 * (e.g. table not created yet) so callers cleanly fall back to defaults. */
export async function fetchAllSiteContent(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from("site_content" as any).select("key, value");
    if (error) return {};
    const map: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      map[row.key] = row.value;
    });
    return map;
  } catch {
    return {};
  }
}

/** Insert or update one content section. */
export async function upsertSiteContent(key: string, value: any): Promise<void> {
  const { error } = await supabase
    .from("site_content" as any)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
