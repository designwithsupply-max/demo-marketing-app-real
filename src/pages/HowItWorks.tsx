import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, CalendarCheck, Ruler, Palette, Hammer } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CTABanner from "@/components/sections/CTABanner";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_HOWITWORKS_STEPS } from "@/lib/siteContent";

// Icons stay fixed per step position; the text and images come from the CMS.
const STEP_ICONS = [CalendarCheck, Ruler, Palette, Hammer, CheckCircle];

interface TimelineStepData {
  number: string;
  title: string;
  description: string;
  detail: string;
  duration: string;
  image: string;
  icon: any;
}

const includes = [
  "Free in-home or video consultation",
  "Full 3D design visualization",
  "Itemized transparent pricing",
  "Premium material samples",
  "Expert installation team",
  "10-year structural warranty",
  "Post-install support",
  "Lifetime design consultation access"
];

function TimelineStep({ step, index, total }: { step: TimelineStepData; index: number; total: number }) {
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? "lg:flex lg:flex-row-reverse" : ""}`}
    >
      {/* Content */}
      <div className="flex gap-4 sm:gap-6 w-full">
        <div className="flex flex-col items-center shrink-0">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-[18px] sm:rounded-[22px] bg-[#B86B49] text-white flex items-center justify-center shrink-0 shadow-[0_10px_20px_rgba(184,107,73,0.15)]">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          {index < total - 1 && (
            <div className="w-[2px] flex-1 bg-[#E5DCD0] mt-4 min-h-[80px]" />
          )}
        </div>
        <div className="pb-8 sm:pb-12 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <span className="text-[#B86B49] text-xs font-semibold tracking-wider uppercase">
              STEP {Number(step.number)}
            </span>
            <span className="text-[#8C867E] text-[10px] tracking-wider uppercase bg-[#F3EFE9] rounded-full px-3 py-1 font-medium">
              {step.duration}
            </span>
          </div>
          <h3 className="text-[#1A1A18] text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {step.title}
          </h3>
          <p className="text-[#6F6762] text-sm leading-relaxed mb-4">{step.description}</p>
          <p className="text-sm text-[#8A8179] leading-relaxed bg-[#F5EFE6] rounded-2xl p-4 sm:p-5">
            {step.detail}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl group w-full animate-fadeIn">
        <Image
          src={step.image}
          alt={step.title}
          fill
          className="object-cover group-hover:scale-102 transition-transform duration-700"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const [pricingTiers, setPricingTiers] = useState<Array<{ price: string; label: string }>>([
    ["$2,500+", "Sliding Wardrobes"],
    ["$4,500+", "Walk-in Closets"],
    ["$8,000+", "Dressing Rooms"],
    ["Custom", "Luxury Suites"],
  ].map(([price, label]) => ({ price, label })));

  useEffect(() => {
    supabase
      .from("pricing_tiers")
      .select("price, label")
      .eq("is_active", true)
      .order("order_index")
      .then(({ data }) => {
        if (data && data.length > 0) setPricingTiers(data);
      });
  }, []);

  const { content: hiw } = useSiteContent(SITE_KEYS.howItWorksSteps, DEFAULT_HOWITWORKS_STEPS);
  const steps: TimelineStepData[] = hiw.steps.map((s, i) => ({
    number: String(i + 1).padStart(2, "0"),
    title: s.title,
    description: s.description,
    detail: s.detail,
    duration: s.duration,
    image: s.imageUrl,
    icon: STEP_ICONS[i] ?? CheckCircle,
  }));

  return (
    // overflow-x-clip contains the timeline's slide-in animation (each step
    // starts offset on the x-axis), which would otherwise push past the
    // viewport and cause horizontal scrolling on mobile.
    <div className="min-h-screen flex flex-col justify-between overflow-x-clip">
      <SeoHead
        title="How It Works | Design & Supply"
        description="See how our online process works: measure your space, meet a designer live, and get a same-day quote for fully assembled cabinets."
      />
      <Navigation />
      <div className="flex-grow">
        {/* Hero */}
        <div className="bg-[#1A1A18] pt-28 pb-16 sm:pt-32 sm:pb-24 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">The Process</span>
              <h1
                className="text-white font-light leading-tight mb-6"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
              >
                How Your Dream Closet<br />
                <em className="text-[#C9A96E] not-italic">Comes to Life</em>
              </h1>
              <p className="text-white/50 text-sm leading-relaxed">
                A transparent, stress-free journey from first conversation to final reveal. Our five-step process is designed around you.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-[#FAFAF7] py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-20 px-6">
            <span className="text-[#B86B49] text-xs font-semibold tracking-[0.2em] uppercase block mb-4">
              The Journey
            </span>
            <h2
              className="text-[#1A1A18] font-bold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
            >
              Your 5-Step Transformation
            </h2>
            <p className="text-[#6B6B65] text-sm leading-relaxed max-w-xl mx-auto">
              Every project follows our proven process — designed to be stress-free for you and deliver exceptional results every time.
            </p>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex flex-col gap-10 sm:gap-12">
              {steps.map((step, i) => (
                <TimelineStep key={step.number} step={step} index={i} total={steps.length} />
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Transparency */}
        <div className="bg-[#F5F0E8] py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">Pricing</span>
                <h2
                  className="text-[#1A1A18] font-light text-3xl mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Transparent Pricing.<br />No Surprises.
                </h2>
                <p className="text-[#6B6B65] text-sm leading-relaxed mb-6">
                  Every project includes a fully itemized quote before any commitment. Our pricing is transparent, comprehensive, and guaranteed. What we quote is what you pay.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {pricingTiers.map((tier) => (
                    <div key={tier.label} className="bg-white p-5 border-l-2 border-[#C9A96E]">
                      <span className="text-[#1A1A18] text-2xl font-light block" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{tier.price}</span>
                      <span className="text-[#6B6B65] text-xs tracking-wider">{tier.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/space-planner" className="group inline-flex items-center gap-3 bg-[#C9A96E] text-[#1A1A18] text-xs tracking-[0.2em] uppercase font-medium px-8 py-4 hover:bg-[#E8D5B0] transition-all duration-300">
                  Get Your Free Quote
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Included */}
              <div className="bg-[#1A1A18] p-6 sm:p-10">
                <h3 className="text-white font-light text-xl mb-6 sm:mb-8" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Every Project Includes
                </h3>
                <div className="flex flex-col gap-4">
                  {includes.map(item => (
                    <div key={item} className="flex items-center gap-4">
                      <CheckCircle size={16} className="text-[#C9A96E] flex-shrink-0" />
                      <span className="text-white/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CTABanner />
      </div>
      <Footer />
    </div>
  );
}
