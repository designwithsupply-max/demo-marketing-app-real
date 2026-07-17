import { ReactNode } from "react";

interface WizardNavProps {
  /** Left slot — usually the Back button. Omit on the first step. */
  left?: ReactNode;
  /** Right slot — the primary Next / Continue / Submit button. */
  right: ReactNode;
}

/**
 * Floating action bar pinned to the bottom of the viewport. It stays visible
 * on every step no matter how far the user scrolls. Each step passes its own
 * Back / Next buttons so their individual validation and submit logic is kept
 * intact — this component only provides the fixed, always-visible chrome.
 */
export const WizardNav = ({ left, right }: WizardNavProps) => (
  <>
    {/* Spacer so page content is never hidden behind the fixed bar */}
    <div aria-hidden className="h-24" />

    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-brand-border shadow-[0_-8px_24px_-10px_rgba(45,36,30,0.25)]"
      style={{
        // iOS Safari fails to repaint a fixed, backdrop-filtered bar mid-scroll,
        // so the old `bg-white/95 backdrop-blur-sm` combo made this vanish until
        // the next scroll gesture. A solid background (no backdrop-filter) plus
        // an explicit compositing layer keeps it painted at all times.
        transform: "translateZ(0)",
        // Clear the iOS home indicator so the button isn't tucked behind it.
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="min-w-[70px] flex items-center">{left}</div>
        <div className="flex items-center">{right}</div>
      </div>
    </div>
  </>
);
