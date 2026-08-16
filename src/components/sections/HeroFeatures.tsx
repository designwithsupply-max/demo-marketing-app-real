"use client";

import SectionWrapper from "@/components/ui/SectionWrapper";
import { Laptop, Clock3, MapPin, CalendarCheck, Truck } from "lucide-react";

const FEATURES = [
  { icon: Laptop, label: "Free Live Online Design" },
  { icon: Clock3, label: "Same-Day Quote When Possible" },
  { icon: MapPin, label: "Local Installation in Greater Montréal" },
  { icon: CalendarCheck, label: "Ready in Under 3 Weeks" },
  { icon: Truck, label: "Pickup, Curbside Delivery or White-Glove Installation" },
];

export default function HeroFeatures() {
  return (
    <SectionWrapper className="bg-white border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-5 sm:justify-between">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 max-w-[220px]">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-copper/10 flex items-center justify-center">
                <Icon size={16} className="text-brand-copper" />
              </span>
              <span className="text-brand-espresso text-xs sm:text-[13px] font-medium leading-snug">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
