import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Wizard from "./pages/Wizard";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import Gallery from "./pages/Gallery";
// import ServiceDetail from "./pages/ServiceDetail";
import { useEffect } from "react";
import FileManager from "./pages/FileManager";
import ProtectedRoute from "./components/ProtectedRoute";
import { PromoPopup } from "@/components/PromoPopup";
import { SubmissionSuccessPopup } from "@/components/SubmissionSuccessPopup";
import { SalesCaptain } from "@/components/SalesCaptain";
import GalleryDetailPage from "./pages/GalleryDetailPage";
import Faq from "./pages/Faq";
import ServicePage from "./pages/ServicePage";
import Contact from "./pages/Contact";
import AdminFaqs from "./pages/admin/Faqs";
import AdminServicePages from "./pages/admin/ServicePages";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/admin/Blog";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminPricing from "./pages/admin/Pricing";
import AdminContactInfo from "./pages/admin/ContactInfo";
import AdminSiteContent from "./pages/admin/SiteContent";
import AdminHowItWorks from "./pages/admin/HowItWorks";
import AdminAboutUs from "./pages/admin/AboutUs";
import AdminPromo from "./pages/admin/Promo";
import AdminMessages from "./pages/admin/Messages";
import AdminSettings from "./pages/admin/Settings";
import AdminLegal from "./pages/admin/Legal";
import LegalPage from "./pages/LegalPage";

const queryClient = new QueryClient();

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
      <BrowserRouter>
        <ScrollToTop />
        <PromoPopup />
        <SalesCaptain />
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
          <Route path="*" element={<NotFound />} />
        </Routes>

        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
