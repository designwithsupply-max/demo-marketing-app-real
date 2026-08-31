"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { SeoHead } from "@/components/seo/SeoHead";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import CTABanner from "@/components/sections/CTABanner";
import NotFound from "@/pages/NotFound";
import { locationPagesService, type LocationPage as LocationPageContent } from "@/lib/locationPagesService";
import { imageService, type GalleryViewItem } from "@/lib/imageService";
import { useFAQs } from "@/hooks/useFAQs";
import { renderMarkdown } from "@/lib/renderMarkdown";

/**
 * Local SEO landing page for one service area (Laval, Longueuil, West
 * Island, etc.) — content comes entirely from the `location_pages` table
 * (edit at /admin/locations), so new cities don't need a code change or a
 * new route: this single component renders whichever slug the URL asks for.
 */
export default function LocationPage() {
  const { locationSlug: slug } = useParams<{ locationSlug: string }>();
  const [page, setPage] = useState<LocationPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState<GalleryViewItem[]>([]);
  const { faqs } = useFAQs();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    locationPagesService
      .fetchBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (data) setPage(data);
        else setNotFound(true);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!page?.city_filter) {
      setProjects([]);
      return;
    }
    let cancelled = false;
    imageService
      .fetchGalleryProjects()
      .then((all) => {
        if (cancelled) return;
        const filter = page.city_filter.toLowerCase();
        setProjects(all.filter((p) => p.isActive && p.city && p.city.toLowerCase().includes(filter)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [page?.city_filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  // Deactivated/missing location pages get a real 404, not a redirect —
  // these are indexable SEO pages, so a wrong/removed slug should behave
  // like any other missing page for search engines.
  if (notFound || !page) {
    return <NotFound />;
  }

  const pageFaqs = faqs.filter((f) => f.location_page_id === page.id);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.hero_heading,
    provider: { "@type": "LocalBusiness", name: "Design & Supply" },
    description: page.seo_description || page.hero_description,
    areaServed: { "@type": "City", name: page.city_name },
    url: `https://designandsupply.ca/${page.slug}`,
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <SeoHead
        title={page.seo_title || `${page.hero_heading} | Design & Supply`}
        description={page.seo_description || page.hero_description}
        image={page.hero_image_url || undefined}
        path={`/${page.slug}`}
        jsonLd={schema}
      />
      <Navigation />
      <main className="pt-24 lg:pt-28">
        <section className="px-6 lg:px-10 pb-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              {page.hero_eyebrow && (
                <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">{page.hero_eyebrow}</span>
              )}
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

            {page.hero_image_url && (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-border shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)]">
                <Image src={page.hero_image_url} alt={page.hero_heading} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            )}
          </div>
        </section>

        {page.additional_image_urls?.length > 0 && (
          <section className="px-6 lg:px-10 pb-16">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.additional_image_urls.map((url) => (
                <div key={url} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-border">
                  <Image src={url} alt={`${page.city_name} project`} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 33vw" />
                </div>
              ))}
            </div>
          </section>
        )}

        {page.content && (
          <section className="px-6 lg:px-10 py-14 bg-white">
            <div className="max-w-3xl mx-auto prose-content">{renderMarkdown(page.content)}</div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="px-6 lg:px-10 py-14 bg-brand-sand">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-brand-espresso text-3xl mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Recent {page.city_name} Projects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    href={`/gallery/${p.slug}`}
                    className="group block overflow-hidden rounded-2xl bg-white border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] hover:shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)] transition-all duration-500"
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <Image
                        src={p.thumbnail}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-brand-espresso font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{p.title}</h3>
                      <span className="text-brand-copper text-xs tracking-[0.12em] uppercase">{p.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {pageFaqs.length > 0 && (
          <section className="px-6 lg:px-10 py-14">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-brand-espresso text-3xl mb-6 text-center" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {pageFaqs.map((faq) => (
                  <div key={faq.id} className="rounded-2xl border border-brand-border bg-white p-6">
                    <h3 className="text-brand-espresso font-medium text-base mb-2 flex items-start gap-2">
                      <CheckCircle size={16} className="text-brand-copper mt-0.5 shrink-0" /> {faq.question}
                    </h3>
                    <p className="text-brand-muted text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
