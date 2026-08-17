import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { imageService, type GalleryViewItem } from "@/lib/imageService";
import { ProjectVideos } from "@/components/sections/ProjectVideos";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_PAGE_SEO } from "@/lib/siteContent";

export default function Gallery() {
  const { content: pageSeo } = useSiteContent(SITE_KEYS.pageSeo, DEFAULT_PAGE_SEO);
  const seo = pageSeo.gallery;
  const [items, setItems] = useState<GalleryViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeAlbum, setActiveAlbum] = useState<GalleryViewItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    imageService.fetchGalleryProjects()
      .then(data => {
        setItems(data.filter(item => item.isActive));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load gallery:", err);
        setError("Failed to load gallery. Please try again later.");
        setLoading(false);
      });
  }, []);

  // Derive categories from items (unique categories, with "All" first)
  const categories = ["All", ...Array.from(new Set(items.map(i => i.category))).sort()];

  const filtered = activeCategory === "All"
    ? items
    : items.filter(item => item.category === activeCategory);

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
        <Navigation />
        <div className="flex-grow flex items-center justify-center bg-[#FAFAF7]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
        <Navigation />
        <div className="flex-grow flex items-center justify-center bg-[#FAFAF7]">
          <p className="text-[#6B6B65]">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
      <Navigation />
      <div className="flex-grow">
        {/* Hero */}
        <div className="bg-[#1A1A18] pt-32 pb-20 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <span className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase block mb-4">Our Work</span>
            <h1
              className="text-white font-light"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
            >
              {seo.h1 || "Closet Inspirations"}
            </h1>
            <p className="text-white/50 mt-4 max-w-xl text-sm">
              Browse our portfolio of custom closet transformations. Each project is a unique collaboration between our designers and clients.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#FAFAF7] border-b border-[#EBEBDF] sticky top-20 z-30">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setVisibleCount(9); }}
                  className={`flex-shrink-0 px-6 py-5 text-xs tracking-[0.2em] uppercase border-b-2 transition-all duration-200 ${activeCategory === cat
                    ? "border-[#C9A96E] text-[#C9A96E]"
                    : "border-transparent text-[#6B6B65] hover:text-[#1A1A18]"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-[#FAFAF7] py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            {visible.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#6B6B65]">No projects found in this category.</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {visible.map((item) => (
                  <div key={item.id} className="break-inside-avoid group relative overflow-hidden bg-white">
                    <div
                      className="relative overflow-hidden cursor-pointer"
                    >
                      
                      <Image
                        src={item.thumbnail}
                        alt={item.images.find(i => i.src === item.thumbnail)?.alt || item.title}
                        width={600}
                        height={700}
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-[#1A1A18]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-start justify-end p-6">
                        <span className="text-[#C9A96E] text-[10px] tracking-[0.2em] uppercase mb-2">{item.category}</span>
                        <h3 className="text-white font-light text-lg" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    {/* View Project link */}
                    <div className="p-4 flex items-center justify-between border-t border-[#EBEBDF]">
                      <span className="text-[#1A1A18] text-sm font-light">{item.title}</span>
                      <Link
                        href={`/gallery/${item.slug}`}
                        className="group/link inline-flex items-center gap-2 text-[#C9A96E] text-[10px] tracking-[0.15em] uppercase hover:gap-3 transition-all"
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {visibleCount < filtered.length && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount(v => v + 6)}
                  className="border border-[#1A1A18] text-[#1A1A18] text-xs tracking-[0.2em] uppercase px-10 py-4 hover:bg-[#1A1A18] hover:text-white transition-all duration-300"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>

        <ProjectVideos />

        {/* Album Lightbox */}
        {activeAlbum && (
          <div
            className="fixed inset-0 z-50 bg-[#1A1A18]/95 flex flex-col justify-between p-6 overflow-y-auto"
            onClick={() => setActiveAlbum(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-6 right-6 w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors z-50 bg-[#1A1A18]/80"
              onClick={() => setActiveAlbum(null)}
            >
              <X size={18} />
            </button>

            {/* Main Viewer Area */}
            <div className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto w-full py-12 gap-6" onClick={e => e.stopPropagation()}>
              <div className="relative w-full aspect-[4/3] max-h-[60vh] flex items-center justify-center group/viewer">
                {/* Prev Button */}
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#1A1A18]/80 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:border-[#C9A96E] hover:text-[#1A1A18] transition-all opacity-0 group-hover/viewer:opacity-100 z-10"
                  onClick={() => setActiveImageIndex(prev => (prev === 0 ? activeAlbum.images.length - 1 : prev - 1))}
                >
                  <ChevronLeft size={20} />
                </button>

                <Image
                  src={activeAlbum.images[activeImageIndex].src}
                  alt={activeAlbum.images[activeImageIndex].alt || activeAlbum.images[activeImageIndex].title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  priority
                />

                {/* Next Button */}
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-[#1A1A18]/80 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:border-[#C9A96E] hover:text-[#1A1A18] transition-all opacity-0 group-hover/viewer:opacity-100 z-10"
                  onClick={() => setActiveImageIndex(prev => (prev === activeAlbum.images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Selected Image Description and Details */}
              <div className="text-center max-w-2xl px-4">
                <span className="text-[#C9A96E] text-[10px] tracking-[0.25em] uppercase block mb-1">
                  {activeAlbum.category} — IMAGE {activeImageIndex + 1} OF {activeAlbum.images.length}
                </span>
                <h3 className="text-white text-2xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {activeAlbum.images[activeImageIndex].title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {activeAlbum.images[activeImageIndex].description}
                </p>
                {activeAlbum.images[activeImageIndex].spec && (
                  <div className="inline-block bg-white/5 border border-white/10 text-white/80 text-xs px-4 py-2 tracking-wide rounded-md">
                    {activeAlbum.images[activeImageIndex].spec}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-3 justify-center overflow-x-auto w-full scrollbar-hide py-2">
                {activeAlbum.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-16 flex-shrink-0 overflow-hidden border-2 transition-all duration-300 ${activeImageIndex === i ? "border-[#C9A96E] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                  >
                    <Image
                      src={img.src}
                      alt={`${activeAlbum.title} thumb ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}