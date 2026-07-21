import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

// Labels are translated (see pb.* keys) so they switch with the EN/FR toggle.
const steps = [
  { key: "pb.contact", color: "#ef4444" }, // red
  { key: "pb.spaces", color: "#eab308" }, // yellow
  { key: "pb.review", color: "#22c55e" }, // green
];

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full mb-12">
      <div className="relative h-2 w-full bg-brand-border rounded-full overflow-hidden flex">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="h-2 flex-1 transition-colors duration-500"
            style={{
              backgroundColor: index <= currentStep ? step.color : "transparent",
              marginRight: index < steps.length - 1 ? 2 : 0,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3.5">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={cn(
              "text-sm md:text-base text-center transition-colors duration-500 flex items-center justify-center gap-2",
              index <= currentStep ? "text-brand-espresso font-semibold" : "text-brand-muted"
            )}
            style={{ flexBasis: "33.33%" }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full transition-colors duration-500"
              style={{ backgroundColor: index <= currentStep ? step.color : "#d4cdc4" }}
            />
            {t(step.key)}
          </div>
        ))}
      </div>
    </div>
  );
};
