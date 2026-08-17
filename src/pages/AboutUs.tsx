import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Users, Home, Star } from "lucide-react";
import CTABanner from "@/components/sections/CTABanner";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_ABOUT, DEFAULT_PAGE_SEO } from "@/lib/siteContent";

// Icons stay fixed and pair with the editable value cards by position.
const valueIcons = [Award, Users, Home, Star];

export default function AboutUs() {
  const { content } = useSiteContent(SITE_KEYS.about, DEFAULT_ABOUT);
  const { content: pageSeo } = useSiteContent(SITE_KEYS.pageSeo, DEFAULT_PAGE_SEO);
  const seo = pageSeo.about;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
      <Navigation />
      <div className="flex-grow">
        {/* Hero */}
        <div className="relative bg-[#1A1A18] pt-32 pb-0 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-0 items-end">
            <div className="pb-24">
              <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">{content.heroEyebrow}</span>
              <h1
                className="text-white font-light leading-tight mb-6"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
              >
                {content.heroHeadingLine1}<br />
                <em className="text-[#C9A96E] not-italic">{content.heroHeadingEmphasis}</em><br />
                {content.heroHeadingLine3}
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-md">
                {content.heroIntro}
              </p>
            </div>
            <div className="relative h-64 lg:h-full min-h-[400px] overflow-hidden">
              <Image
                src={content.heroImageUrl}
                alt="Luxury walk-in closet"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A18]/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="bg-[#FAFAF7] py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">{content.storyEyebrow}</span>
                <div className="space-y-6">
                  {content.timeline.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-[#C9A96E] text-sm font-medium w-10 flex-shrink-0 mt-0.5">{item.year}</span>
                      <p className="text-[#6B6B65] text-sm leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8">
                <h2
                  className="text-[#1A1A18] font-light text-3xl mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {content.storyHeadingLine1}<br />{content.storyHeadingLine2}
                </h2>
                <div className="space-y-4 text-[#6B6B65] text-sm leading-relaxed">
                  {content.storyParagraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-[#EBEBDF]">
                  {content.stats.map((stat, i) => (
                    <div key={i}>
                      <span className="text-[#1A1A18] text-4xl font-light block mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{stat.value}</span>
                      <span className="text-[#6B6B65] text-xs tracking-[0.15em] uppercase">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-[#1A1A18] py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-12 border border-white/10">
              <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-6">{content.missionEyebrow}</span>
              <p
                className="text-white font-light text-2xl leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {content.missionText}
              </p>
            </div>
            <div className="p-12 bg-[#C9A96E]">
              <span className="text-[#1A1A18]/60 text-xs tracking-[0.3em] uppercase block mb-6">{content.visionEyebrow}</span>
              <p
                className="text-[#1A1A18] font-light text-2xl leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {content.visionText}
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-[#F5F0E8] py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="text-center mb-16">
              <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">{content.valuesEyebrow}</span>
              <h2
                className="text-[#1A1A18] font-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 3vw, 3rem)" }}
              >
                {content.valuesHeading}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.values.map(({ title, description }, i) => {
                const Icon = valueIcons[i % valueIcons.length];
                return (
                  <div key={i} className="bg-white p-8 group hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 border border-[#C9A96E] flex items-center justify-center mb-6 group-hover:bg-[#C9A96E] transition-colors duration-300">
                      <Icon size={20} className="text-[#C9A96E] group-hover:text-[#1A1A18] transition-colors duration-300" />
                    </div>
                    <h3 className="text-[#1A1A18] font-medium text-base mb-3">{title}</h3>
                    <p className="text-[#6B6B65] text-sm leading-relaxed">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        <CTABanner />
      </div>
      <Footer />
    </div>
  );
}