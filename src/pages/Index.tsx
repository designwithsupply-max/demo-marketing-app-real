import { SeoHead } from "@/components/seo/SeoHead";
import { Navigation } from "@/components/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import HeroFeatures from "@/components/sections/HeroFeatures";
import ProcessSteps from "@/components/sections/ProcessSteps";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyDifferent from "@/components/sections/WhyDifferent";
import HomeGallery from "@/components/sections/HomeGallery";
import { BeforeAfter } from "@/components/BeforeAfter";
import SpacePlannerPreview from "@/components/sections/SpacePlannerPreview";
import ServiceArea from "@/components/sections/ServiceArea";
import CTABanner from "@/components/sections/CTABanner";
import FAQSection from "@/components/sections/FAQSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import LatestPosts from "@/components/sections/LatestPosts";
import Footer from "@/components/layout/Footer";

const Index = () => {
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
        title="Custom Closets, Kitchens & Garage Cabinets in Greater Montréal | Design & Supply"
        description="Custom closets, kitchen cabinets and garage cabinets designed live online. Local installation in Greater Montréal, with same-day quotes when possible."
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
