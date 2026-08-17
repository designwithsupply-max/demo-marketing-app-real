import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_GLOBAL_SETTINGS } from "@/lib/siteContent";

/**
 * Loads gtag.js only when a Google Analytics ID is set in Global Settings.
 * Renders nothing and does nothing at all until an admin sets an ID.
 */
export function GoogleAnalytics() {
  const { content: settings } = useSiteContent(SITE_KEYS.globalSettings, DEFAULT_GLOBAL_SETTINGS);
  const id = settings.googleAnalyticsId?.trim();

  useEffect(() => {
    if (!id) return;
    if (document.querySelector(`script[data-ga-id="${id}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.setAttribute("data-ga-id", id);
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.setAttribute("data-ga-id", id);
    inline.textContent = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`;
    document.head.appendChild(inline);

    return () => {
      script.remove();
      inline.remove();
    };
  }, [id]);

  return null;
}

export default GoogleAnalytics;
