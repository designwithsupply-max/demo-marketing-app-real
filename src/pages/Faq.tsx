import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import FAQSection from "@/components/sections/FAQSection";
import CTABanner from "@/components/sections/CTABanner";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { useFAQs } from "@/hooks/useFAQs";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_PAGE_SEO } from "@/lib/siteContent";

const Faq = () => {
  const { faqs, isLoading } = useFAQs();
  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));
  const { content: pageSeo } = useSiteContent(SITE_KEYS.pageSeo, DEFAULT_PAGE_SEO);
  const seo = pageSeo.faq;

  return (
    <div className="min-h-screen bg-brand-cream">
      <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
      <Navigation />
      <div className="pt-32 lg:pt-40 pb-10 text-center px-6">
        <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">Questions & Answers</span>
        <h1 className="text-brand-espresso font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
          {seo.h1 || "Frequently Asked Questions"}
        </h1>
        <p className="text-brand-muted text-sm leading-relaxed max-w-2xl mx-auto mt-4">
          Clear answers about the online process, measurements, live CAD sessions, quote timing, and cabinet supply.
        </p>

        {!isLoading && (
          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {categories.map((category) => (
              <span key={category} className="px-3 py-1.5 rounded-full bg-brand-sand border border-brand-border text-brand-muted text-xs tracking-[0.08em] uppercase">
                {category}
              </span>
            ))}
          </div>
        )}
      </div>

      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Faq;
