"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Loader2, Truck } from "lucide-react";
import { SeoHead } from "@/components/seo/SeoHead";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import CTABanner from "@/components/sections/CTABanner";
import ServiceProjectGrid from "@/components/sections/ServiceProjectGrid";
import { useServicePageProjects } from "@/hooks/useServicePageProjects";
import { servicePagesService, type ServicePage as ServicePageContent } from "@/lib/servicePagesService";
import { DEFAULT_SERVICE_PAGES } from "@/lib/defaultServicePages";
import closetImage from "@/assets/images/closet_service.jpg";
import kitchenImage from "@/assets/images/kitchen_service.jpg";
import garageImage from "@/assets/images/garage_service.jpg";

const FALLBACK_IMAGE: Record<ServicePageContent["category"], string> = {
  closet: closetImage,
  kitchen: kitchenImage,
  garage: garageImage,
};

interface ServicePageProps {
  /** The slug this route renders — set explicitly per <Route> in App.tsx. */
  slug: string;
}

/**
 * Renders any page linked from the Services nav dropdown (Custom Closets,
 * Walk-In Closets, Reach-In Closets, Wardrobes, Garage Cabinets, Kitchen
 * Cabinets, Pantries/Laundry/Mudrooms). Content comes from the `service_pages`
 * table (edit at /admin/services) instead of being hardcoded per page, so new
 * service pages don't require a code change.
 */
export default function ServicePage({ slug }: ServicePageProps) {
  const [page, setPage] = useState<ServicePageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    // Built-in pages fall back to this if the DB can't be reached (migration
    // not applied yet, offline, etc.) — same fallback strategy as the hero,
    // services and nav links elsewhere on the site — so the page still works
    // instead of bouncing the visitor to /gallery.
    const fallback = DEFAULT_SERVICE_PAGES[slug]
      ? ({ ...DEFAULT_SERVICE_PAGES[slug], id: slug, created_at: "", updated_at: "" } as ServicePageContent)
      : null;

    servicePagesService
      .fetchBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (data) setPage(data);
        else if (fallback) setPage(fallback);
        else setNotFound(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (fallback) setPage(fallback);
        else setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const { projects, loading: projectsLoading, firstProject } = useServicePageProjects(page?.category ?? "closet");

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (notFound || !page) {
    // A page that's been deactivated or deleted in admin shouldn't 404 the nav
    // link outright — send visitors somewhere useful instead.
    return <Navigate to="/gallery" replace />;
  }

  const heroSrc = page.hero_image_url || firstProject?.thumbnail || FALLBACK_IMAGE[page.category];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.hero_heading,
    provider: {
      "@type": "LocalBusiness",
      name: "Design & Supply",
    },
    description: page.seo_description || page.hero_description,
    serviceType: page.nav_label,
    url: `https://designandsupply.ca/${page.slug}`,
    areaServed: "Greater Montréal",
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <SeoHead
        title={page.seo_title || `${page.hero_heading} | Design & Supply`}
        description={page.seo_description || page.hero_description}
        jsonLd={serviceSchema}
      />
      <Navigation />
      <main className="pt-24 lg:pt-28">
        <section className="px-6 lg:px-10 pb-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">{page.hero_eyebrow}</span>
              <h1
                className="text-brand-espresso font-light leading-tight mb-5"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
              >
                {page.hero_heading}
              </h1>
              <p className="text-brand-muted text-sm leading-relaxed max-w-xl mb-7">{page.hero_description}</p>
              <Link
                href={page.primary_button_link}
                className="group inline-flex items-center gap-3 bg-brand-copper text-white text-sm tracking-[0.2em] uppercase font-medium px-8 py-4 rounded-full hover:bg-brand-copper-dark transition-all duration-300 shadow-lg"
              >
                {page.primary_button_label}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-border shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)]">
              <Image src={heroSrc} alt={page.hero_heading} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </div>
        </section>

        <ServiceProjectGrid projects={projects} loading={projectsLoading} type={page.category} />

        <section className="bg-brand-sand px-6 lg:px-10 py-14">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-brand-espresso text-3xl mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                How it works
              </h2>
              <ul className="space-y-3">
                {page.steps.map((step) => (
                  <li key={step} className="flex items-start gap-3 text-brand-muted text-sm">
                    <CheckCircle size={16} className="text-brand-copper mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-brand-espresso text-3xl mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                What you get
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {page.features.map((feature) => (
                  <li key={feature} className="bg-white border border-brand-border rounded-xl px-4 py-3 text-brand-muted text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {(page.pricing_note || page.delivery_note) && (
          <section className="px-6 lg:px-10 py-14">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {page.pricing_note && (
                <div className="rounded-2xl border border-brand-border bg-white p-6">
                  <h3 className="text-brand-espresso font-medium text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Pricing
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{page.pricing_note}</p>
                </div>
              )}
              {page.delivery_note && (
                <div className="rounded-2xl border border-brand-border bg-white p-6">
                  <h3 className="text-brand-espresso font-medium text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    <Truck size={18} className="text-brand-copper" /> Delivery &amp; Installation
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{page.delivery_note}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
