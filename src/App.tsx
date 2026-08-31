import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { PromoPopup } from "@/components/PromoPopup";
import { SubmissionSuccessPopup } from "@/components/SubmissionSuccessPopup";
import { SalesCaptain } from "@/components/SalesCaptain";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

// Everything but the homepage is code-split so a visit to any one route
// (e.g. /admin on a mobile connection) only downloads that route's chunk
// instead of the entire app bundle — Wizard's canvas library alone is
// heavy, and previously every admin page shipped in that same bundle.
const Wizard = lazy(() => import("./pages/Wizard"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Gallery = lazy(() => import("./pages/Gallery"));
const FileManager = lazy(() => import("./pages/FileManager"));
const GalleryDetailPage = lazy(() => import("./pages/GalleryDetailPage"));
const Faq = lazy(() => import("./pages/Faq"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminFaqs = lazy(() => import("./pages/admin/Faqs"));
const AdminServicePages = lazy(() => import("./pages/admin/ServicePages"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminPricing = lazy(() => import("./pages/admin/Pricing"));
const AdminContactInfo = lazy(() => import("./pages/admin/ContactInfo"));
const AdminSiteContent = lazy(() => import("./pages/admin/SiteContent"));
const AdminHowItWorks = lazy(() => import("./pages/admin/HowItWorks"));
const AdminAboutUs = lazy(() => import("./pages/admin/AboutUs"));
const AdminPromo = lazy(() => import("./pages/admin/Promo"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminLegal = lazy(() => import("./pages/admin/Legal"));
const AdminSeoSettings = lazy(() => import("./pages/admin/SeoSettings"));
const AdminGlobalSettings = lazy(() => import("./pages/admin/GlobalSettings"));
const AdminLocationPages = lazy(() => import("./pages/admin/LocationPages"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>

    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SubmissionSuccessPopup />
      <GoogleAnalytics />
      <BrowserRouter>
        <ScrollToTop />
        <PromoPopup />
        <SalesCaptain />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/space-planner" element={<LanguageProvider><Wizard /></LanguageProvider>} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/file-manager" element={<ProtectedRoute>
            <FileManager />
          </ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute>
            <Admin />
          </ProtectedRoute>} />
          <Route path="/admin/faqs" element={<ProtectedRoute>
            <AdminFaqs />
          </ProtectedRoute>} />
          <Route path="/admin/testimonials" element={<ProtectedRoute>
            <AdminTestimonials />
          </ProtectedRoute>} />
          <Route path="/admin/pricing" element={<ProtectedRoute>
            <AdminPricing />
          </ProtectedRoute>} />
          <Route path="/admin/blog" element={<ProtectedRoute>
            <AdminBlog />
          </ProtectedRoute>} />
          <Route path="/admin/contact" element={<ProtectedRoute>
            <AdminContactInfo />
          </ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute>
            <AdminSiteContent />
          </ProtectedRoute>} />
          <Route path="/admin/how-it-works" element={<ProtectedRoute>
            <AdminHowItWorks />
          </ProtectedRoute>} />
          <Route path="/admin/about-us" element={<ProtectedRoute>
            <AdminAboutUs />
          </ProtectedRoute>} />
          <Route path="/admin/promo" element={<ProtectedRoute>
            <AdminPromo />
          </ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute>
            <AdminMessages />
          </ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>} />
          <Route path="/admin/legal" element={<ProtectedRoute>
            <AdminLegal />
          </ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute>
            <AdminServicePages />
          </ProtectedRoute>} />
          <Route path="/admin/seo" element={<ProtectedRoute>
            <AdminSeoSettings />
          </ProtectedRoute>} />
          <Route path="/admin/global-settings" element={<ProtectedRoute>
            <AdminGlobalSettings />
          </ProtectedRoute>} />
          <Route path="/admin/locations" element={<ProtectedRoute>
            <AdminLocationPages />
          </ProtectedRoute>} />

          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/closets" element={<ServicePage slug="closets" />} />
          <Route path="/walk-in-closets" element={<ServicePage slug="walk-in-closets" />} />
          <Route path="/reach-in-closets" element={<ServicePage slug="reach-in-closets" />} />
          <Route path="/wardrobes" element={<ServicePage slug="wardrobes" />} />
          <Route path="/kitchens" element={<ServicePage slug="kitchens" />} />
          <Route path="/garage-cabinets" element={<ServicePage slug="garage-cabinets" />} />
          <Route path="/pantries-laundry-mudrooms" element={<ServicePage slug="pantries-laundry-mudrooms" />} />
          <Route path="/garages" element={<Navigate to="/garage-cabinets" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<GalleryDetailPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          {/* Local SEO pages (e.g. /laval, /west-island) — content comes from
              location_pages (edit at /admin/locations), so a new city page
              doesn't need a route added here. Placed last among named routes
              so it never shadows a more specific path above it; LocationPage
              itself renders NotFound for any slug that doesn't match. */}
          <Route path="/:locationSlug" element={<LocationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
