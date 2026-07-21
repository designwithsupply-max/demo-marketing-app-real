// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Menu, X } from "lucide-react";

// const navLinks = [
//   { href: "/", label: "Home" },
//   { href: "/how-it-works", label: "How It Works" },
//   { href: "/gallery", label: "Gallery" },
//   { href: "/blog", label: "Blog" },
//   { href: "/faq", label: "FAQ" },
//   { href: "/contact", label: "Contact" },
// ];

// const servicesLinks = [
//   { href: "/closets", label: "Closets" },
//   { href: "/kitchens", label: "Kitchens" },
//   { href: "/garages", label: "Garages" },
// ];

// const desktopLinks = [
//   { href: "/", label: "Home" },
//   { href: "/how-it-works", label: "How It Works" },
//   { type: "dropdown", label: "Services" },
//   { href: "/gallery", label: "Gallery" },
//   { href: "/blog", label: "Blog" },
//   { href: "/faq", label: "FAQ" },
//   { href: "/contact", label: "Contact" },
// ];

// export const Navigation = () => {
//   const [scrolled, setScrolled] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const pathname = usePathname();

//   useEffect(() => {
//     const handleScroll = () => setScrolled(window.scrollY > 30);
//     window.addEventListener("scroll", handleScroll);
//     // Initial check
//     handleScroll();
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   useEffect(() => {
//     setMobileOpen(false);
//   }, [pathname]);

//   const isHome = pathname === "/";
//   // The header shows light mode if we scrolled OR if we are on any page other than home
//   const isLightState = scrolled || !isHome;

//   return (
//     <>
//       <header
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
//           isLightState
//             ? "bg-brand-cream/95 backdrop-blur-md border-brand-border shadow-sm"
//             : "bg-transparent border-transparent"
//         }`}
//       >
//         <nav className="max-w-7xl mx-auto px-6 lg:px-10 flex lg:grid lg:grid-cols-3 items-center justify-between h-20">
//           {/* Column 1: Logo */}
//           <div className="flex justify-start">
//             <Link href="/" className="flex items-center gap-3 group">
//               <div
//                 className={`w-9 h-9 rounded-[10px] flex items-center justify-center font-serif font-bold text-base transition-all duration-500 ${
//                   isLightState
//                     ? "bg-brand-espresso text-white"
//                     : "border border-white/20 text-white bg-white/5"
//                 }`}
//               >
//                 D
//               </div>
//               <div className="flex flex-col leading-none">
//                 <span
//                   className={`font-serif text-[19px] font-bold tracking-tight transition-colors duration-500 ${
//                     isLightState ? "text-brand-espresso" : "text-white"
//                   }`}
//                 >
//                   Design
//                 </span>
//                 <span className="text-brand-copper-light font-sans text-[9px] tracking-[0.18em] uppercase font-semibold mt-0.5">
//                   & Supply
//                 </span>
//               </div>
//             </Link>
//           </div>

//           {/* Column 2: Center Navigation Links (desktop) */}
//           <div className="hidden lg:flex justify-center items-center gap-6 min-w-max">
//             {desktopLinks.map((link) => {
//               if (link.type === "dropdown") {
//                 return (
//                   <div key={link.label} className="relative group">
//                     <button
//                       type="button"
//                       className={`text-xs tracking-[0.15em] uppercase transition-all duration-300 relative py-1.5 ${
//                         isLightState
//                           ? "text-brand-espresso/70 hover:text-brand-espresso"
//                           : "text-white/70 hover:text-white"
//                       }`}
//                     >
//                       {link.label}
//                       <span className="absolute bottom-0 left-0 h-[2px] bg-brand-copper transition-all duration-300 w-0 group-hover:w-full" />
//                     </button>
//                     {/* Invisible hover bridge fills the gap so cursor doesn't leave the group */}
//                     <div className="absolute left-0 top-full w-full h-3" />
//                     <div className="absolute left-1/2 top-[calc(100%+12px)] w-44 -translate-x-1/2 rounded-xl border border-brand-border bg-white shadow-lg opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
//                       <div className="py-2">
//                         {servicesLinks.map((service) => (
//                           <Link
//                             key={service.href}
//                             href={service.href}
//                             className="block px-4 py-2 text-xs uppercase tracking-[0.15em] text-brand-espresso/80 hover:text-brand-espresso hover:bg-brand-sand transition-colors"
//                           >
//                             {service.label}
//                           </Link>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               }

//               const isActive = pathname === link.href;
//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   className={`text-xs tracking-[0.15em] uppercase transition-all duration-300 relative py-1.5 group ${
//                     isActive
//                       ? isLightState
//                         ? "text-brand-espresso font-medium"
//                         : "text-white font-medium"
//                       : isLightState
//                         ? "text-brand-espresso/70 hover:text-brand-espresso"
//                         : "text-white/70 hover:text-white"
//                   }`}
//                 >
//                   {link.label}
//                   <span
//                     className={`absolute bottom-0 left-0 h-[2px] bg-brand-copper transition-all duration-300 ${
//                       isActive ? "w-full" : "w-0 group-hover:w-full"
//                     }`}
//                   />
//                 </Link>
//               );
//             })}
//           </div>

//           {/* Column 3: Right Action Buttons (desktop) */}
//           <div className="hidden lg:flex justify-end items-center gap-6">
//             <Link
//               href="/space-planner"
//               className="inline-flex items-center justify-center bg-brand-copper hover:bg-brand-copper-dark text-white text-[11px] tracking-[0.1em] uppercase font-sans font-medium px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm whitespace-nowrap"
//             >
//               Start Planner
//             </Link>
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="lg:hidden flex items-center">
//             <button
//               className={`p-2 transition-colors duration-300 ${
//                 isLightState ? "text-brand-espresso" : "text-white"
//               }`}
//               onClick={() => setMobileOpen(!mobileOpen)}
//               aria-label="Toggle menu"
//             >
//               {mobileOpen ? <X size={22} /> : <Menu size={22} />}
//             </button>
//           </div>
//         </nav>
//       </header>

//       {/* Mobile Menu */}
//       <div
//         className={`fixed inset-0 z-40 bg-brand-ink transition-all duration-500 lg:hidden flex flex-col ${
//           mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
//         }`}
//         style={{ paddingTop: "5rem" }}
//       >
//         <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6">
//           {navLinks.map((link, i) => {
//             const isActive = pathname === link.href;
//             return (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className={`text-2xl tracking-[0.2em] uppercase font-light transition-all duration-300 ${
//                   isActive ? "text-brand-copper" : "text-white/70 hover:text-white"
//                 }`}
//                 style={{ transitionDelay: mobileOpen ? `${i * 60}ms` : "0ms" }}
//               >
//                 {link.label}
//               </Link>
//             );
//           })}
//           {servicesLinks.map((service, i) => (
//             <Link
//               key={service.href}
//               href={service.href}
//               className="text-2xl tracking-[0.2em] uppercase font-light transition-all duration-300 text-white/70 hover:text-white"
//               style={{ transitionDelay: mobileOpen ? `${(i + navLinks.length) * 60}ms` : "0ms" }}
//             >
//               {service.label}
//             </Link>
//           ))}
//           <Link
//             href="/space-planner"
//             className="mt-4 inline-flex items-center justify-center bg-brand-copper hover:bg-brand-copper-dark text-white text-sm tracking-[0.2em] uppercase font-medium px-8 py-4 w-full max-w-xs rounded-full transition-colors"
//           >
//             Start Planner
//           </Link>
//         </div>
//       </div>
//     </>
//   );
// };


import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "@/components/layout/Logo";

// Payment link shown in the header "Make a Payment" button.
// Same secure Helcim hosted checkout used in the wizard and footer.
const PAY_NOW_URL = "https://mtl-closets.myhelcim.com/hosted/?token=9f9e5d22c6d13444ef33d9";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  // { href: "/contact", label: "Contact" },
];

const servicesLinks = [
  { href: "/closets", label: "Closets" },
  { href: "/kitchens", label: "Kitchens" },
  { href: "/garages", label: "Garages" },
];

const desktopLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { type: "dropdown", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  // { href: "/contact", label: "Contact" },
];

export const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  // The header shows light mode if we scrolled OR if we are on any page other than home
  const isLightState = scrolled || !isHome;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isLightState
            ? "bg-brand-cream/95 backdrop-blur-md border-brand-border shadow-sm"
            : "bg-transparent border-transparent"
          }`}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-10 flex lg:grid lg:grid-cols-3 items-center justify-between h-20">
          {/* Column 1: Logo */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center group">
              <Logo tone={isLightState ? "dark" : "light"} />
            </Link>
          </div>

          {/* Column 2: Center Navigation Links (desktop) */}
          <div className="hidden lg:flex justify-center items-center gap-6 min-w-max">
            {desktopLinks.map((link) => {
              if (link.type === "dropdown") {
                return (
                  <div key={link.label} className="relative group">
                    <button
                      type="button"
                      className={`text-xs tracking-[0.15em] uppercase transition-all duration-300 relative py-1.5 ${isLightState
                          ? "text-brand-espresso/70 hover:text-brand-espresso"
                          : "text-white/70 hover:text-white"
                        }`}
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 h-[2px] bg-brand-copper transition-all duration-300 w-0 group-hover:w-full" />
                    </button>
                    {/* Invisible hover bridge fills the gap so cursor doesn't leave the group */}
                    <div className="absolute left-0 top-full w-full h-3" />
                    <div className="absolute left-1/2 top-[calc(100%+12px)] w-44 -translate-x-1/2 rounded-xl border border-brand-border bg-white shadow-lg opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                      <div className="py-2">
                        {servicesLinks.map((service) => (
                          <Link
                            key={service.href}
                            href={service.href}
                            className="block px-4 py-2 text-xs uppercase tracking-[0.15em] text-brand-espresso/80 hover:text-brand-espresso hover:bg-brand-sand transition-colors"
                          >
                            {service.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs tracking-[0.15em] uppercase transition-all duration-300 relative py-1.5 group ${isActive
                      ? isLightState
                        ? "text-brand-espresso font-medium"
                        : "text-white font-medium"
                      : isLightState
                        ? "text-brand-espresso/70 hover:text-brand-espresso"
                        : "text-white/70 hover:text-white"
                    }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-brand-copper transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Column 3: Right Action Buttons (desktop) */}
          <div className="hidden lg:flex justify-end items-center gap-3">
            <a
              href={PAY_NOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center border text-[11px] tracking-[0.1em] uppercase font-sans font-medium px-5 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap ${isLightState
                  ? "border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white"
                  : "border-white/60 text-white hover:bg-white hover:text-brand-espresso"
                }`}
            >
              Make a Payment
            </a>
            <Link
              href="/space-planner"
              className="inline-flex items-center justify-center bg-brand-copper hover:bg-brand-copper-dark text-white text-[11px] tracking-[0.1em] uppercase font-sans font-medium px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm whitespace-nowrap"
            >
              Start Planner
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              className={`p-2 transition-colors duration-300 ${isLightState ? "text-brand-espresso" : "text-white"
                }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-brand-ink transition-all duration-500 lg:hidden flex flex-col ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        style={{ paddingTop: "5rem" }}
      >
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base tracking-[0.15em] uppercase font-light transition-all duration-300 ${isActive ? "text-brand-copper" : "text-white/70 hover:text-white"
                  }`}
                style={{ transitionDelay: mobileOpen ? `${i * 60}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            );
          })}
          {servicesLinks.map((service, i) => (
            <Link
              key={service.href}
              href={service.href}
              className="text-base tracking-[0.15em] uppercase font-light transition-all duration-300 text-white/70 hover:text-white"
              style={{ transitionDelay: mobileOpen ? `${(i + navLinks.length) * 60}ms` : "0ms" }}
            >
              {service.label}
            </Link>
          ))}
          <Link
            href="/space-planner"
            className="mt-3 inline-flex items-center justify-center bg-brand-copper hover:bg-brand-copper-dark text-white text-xs tracking-[0.2em] uppercase font-medium px-8 py-3.5 w-full max-w-xs rounded-full transition-colors"
          >
            Start Planner
          </Link>
          <a
            href={PAY_NOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-white/60 text-white hover:bg-white hover:text-brand-espresso text-xs tracking-[0.2em] uppercase font-medium px-8 py-3.5 w-full max-w-xs rounded-full transition-colors"
          >
            Make a Payment
          </a>
        </div>
      </div>
    </>
  );
};