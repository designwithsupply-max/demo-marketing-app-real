import SectionWrapper from "@/components/ui/SectionWrapper";
import { Check, X } from "lucide-react";

const traditional = [
  "Showroom appointment",
  "Slow quote",
  "In-home visit needed",
  "Hard to compare prices",
  "Long process",
];

const designSupply = [
  "Measure online",
  "Live CAD design",
  "Same-day quote",
  "Fully assembled cabinets",
  "Easy process from home",
  "Closets, kitchens, and garages",
];

export default function WhyDifferent() {
  return (
    <SectionWrapper className="bg-brand-cream py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">The Difference</span>
          <h2
            className="text-brand-espresso font-light leading-tight mb-6"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
          >
            Why Design &amp; Supply is different
          </h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-2xl mx-auto">
            <span className="text-brand-espresso font-medium">Why our prices are lower: </span>
            Traditional custom cabinet companies often include showroom costs, multiple in-home visits, high sales commissions and large markups. Design &amp; Supply uses an online-first process, live remote design and efficient production to reduce overhead and offer custom cabinets at very competitive prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional */}
          <div className="rounded-2xl border border-brand-border bg-white p-8 lg:p-10">
            <h3
              className="text-brand-muted font-medium text-xl mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Traditional Companies
            </h3>
            <ul className="flex flex-col gap-4">
              {traditional.map((item) => (
                <li key={item} className="flex items-center gap-3 text-brand-muted text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-sand-light flex items-center justify-center">
                    <X size={13} className="text-[#A89685]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Design & Supply */}
          <div className="rounded-2xl border border-brand-copper/30 bg-brand-espresso p-8 lg:p-10 shadow-[0_16px_40px_-12px_rgba(45,36,30,0.35)]">
            <h3
              className="text-white font-medium text-xl mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Design &amp; Supply
            </h3>
            <ul className="flex flex-col gap-4">
              {designSupply.map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/90 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-copper flex items-center justify-center">
                    <Check size={13} className="text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
