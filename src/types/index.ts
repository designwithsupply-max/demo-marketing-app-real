export interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  project: string;
  order_index: number;
  is_active: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestimonialInsert {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  project: string;
  order_index?: number;
  is_active?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
}

export interface TestimonialUpdate {
  name?: string;
  location?: string;
  avatar?: string;
  rating?: number;
  review?: string;
  project?: string;
  order_index?: number;
  is_active?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
}

export interface GalleryImage {
  src: string;
  title: string;
  description: string;
  spec?: string;
  alt?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  type?: "closet" | "kitchen" | "garage" | "other";
  thumbnail: string;
  images: GalleryImage[];
  description: string;
  tags: string[];
  city?: string | null;
  clientNeeded?: string | null;
  whatWeDesigned?: string | null;
  mainFeatures?: string[];
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  image: string;
  heroImage: string;
  features: string[];
  benefits: string[];
  gallery: string[];
  relatedServices: string[];
  icon: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_active: boolean;
  service_page_id?: string | null;
  location_page_id?: string | null;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQInsert {
  question: string;
  answer: string;
  category: string;
  order_index?: number;
  is_active?: boolean;
  service_page_id?: string | null;
  location_page_id?: string | null;
}

export interface FAQUpdate {
  question?: string;
  answer?: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
  service_page_id?: string | null;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
  duration?: string;
}

export interface PricingTier {
  id: string;
  price: string;
  label: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  business_hours: string;
  updated_at: string;
}

export interface PricingTierInsert {
  price: string;
  label: string;
  order_index?: number;
  is_active?: boolean;
}
