import SectionWrapper from "@/components/ui/SectionWrapper";
import { MapPin } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SITE_KEYS, DEFAULT_GLOBAL_SETTINGS } from "@/lib/siteContent";

export default function ServiceArea() {
  const { content: settings } = useSiteContent(SITE_KEYS.globalSettings, DEFAULT_GLOBAL_SETTINGS);
  const areas = settings.serviceAreas;

  return (
    <SectionWrapper className="bg-white py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">Where We Work</span>
        <h2
          className="text-brand-espresso font-light leading-tight mb-6"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
        >
          Serving Greater Montréal
        </h2>
        <p className="text-brand-muted text-sm leading-relaxed max-w-2xl mx-auto mb-10">
          Local installation is available across Greater Montréal and approximately 100&nbsp;km around the city. Supply-only shipping options across Canada may be available for select projects.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          {areas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-cream px-5 py-2.5 text-sm text-brand-espresso"
            >
              <MapPin size={14} className="text-brand-copper flex-shrink-0" />
              {area}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-copper/40 bg-brand-espresso px-5 py-2.5 text-sm text-white">
            <MapPin size={14} className="text-brand-copper-light flex-shrink-0" />
            ~100 km around Montréal
          </span>
        </div>

        <p className="text-brand-muted text-xs tracking-wide">
          Canada-wide supply/shipping options may be available for select projects.
        </p>
      </div>
    </SectionWrapper>
  );
}
