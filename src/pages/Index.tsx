import { SeoHead } from "@/components/seo/SeoHead";
import { Navigation } from "@/components/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import HeroFeatures from "@/components/sections/HeroFeatures";
import ProcessSteps from "@/components/sections/ProcessSteps";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyDifferent from "@/components/sections/WhyDifferent";
import HomeGallery from "@/components/sections/HomeGallery";
import ProjectVideos from "@/components/sections/ProjectVideos";
import { BeforeAfter } from "@/components/BeforeAfter";
import SpacePlannerPreview from "@/components/sections/SpacePlannerPreview";
import ServiceArea from "@/components/sections/ServiceArea";
import CTABanner from "@/components/sections/CTABanner";
import FAQSection from "@/components/sections/FAQSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import LatestPosts from "@/components/sections/LatestPosts";
import Footer from "@/components/layout/Footer";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_PAGE_SEO } from "@/lib/siteContent";

const Index = () => {
  const { content: pageSeo } = useSiteContent(SITE_KEYS.pageSeo, DEFAULT_PAGE_SEO);
  const seo = pageSeo.home;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Design & Supply",
    url: "https://designandsupply.ca",
    email: "hello@designandsupply.com",
    telephone: "+1 (800) 555-0192",
    areaServed: [
      "Montréal", "Laval", "West Island", "South Shore", "North Shore",
    ],
    description:
      "Custom closets, kitchen cabinets and garage cabinets designed live online, with local installation across Greater Montréal and supply-only shipping options across Canada where available.",
  };

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        image={seo.ogImage}
        noindex={seo.noindex}
        jsonLd={localBusinessSchema}
      />
      <div className="min-h-screen">
        <Navigation />
        <HeroSection />
        <HeroFeatures />
        <ProcessSteps />
        <ServicesSection />
        <WhyDifferent />
        <HomeGallery />
        <ProjectVideos />
        <BeforeAfter />
        <SpacePlannerPreview />
        <ServiceArea />
        <FAQSection limit={5} showViewAllButton />
        <TestimonialsSection />
        <LatestPosts />
        <CTABanner />
        <Footer />
      </div>
    </>
  );
};

export default Index;
