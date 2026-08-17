import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
  /** Route path for canonical/og:url. Defaults to the current pathname. */
  path?: string;
  /** OG/Twitter image (absolute URL or root-relative path). */
  image?: string;
  /** Set true for pages that should not be indexed (admin, auth, etc). */
  noindex?: boolean;
}

const SITE_NAME = "Design & Supply";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function SeoHead({ title, description, jsonLd, path, image, noindex }: SeoHeadProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + (path ?? window.location.pathname);
    const img = image
      ? image.startsWith("http")
        ? image
        : origin + image
      : origin + "/og-image.jpg";

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");
    upsertLink("canonical", url);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:image", img);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", img);
  }, [title, description, path, image, noindex]);

  useEffect(() => {
    if (!jsonLd) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [jsonLd]);

  return null;
}
