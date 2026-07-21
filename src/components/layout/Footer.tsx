import Link from "next/link";
import { Globe, Share2, ExternalLink, Mail, Phone, MapPin } from "lucide-react";
import { useContactInfo } from "@/hooks/useContactInfo";
import Logo from "@/components/layout/Logo";

export default function Footer() {
  const { contactInfo } = useContactInfo();

  const email = contactInfo?.email || "hello@designandsupply.com";
  const phone = contactInfo?.phone || "+1 (800) 555-0192";
  const addressLine1 = contactInfo?.address_line1 || "1200 Design District Blvd";
  const addressLine2 = contactInfo?.address_line2 || "Los Angeles, CA 90028";

  return (
    <footer className="bg-[#1A1A18] text-white/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center group mb-6">
              <Logo tone="light" />
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Premium custom closet design and installation. Transforming spaces into luxury storage experiences since 2015.
            </p>
            {/* <div className="flex gap-4">
              {[Globe, Share2, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all duration-300">
                  <Icon size={15} />
                </a>
              ))}
            </div> */}
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase font-medium mb-6">Services</h4>
            <ul className="space-y-3">
              {[
                ["Closets", "/closets"],
                ["Kitchen Cabinets", "/kitchens"],
                ["Luxury Dressing Rooms", "/closets"],
                ["Garage Storage", "/garages"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase font-medium mb-6">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about-us" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/space-planner" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://mtl-closets.myhelcim.com/hosted/?token=9f9e5d22c6d13444ef33d9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Pay Here
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-xs tracking-[0.2em] uppercase font-medium mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <Phone size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
                <span className="text-sm">{phone}</span>
              </li>
              <li className="flex gap-3 items-start">
                <Mail size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
                <span className="text-sm">{email}</span>
              </li>
              <li className="flex gap-3 items-start">
                <MapPin size={14} className="mt-0.5 text-[#C9A96E] flex-shrink-0" />
                <span className="text-sm">{addressLine1 ? `${addressLine1},` : ""}<br />{addressLine2}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs tracking-wider">
            © {new Date().getFullYear()} Design & Supply. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
