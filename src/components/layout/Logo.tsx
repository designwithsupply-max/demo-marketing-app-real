/**
 * The single Design & Supply lockup used everywhere on the site.
 *
 * This is the footer mark — a thin copper-outlined "D&S" square next to an
 * inline, wide-tracked "DESIGN & SUPPLY" wordmark — promoted to the canonical
 * logo. The header, footer and admin top bar all render this component, so the
 * brand only ever has to be changed in one place.
 */

interface LogoProps {
  /**
   * `light` = for dark backgrounds (white wordmark) — the footer and the
   * transparent header over the home hero.
   * `dark`  = for light backgrounds (espresso wordmark) — the scrolled header,
   * inner pages and the admin bar.
   */
  tone?: "light" | "dark";
  /** `sm` is used in tight chrome (admin bar); `md` everywhere else. */
  size?: "sm" | "md";
  className?: string;
}

const COPPER = "#C9A96E";

export default function Logo({ tone = "dark", size = "md", className = "" }: LogoProps) {
  const box = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-[11px]";
  const word = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`${box} shrink-0 border flex items-center justify-center font-bold tracking-tight transition-colors duration-300`}
        style={{ borderColor: COPPER, color: COPPER }}
      >
        D&amp;S
      </span>
      <span className="whitespace-nowrap leading-none">
        <span
          className={`${word} font-light tracking-[0.2em] uppercase transition-colors duration-300 ${
            tone === "light" ? "text-white" : "text-brand-espresso"
          }`}
        >
          Design
        </span>
        <span className={`${word} font-light tracking-[0.2em] uppercase`} style={{ color: COPPER }}>
          {" "}
          &amp; Supply
        </span>
      </span>
    </span>
  );
}
