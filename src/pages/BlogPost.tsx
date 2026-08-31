import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { SeoHead } from "@/components/seo/SeoHead";
import Footer from "@/components/layout/Footer";
import { blogService, type BlogPost as BlogPostType } from "@/lib/blogService";
import { renderMarkdown } from "@/lib/renderMarkdown";

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogService
      .fetchBySlug(slug)
      .then((p) => {
        if (p) setPost(p);
        else setNotFound(true);
      })
      .catch((e) => {
        console.error("Failed to load post:", e);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const articleSchema = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.seo_description || post.excerpt || undefined,
        image: post.cover_image_url || undefined,
        author: { "@type": "Organization", name: post.author || "Design & Supply" },
        publisher: { "@type": "Organization", name: "Design & Supply" },
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at || post.published_at || undefined,
        mainEntityOfPage: `https://designandsupply.ca/blog/${post.slug}`,
      }
    : undefined;

  return (
    <>
      <SeoHead
        title={post ? (post.seo_title || `${post.title} — Design & Supply`) : "Blog — Design & Supply"}
        description={(post?.seo_description || post?.excerpt) ?? undefined}
        image={post?.cover_image_url ?? undefined}
        path={post ? `/blog/${post.slug}` : undefined}
        jsonLd={articleSchema}
      />
      <Navigation />
      <main className="min-h-screen bg-brand-cream">
        {loading ? (
          <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-brand-copper" /></div>
        ) : notFound || !post ? (
          <div className="max-w-3xl mx-auto px-6 py-40 text-center">
            <h1 className="text-3xl text-brand-espresso font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Post not found</h1>
            <Link to="/blog" className="text-brand-copper inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to the blog</Link>
          </div>
        ) : (
          <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-copper transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to the blog
            </Link>

            <div className="flex items-center gap-2 text-sm text-brand-muted mb-3">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at)}
              {post.author && <span>· {post.author}</span>}
            </div>

            <h1 className="text-brand-espresso font-light leading-tight mb-8" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
              {post.title}
            </h1>

            {/* Two-column layout: image on the left, description on the right */}
            <div className={`grid gap-8 lg:gap-12 items-start ${post.cover_image_url ? "lg:grid-cols-2" : "grid-cols-1"}`}>
              {post.cover_image_url && (
                <div className="lg:sticky lg:top-28">
                  <img
                    src={post.cover_image_url}
                    alt={post.image_alt || post.title}
                    className="w-full max-h-[520px] object-cover rounded-xl border border-brand-border"
                  />
                </div>
              )}

              <div className={post.cover_image_url ? "" : "max-w-3xl"}>
                {post.excerpt && <p className="text-lg text-brand-muted italic mb-6">{post.excerpt}</p>}
                <div className="prose-content">{renderMarkdown(post.content)}</div>
              </div>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  );
};

export default BlogPost;
