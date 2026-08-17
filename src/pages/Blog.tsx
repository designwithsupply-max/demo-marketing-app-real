import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { SeoHead } from "@/components/seo/SeoHead";
import Footer from "@/components/layout/Footer";
import { blogService, type BlogPost } from "@/lib/blogService";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_PAGE_SEO } from "@/lib/siteContent";

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

const Blog = () => {
  const { content: pageSeo } = useSiteContent(SITE_KEYS.pageSeo, DEFAULT_PAGE_SEO);
  const seo = pageSeo.blog;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const PAGE_SIZE = 9;

  useEffect(() => {
    blogService
      .fetchPublished()
      .then(setPosts)
      .catch((e) => console.error("Failed to load blog posts:", e))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))];
  const featured = activeCategory === "All" && page === 1 ? posts.find((p) => p.is_featured) : undefined;
  const filtered = (activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory))
    .filter((p) => p.id !== featured?.id);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goTo = (p: number) => {
    setPage(Math.min(Math.max(1, p), pageCount));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SeoHead title={seo.title} description={seo.description} image={seo.ogImage} noindex={seo.noindex} />
      <Navigation />
      <main className="min-h-screen bg-brand-cream">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 text-center">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-3">The Journal</span>
          <h1 className="text-brand-espresso font-light leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
            {seo.h1 || "Ideas & Inspiration"}
          </h1>
          <p className="text-brand-muted max-w-2xl mx-auto mt-3 leading-relaxed">
            Guides, design thinking, and behind-the-scenes stories on getting the most from your space.
          </p>

          {!loading && categories.length > 2 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveCategory(c); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs tracking-[0.1em] uppercase transition-all duration-300 ${
                    activeCategory === c
                      ? "bg-brand-copper text-white"
                      : "bg-white text-brand-muted border border-brand-border hover:border-brand-copper hover:text-brand-copper"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {!loading && featured && (
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-xl overflow-hidden border border-brand-border hover:shadow-xl transition-shadow mb-10"
            >
              <div className="aspect-[16/10] md:aspect-auto bg-brand-sand overflow-hidden">
                {featured.cover_image_url ? (
                  <img src={featured.cover_image_url} alt={featured.image_alt || featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted/40" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem" }}>D&amp;S</div>
                )}
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <span className="text-brand-copper text-xs tracking-[0.2em] uppercase font-medium mb-3">Featured</span>
                <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(featured.published_at)}
                  {featured.author && <span>· {featured.author}</span>}
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-brand-espresso leading-snug" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {featured.title}
                </h2>
                {featured.excerpt && <p className="text-sm text-brand-muted mt-3 line-clamp-3">{featured.excerpt}</p>}
                <span className="inline-flex items-center gap-1.5 mt-5 text-brand-copper text-sm font-medium group-hover:gap-2.5 transition-all">
                  Read more <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-copper" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-brand-muted">No posts yet — check back soon.</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20 text-brand-muted">No posts in this category yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visible.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white rounded-xl overflow-hidden border border-brand-border hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-[16/10] bg-brand-sand overflow-hidden">
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={post.image_alt || post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted/40" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem" }}>D&amp;S</div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.published_at)}
                      {post.author && <span>· {post.author}</span>}
                    </div>
                    <h2 className="text-xl font-semibold text-brand-espresso leading-snug" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="text-sm text-brand-muted mt-2 line-clamp-3 flex-grow">{post.excerpt}</p>}
                    <span className="inline-flex items-center gap-1.5 mt-4 text-brand-copper text-sm font-medium group-hover:gap-2.5 transition-all">
                      Read more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-brand-border text-sm text-brand-espresso disabled:opacity-40 hover:border-brand-copper hover:text-brand-copper transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goTo(n)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    n === page ? "bg-brand-copper text-white" : "text-brand-muted hover:bg-brand-sand"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => goTo(page + 1)}
                disabled={page === pageCount}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-brand-border text-sm text-brand-espresso disabled:opacity-40 hover:border-brand-copper hover:text-brand-copper transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Blog;
