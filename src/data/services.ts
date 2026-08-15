import type { Service } from "@/types";

export const services: Service[] = [
  {
    id: "1",
    title: "Walk-in Closets",
    slug: "walk-in-closets",
    shortDescription: "Transform your space into a personal boutique with custom walk-in closet systems designed for your lifestyle.",
    description: "Our walk-in closet systems are the pinnacle of personal luxury. Every detail is crafted to reflect your unique style while maximizing your available space. From integrated lighting to custom hardware, we design closets that feel like private boutiques.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=800&fit=crop",
    features: ["Custom shelving & hanging", "Integrated LED lighting", "Island with drawers", "Full-length mirrors", "Shoe display systems", "Jewelry organizers"],
    benefits: ["Maximize space utilization", "Tailored to your wardrobe", "Premium hardware & finishes", "Warranty details confirmed before final approval"],
    gallery: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop"
    ],
    relatedServices: ["sliding-wardrobes", "luxury-dressing-rooms"],
    icon: "Shirt"
  },
  {
    id: "2",
    title: "Sliding Wardrobes",
    slug: "sliding-wardrobes",
    shortDescription: "Space-saving elegance with custom sliding wardrobe systems that transform any room.",
    description: "Our sliding wardrobe systems combine sleek aesthetics with superior functionality. Perfect for bedrooms of any size, our floor-to-ceiling designs create an illusion of space while providing generous storage solutions.",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&h=800&fit=crop",
    features: ["Soft-close mechanisms", "Mirror panel options", "Floor-to-ceiling design", "Custom interior fitting", "Various door finishes", "Integrated lighting"],
    benefits: ["Space-efficient design", "Silent operation", "Contemporary aesthetics", "Customizable compartments"],
    gallery: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop"
    ],
    relatedServices: ["walk-in-closets", "kids-closet-systems"],
    icon: "PanelLeft"
  },
  {
    id: "3",
    title: "Luxury Dressing Rooms",
    slug: "luxury-dressing-rooms",
    shortDescription: "The ultimate expression of personal luxury — a private sanctuary for your wardrobe and self.",
    description: "A luxury dressing room is more than storage — it's a lifestyle statement. We create bespoke dressing rooms that rival high-end boutiques, complete with statement lighting, plush seating, and curated display systems.",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1400&h=800&fit=crop",
    features: ["Boutique-style displays", "Vanity with lighting", "Plush seating areas", "Fragrance display zones", "Watch & jewelry showcases", "Garment viewing areas"],
    benefits: ["Hotel-suite experience", "Curated aesthetic", "Premium materials", "Bespoke design process"],
    gallery: [
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
    ],
    relatedServices: ["walk-in-closets", "custom-storage-consultation"],
    icon: "Sparkles"
  },
  {
    id: "4",
    title: "Kids Closet Systems",
    slug: "kids-closet-systems",
    shortDescription: "Playful, practical, and perfectly sized — closet systems designed to grow with your child.",
    description: "Children's closets need to be adaptable, safe, and fun. Our kids' closet systems feature adjustable configurations that grow with your child, bright accents, and thoughtful organization zones for clothes, toys, and school supplies.",
    image: "https://images.unsplash.com/photo-1558997519-83ea9252edc8?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&h=800&fit=crop",
    features: ["Height-adjustable rails", "Colorful accent options", "Toy storage zones", "Study corner integration", "Accessible low shelving", "Safe rounded edges"],
    benefits: ["Grows with your child", "Non-toxic materials", "Easy to reorganize", "Encourages independence"],
    gallery: [
      "https://images.unsplash.com/photo-1558997519-83ea9252edc8?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&h=400&fit=crop"
    ],
    relatedServices: ["sliding-wardrobes", "custom-storage-consultation"],
    icon: "Star"
  },
  {
    id: "5",
    title: "Office Storage Closets",
    slug: "office-storage-closets",
    shortDescription: "Sophisticated home office storage solutions that keep your workspace inspiring and organized.",
    description: "The modern home office demands intelligent storage. Our office closet systems blend aesthetic elegance with practical organization — creating workspaces that inspire productivity and reflect professional excellence.",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=1400&h=800&fit=crop",
    features: ["File & document storage", "Cable management", "Display shelving", "Printer concealment", "Lockable cabinets", "Integrated power points"],
    benefits: ["Boosts productivity", "Clean minimalist aesthetic", "Custom to your workflow", "Premium professional finish"],
    gallery: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop"
    ],
    relatedServices: ["walk-in-closets", "custom-storage-consultation"],
    icon: "Briefcase"
  },
  {
    id: "6",
    title: "Custom Storage Consultation",
    slug: "custom-storage-consultation",
    shortDescription: "Expert design consultation to create a perfectly tailored storage solution for any space.",
    description: "Not sure where to start? Our design consultation service pairs you with a dedicated storage expert who assesses your space, lifestyle needs, and aesthetic preferences to create a truly bespoke solution.",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop",
    heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&h=800&fit=crop",
    features: ["In-home assessment", "3D design visualization", "Material selection guide", "Budget planning", "Timeline roadmap", "Post-install support"],
    benefits: ["Expert guidance", "No commitment required", "3D preview before build", "Personalized to your needs"],
    gallery: [
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop"
    ],
    relatedServices: ["walk-in-closets", "luxury-dressing-rooms"],
    icon: "Compass"
  }
];
