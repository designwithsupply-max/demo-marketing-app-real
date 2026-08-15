import { useEffect, useState } from "react";
import { servicePagesService } from "@/lib/servicePagesService";
import { DEFAULT_SERVICE_PAGES } from "@/lib/defaultServicePages";

export interface ServiceNavLink {
  href: string;
  label: string;
}

/** Shown until the DB responds, and if the service_pages migration hasn't
 * been applied yet — keeps the Services dropdown and footer links working
 * either way, while /admin/services remains the source of truth once live.
 * Derived from the same defaults ServicePage.tsx falls back to, so the nav
 * links and the pages they point to can't drift out of sync. */
const FALLBACK_LINKS: ServiceNavLink[] = Object.values(DEFAULT_SERVICE_PAGES)
  .filter((p) => p.show_in_nav)
  .sort((a, b) => a.display_order - b.display_order)
  .map((p) => ({ href: `/${p.slug}`, label: p.nav_label }));

/** Services nav/footer links, admin-editable via /admin/services (add, rename,
 * reorder, or hide any of them without a code change or redeploy). */
export function useServiceNavLinks() {
  const [links, setLinks] = useState<ServiceNavLink[]>(FALLBACK_LINKS);

  useEffect(() => {
    let cancelled = false;
    servicePagesService
      .fetchActive()
      .then((pages) => {
        if (cancelled) return;
        const navPages = pages.filter((p) => p.show_in_nav);
        if (navPages.length > 0) {
          setLinks(navPages.map((p) => ({ href: `/${p.slug}`, label: p.nav_label })));
        }
      })
      .catch(() => {
        // Table not migrated yet, or offline — keep the fallback list.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}
