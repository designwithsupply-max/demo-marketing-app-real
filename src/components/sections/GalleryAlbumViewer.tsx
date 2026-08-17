"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/types";

interface GalleryAlbumViewerProps {
  item: GalleryItem;
  related: GalleryItem[];
}

const SERVICE_LINKS: Record<string, string> = {
  closet: "/closets",
  kitchen: "/kitchens",
  garage: "/garage-cabinets",
};

const TYPE_LABELS: Record<string, string> = {
  closet: "Custom Closet",
  kitchen: "Kitchen Cabinets",
  garage: "Garage Cabinets",
  other: "Custom Storage",
};

export default function GalleryAlbumViewer({ item, related }: GalleryAlbumViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const similarDesignLink = (item.type && SERVICE_LINKS[item.type]) ?? "/space-planner";

  const backLink = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get("from");
    if (from === "closet") return { href: "/closets", label: "Back to Closets" };
    if (from === "kitchen") return { href: "/kitchens", label: "Back to Kitchens" };
    if (from === "garage") return { href: "/garage-cabinets", label: "Back to Garage Cabinets" };
    return { href: "/gallery", label: "Back to Gallery" };
  }, [location.search]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
  };

  // Helper to parse dynamic specs (e.g., "Materials: Oak, Marble | Lighting: LED")
  const parseSpecs = (specStr?: string) => {
    if (!specStr) return [];
    return specStr.split("|").map((part) => {
      const parts = part.split(":");
      return {
        label: parts[0]?.trim() || "Detail",
        value: parts[1]?.trim() || part.trim(),
      };
    });
  };

  const currentImage = item.images[activeIndex];
  const specs = parseSpecs(currentImage?.spec);

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Back navigation link */}
        <div className="mb-10">
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-2 text-[#6B6B65] text-xs tracking-[0.2em] uppercase hover:text-[#C9A96E] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {backLink.label}
          </Link>
        </div>

        {/* Main Title & Category Header */}
        <div className="mb-12">
          <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">
            {item.category}
          </span>
          <h1
            className="text-[#1A1A18] font-light leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            {item.title}
          </h1>
        </div>

        {/* Interactive Album Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">

          {/* Left / Middle: Main Album Viewer & Thumbs (Span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Active Image Window */}
            <div className="relative aspect-[16/10] bg-[#1A1A18] overflow-hidden shadow-2xl group/viewer">

              {/* Previous Arrow */}
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#1A1A18]/60 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:border-[#C9A96E] hover:text-[#1A1A18] transition-all opacity-0 group-hover/viewer:opacity-100 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  <Image
                    src={currentImage.src}
                    alt={currentImage.alt || currentImage.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient shadow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Mini tag on active image */}
              <div className="absolute bottom-6 left-6 z-10">
                <span className="bg-[#1A1A18]/80 text-[#C9A96E] text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 backdrop-blur-sm">
                  Image {activeIndex + 1} of {item.images.length}
                </span>
              </div>

              {/* Next Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#1A1A18]/60 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:border-[#C9A96E] hover:text-[#1A1A18] transition-all opacity-0 group-hover/viewer:opacity-100 z-10"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Thumbnail Navigation Row */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
              {item.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`relative aspect-[3/2] w-28 flex-shrink-0 overflow-hidden border-2 transition-all duration-300 ${activeIndex === i
                    ? "border-[#C9A96E] scale-102 shadow-lg"
                    : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={img.src}
                    alt={`${item.title} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Active Image details card (Span 1) */}
          <div className="lg:col-span-1 flex flex-col justify-between bg-white border border-[#EBEBDF] p-8 shadow-sm">
            <div>
              <span className="text-[#C9A96E] text-[10px] tracking-[0.2em] uppercase block mb-3">
                Selected View
              </span>
              <h2
                className="text-[#1A1A18] font-light text-2xl mb-4"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {currentImage.title}
              </h2>
              <p className="text-[#6B6B65] text-sm leading-relaxed mb-6">
                {currentImage.description}
              </p>

              {/* Dynamic Specs Section */}
              {specs.length > 0 && (
                <div className="border-t border-[#EBEBDF] pt-6 mb-8">
                  <h3 className="text-[#1A1A18] text-xs tracking-[0.2em] uppercase mb-4">Specifications</h3>
                  <div className="flex flex-col gap-4">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex flex-col gap-1 bg-[#FAFAF7] p-3 border-l-2 border-[#C9A96E]">
                        <span className="text-[#8B7355] text-[10px] uppercase tracking-wider font-semibold">
                          {spec.label}
                        </span>
                        <span className="text-[#1A1A18] text-xs">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA action buttons */}
            <div className="mt-8 border-t border-[#EBEBDF] pt-6">
              <Link
                href={similarDesignLink}
                className="group flex items-center justify-between bg-[#C9A96E] text-[#1A1A18] text-xs tracking-[0.2em] uppercase font-medium px-6 py-4 hover:bg-[#E8D5B0] transition-colors duration-300 w-full"
              >
                Start a Similar Design
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Project Details (type, location, brief & features) */}
        {(item.type || item.city || item.clientNeeded || item.whatWeDesigned || (item.mainFeatures && item.mainFeatures.length > 0)) && (
          <div className="border-t border-[#EBEBDF] pt-16">
            <h3
              className="text-[#1A1A18] font-light text-3xl mb-8"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Project Details
            </h3>

            {(item.type || item.city) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
                {item.type && (
                  <div>
                    <span className="text-[#8B7355] text-[10px] uppercase tracking-wider font-semibold block mb-1.5">
                      Project Type
                    </span>
                    <p className="text-[#1A1A18] text-sm">{TYPE_LABELS[item.type] ?? item.type}</p>
                  </div>
                )}
                {item.city && (
                  <div>
                    <span className="text-[#8B7355] text-[10px] uppercase tracking-wider font-semibold block mb-1.5">
                      City
                    </span>
                    <p className="text-[#1A1A18] text-sm">{item.city}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {item.clientNeeded && (
                  <div>
                    <h4 className="text-[#1A1A18] text-xs tracking-[0.2em] uppercase mb-3">What the Client Needed</h4>
                    <p className="text-[#6B6B65] leading-relaxed text-sm">{item.clientNeeded}</p>
                  </div>
                )}
                {item.whatWeDesigned && (
                  <div>
                    <h4 className="text-[#1A1A18] text-xs tracking-[0.2em] uppercase mb-3">What We Designed</h4>
                    <p className="text-[#6B6B65] leading-relaxed text-sm">{item.whatWeDesigned}</p>
                  </div>
                )}
              </div>

              {item.mainFeatures && item.mainFeatures.length > 0 && (
                <div className="lg:col-span-1">
                  <h4 className="text-[#1A1A18] text-xs tracking-[0.2em] uppercase mb-4">Main Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.mainFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="bg-[#F5F0E8] text-[#8B7355] text-[11px] tracking-wider px-3.5 py-2 font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Context & Details Below Album */}
        <div className="border-t border-[#EBEBDF] pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Overview text (Span 2) */}
            <div className="lg:col-span-2">
              <h3
                className="text-[#1A1A18] font-light text-3xl mb-6"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Project Overview
              </h3>
              <p className="text-[#6B6B65] leading-relaxed text-sm mb-8">
                {item.description}
              </p>
            </div>

            {/* Tags and Specs (Span 1) */}
            <div className="lg:col-span-1">
              <h4 className="text-[#1A1A18] text-xs tracking-[0.2em] uppercase mb-4">Focus Elements</h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#F5F0E8] text-[#8B7355] text-[11px] tracking-wider px-3.5 py-2 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Projects Section */}
        {related.length > 0 && (
          <div className="border-t border-[#EBEBDF] mt-20 pt-16">
            <h3
              className="text-[#1A1A18] font-light text-2xl mb-8"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              More Inspirations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/gallery/${r.slug}`}
                  className="group block bg-white border border-[#EBEBDF] overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={r.thumbnail}
                      alt={r.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <span className="text-[#1A1A18] text-sm font-medium">{r.title}</span>
                    <ArrowRight size={14} className="text-[#C9A96E] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
