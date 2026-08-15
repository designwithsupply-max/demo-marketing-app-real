import SectionWrapper from "@/components/ui/SectionWrapper";
import { Ruler, MonitorPlay, FileCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Ruler,
    title: "Send Your Space",
    description: "Use the 3-Step Space Planner to send measurements, photos and videos.",
  },
  {
    number: "02",
    icon: MonitorPlay,
    title: "Design Live Online",
    description: "Meet with a designer by screen share and review your custom design.",
  },
  {
    number: "03",
    icon: FileCheck,
    title: "Quote & Order",
    description: "Receive your quote, approve your design, and choose pickup, delivery or installation.",
  },
];

export default function ProcessSteps() {
  return (
    <SectionWrapper className="bg-brand-cream py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-copper text-xs tracking-[0.3em] uppercase block mb-4">How It Works</span>
          <h2
            className="text-brand-espresso font-light"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            From your home, in three simple steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative flex flex-col items-start text-left p-8 lg:p-10 bg-white rounded-2xl border border-brand-border shadow-[0_8px_30px_-12px_rgba(45,36,30,0.12)] hover:shadow-[0_16px_40px_-12px_rgba(45,36,30,0.2)] hover:-translate-y-1 transition-all duration-300"
              >
                <span
                  className="absolute top-6 right-8 text-brand-sand-light text-6xl font-light leading-none select-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {step.number}
                </span>
                <div className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center bg-brand-sand group-hover:bg-brand-copper transition-colors duration-300 mb-6">
                  <Icon size={24} className="text-brand-copper group-hover:text-white transition-colors duration-300" />
                </div>

                <h3
                  className="text-brand-espresso font-medium mb-3 text-2xl"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Step {step.number.replace("0", "")} — {step.title}
                </h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
