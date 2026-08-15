"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import { imageService, type GalleryViewItem } from "@/lib/imageService";

const filters = ["All", "Closets", "Kitchens", "Garage Cabinets", "Before & After"] as const;
type Filter = (typeof filters)[number];

// Map gallery types into the homepage filter groups.
function groupFor(item: GalleryViewItem): Filter {
  const t = item.type.toLowerCase();
  if (t === "kitchen") return "Kitchens";
  if (t === "garage") return "Garage Cabinets";
  return "Closets";
}

export default function HomeGallery() {
  const [active, setActive] = useState<Filter>("All");
  const [items, setItems] = useState<GalleryViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    imageService.fetchGalleryProjects()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load gallery for homepage:", err);
        setLoading(false);
      });
  }, []);

  const filtered =
    active === "All"
      ? items
      : items.filter((item) => groupFor(item) === active);

  return (
    <SectionWrapper className="bg-brand-sand py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">Real Projects</span>
          <h2
            className="text-brand-espresso font-light leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
          >
            A look at our work
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-xs tracking-[0.12em] uppercase transition-all duration-300 ${
                active === f
                  ? "bg-brand-copper text-white shadow-sm"
                  : "bg-white text-brand-muted border border-brand-border hover:border-brand-copper hover:text-brand-copper"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/gallery/${item.slug}`}
                className="group block overflow-hidden rounded-2xl bg-white border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] hover:shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)] transition-all duration-500"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <Image
                    src={item.thumbnail}
                    alt={`${item.title} — custom ${item.category.toLowerCase()} project`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6 flex items-center justify-between gap-3">
                  <div>
                    <h3
                      className="text-brand-espresso font-medium text-lg"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {item.title}
                    </h3>
                    <span className="text-brand-copper text-xs tracking-[0.12em] uppercase">{item.category}</span>
                  </div>
                  <ArrowRight size={18} className="text-brand-copper flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-brand-border bg-white">
            <p className="text-brand-muted text-sm">More {active.toLowerCase()} projects coming soon.</p>
          </div>
        )}

        {/* View all */}
        <div className="text-center mt-12">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-brand-copper text-xs tracking-[0.2em] uppercase hover:gap-3 transition-all duration-300"
          >
            View Full Gallery
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}