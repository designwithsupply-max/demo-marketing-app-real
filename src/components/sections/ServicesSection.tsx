"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_SERVICES } from "@/lib/siteContent";

export default function ServicesSection() {
  const { content } = useSiteContent(SITE_KEYS.services, DEFAULT_SERVICES);
  const serviceCards = content.cards;
  return (
    <SectionWrapper className="bg-brand-sand py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">{content.eyebrow}</span>
          <h2
            className="text-brand-espresso font-light leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
          >
            {content.heading}
          </h2>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCards.map((service) => (
            <Link
              key={service.title}
              href={service.link}
              className="group block overflow-hidden bg-white rounded-2xl border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] hover:shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)] transition-all duration-500"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3]">
                <Image
                  src={service.imageUrl}
                  alt={`Custom ${service.title.toLowerCase()} designed and supplied by Design & Supply`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-brand-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-copper flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <ArrowRight size={16} className="text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-7">
                <h3
                  className="text-brand-espresso font-medium text-2xl mb-3 group-hover:text-brand-copper transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {service.title}
                </h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-brand-copper text-xs tracking-[0.15em] uppercase">
                  <span>{service.buttonLabel || `Explore ${service.title}`}</span>
                  <span className="w-6 h-px bg-brand-copper group-hover:w-10 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
