"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import type { GalleryViewItem } from "@/lib/imageService";

interface ServiceProjectGridProps {
  projects: GalleryViewItem[];
  loading: boolean;
  type: "closet" | "kitchen" | "garage";
}

export default function ServiceProjectGrid({ projects, loading, type }: ServiceProjectGridProps) {
  const typeLabel = type === "closet" ? "Closet" : type === "kitchen" ? "Kitchen" : "Garage Cabinets";

  return (
    <section className="bg-brand-cream px-6 lg:px-10 py-14">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-3">Recent Projects</span>
          <h2
            className="text-brand-espresso font-light leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}
          >
            {typeLabel} installations we've delivered
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-copper" />
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  href={`/gallery/${project.slug}?from=${type}`}
                  className="group block overflow-hidden rounded-2xl bg-white border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] hover:shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)] transition-all duration-500"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <Image
                      src={project.thumbnail}
                      alt={`${project.title} — custom ${project.category.toLowerCase()} project`}
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
                        {project.title}
                      </h3>
                      <span className="text-brand-copper text-xs tracking-[0.12em] uppercase">{project.category}</span>
                    </div>
                    <ArrowRight size={18} className="text-brand-copper flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-brand-copper text-xs tracking-[0.2em] uppercase hover:gap-3 transition-all duration-300"
              >
                View Full Gallery
                <ArrowRight size={14} />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-brand-border bg-white">
            <p className="text-brand-muted text-sm">More {typeLabel.toLowerCase()} projects coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}