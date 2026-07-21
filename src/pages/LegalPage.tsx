import { Navigation } from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import { SeoHead } from "@/components/seo/SeoHead";
import { useSiteContent } from "@/hooks/useSiteContent";
import { renderMarkdown } from "@/lib/renderMarkdown";
import {
  SITE_KEYS,
  DEFAULT_TERMS,
  DEFAULT_PRIVACY,
  type LegalContent,
} from "@/lib/siteContent";

/**
 * Renders an editable legal page (Terms of Service or Privacy Policy). The copy
 * lives in `site_content` and is managed from /admin/legal, so the body is
 * authored as Markdown-lite and rendered with renderMarkdown().
 */
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const key = kind === "terms" ? SITE_KEYS.terms : SITE_KEYS.privacy;
  const fallback = kind === "terms" ? DEFAULT_TERMS : DEFAULT_PRIVACY;
  const { content } = useSiteContent<LegalContent>(key, fallback);

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead
        title={`${content.title} | Design & Supply`}
        description={`${content.title} for Design & Supply.`}
      />
      <Navigation />
      <main className="flex-grow pt-24 lg:pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">
            Legal
          </span>
          <h1
            className="text-brand-espresso font-light"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            {content.title}
          </h1>
          {content.updated && (
            <p className="text-brand-muted text-sm mt-3">{content.updated}</p>
          )}
          <div className="mt-8 border-t border-brand-border pt-2">
            {renderMarkdown(content.body)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
