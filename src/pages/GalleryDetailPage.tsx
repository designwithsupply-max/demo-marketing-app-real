import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import GalleryAlbumViewer from "@/components/sections/GalleryAlbumViewer";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { imageService, type GalleryViewItem } from "@/lib/imageService";

export default function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>(); // slug from URL (e.g. "/gallery/belmont-walk-in")
  const [item, setItem] = useState<GalleryViewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    imageService.fetchGalleryProjectBySlug(id)
      .then(data => {
        // A deactivated project shouldn't 404 outright — send visitors
        // somewhere useful instead, same as a deactivated service page.
        setItem(data && data.isActive ? data : null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load gallery project:", err);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Navigation />
        <div className="flex-1 flex items-center justify-center bg-[#FAFAF7]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return <Navigate to="/gallery" replace />;
  }

  // Find related items — we'll fetch all and filter client-side for now
  // The GalleryAlbumViewer needs items in the GalleryItem format from src/types/index.ts
  // GalleryViewItem is compatible with it (same shape)
  const relatedItems: GalleryViewItem[] = [];

  const seoTitle = `${item.title} — ${item.category} Project${item.city ? ` in ${item.city}` : ""} | Design & Supply`;
  const seoDescription =
    item.description ||
    `${item.title}: a custom ${item.category.toLowerCase()} project${item.city ? ` in ${item.city}` : ""} by Design & Supply. See photos and details from this real installation.`;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        image={item.thumbnail}
        path={`/gallery/${item.slug}`}
      />
      <Navigation />
      <div className="flex-1">
        <GalleryAlbumViewer
          item={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            category: item.category,
            type: item.type,
            thumbnail: item.thumbnail,
            images: item.images.map(img => ({
              src: img.src,
              title: img.title,
              description: img.description,
              spec: img.spec,
              alt: img.alt,
            })),
            description: item.description,
            tags: item.tags,
            city: item.city,
            clientNeeded: item.clientNeeded,
            whatWeDesigned: item.whatWeDesigned,
            mainFeatures: item.mainFeatures,
          }}
          related={relatedItems}
        />
      </div>
      <Footer />
    </div>
  );
}