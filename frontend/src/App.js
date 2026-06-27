import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';
import { RadioProvider } from './context/RadioContext';
import { Toaster } from './components/ui/toaster';
import FloatingNav from './components/FloatingNav';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LegacyProductRedirectPage from './pages/LegacyProductRedirectPage';
import LegacyProductSlugRedirectPage from './pages/LegacyProductSlugRedirectPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResearchLibraryPage from './pages/research/ResearchLibraryPage';
import ResearchArticlePage from './pages/research/ResearchArticlePage';
import FAQPage from './pages/FAQPage';
import AboutUsPage from './pages/AboutUsPage';
import AdminLayout from './pages/AdminLayout';
import AdminSettingsLayout from './pages/admin/AdminSettingsLayout';
import DevSettingsLayout from './pages/dev/DevSettingsLayout';
import MaintenancePage from './pages/MaintenancePage';

// Legal Pages
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsConditionsPage from './pages/legal/TermsConditionsPage';
import AccessibilityPage from './pages/legal/AccessibilityPage';
import CompliancePage from './pages/legal/CompliancePage';
import ShippingReturnsPage from './pages/legal/ShippingReturnsPage';

// Location Pages (SEO)
import LocationPage from './pages/LocationPage';
import DevLocationPreview from './pages/dev/DevLocationPreview';

// User Portal
import UserPortal from './pages/UserPortal';

// New 123Bots Pages
import ProductsPage from './pages/ProductsPage';
import RobotProductPage from './pages/RobotProductPage';
import CommercialCleaningBotsPage from './pages/CommercialCleaningBotsPage';
import IndustrialDeliveryBotsPage from './pages/IndustrialDeliveryBotsPage';
import AvidbotsNeoPage from './pages/AvidbotsNeoPage';
import GausiumMiraPage from './pages/GausiumMiraPage';
import GausiumMarvelPage from './pages/GausiumMarvelPage';
import PuduBg1ProPage from './pages/PuduBg1ProPage';
import PuduBg1ProFeaturesPage from './pages/PuduBg1ProFeaturesPage';
import PuduCc1ProFeaturesPage from './pages/PuduCc1ProFeaturesPage';
import FlashBotMaxPage from './pages/FlashBotMaxPage';
import PuduCc1ProPage from './pages/PuduCc1ProPage';
import AvidbotKasPage from './pages/AvidbotKasPage';
import PuduSh1Page from './pages/PuduSh1Page';
import PuduMt1MaxPage from './pages/PuduMt1MaxPage';
import PuduMt1VacPage from './pages/PuduMt1VacPage';
import PuduT300Page from './pages/PuduT300Page';
import PuduT600Page from './pages/PuduT600Page';
import IndustryPage from './pages/IndustryPage';
import ScheduleDemoPage from './pages/ScheduleDemoPage';
import BuyLeasePage from './pages/BuyLeasePage';
import ResourcesPage from './pages/ResourcesPage';
import CategoryLandingPage from './pages/CategoryLandingPage';
import PublicBookingPage from './pages/PublicBookingPage';
import QuoteSigningPage from './pages/quotes/QuoteSigningPage';
import EventsIndexPage from './pages/EventsIndexPage';
import EventDetailPage from './pages/EventDetailPage';
import EventConfirmationPage from './pages/EventConfirmationPage';
import TicketViewPage from './pages/TicketViewPage';

// Age Verification
import AgeVerificationModal from './components/AgeVerificationModal';

// Chat Widget (Public Pages Only)
import ChatWidget from './components/ChatWidget';

import ChatPopout from './pages/admin/ChatPopout';

const A2G_ANALYTICS_SCRIPT_ID = 'ZwSg9rf6GA';
const A2G_ANALYTICS_SRC = 'https://a2ganalytics.com/js/script.js';

const A2GAnalyticsScript = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPublicRoute = !pathname.startsWith('/admin') && !pathname.startsWith('/dev');
    const existingScript = document.getElementById(A2G_ANALYTICS_SCRIPT_ID);

    if (!isPublicRoute) {
      return;
    }

    if (existingScript) {
      return;
    }

    const analyticsScript = document.createElement('script');
    analyticsScript.id = A2G_ANALYTICS_SCRIPT_ID;
    analyticsScript.src = A2G_ANALYTICS_SRC;
    analyticsScript.async = true;
    analyticsScript.defer = true;
    analyticsScript.setAttribute('data-host', 'https://a2ganalytics.com');
    analyticsScript.setAttribute('data-dnt', 'false');
    document.head.appendChild(analyticsScript);
  }, [pathname]);

  return null;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Layout wrapper for public pages
const PublicLayout = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dev');

  return (
    <>
      <main className="min-h-screen bg-bots-dark">{children}</main>
      <ChatWidget />
    </>
  );
};

// Maintenance Mode Guard - wraps public routes
const MaintenanceGuard = ({ children }) => {
  const { maintenanceMode, loading } = useSiteSettings();
  const { isAuthenticated, user } = useAuth();
  
  // Show nothing while loading settings
  if (loading) {
    return (
      <div className="min-h-screen bg-void-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Check if user is admin (can bypass maintenance)
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin');
  
  // Show maintenance page for non-admins when maintenance mode is enabled
  if (maintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }
  
  return children;
};

const ImpersonationBanner = () => {
  const { isImpersonating, impersonationAdmin, exitImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isImpersonating) {
    return null;
  }

  const handleExitImpersonation = async () => {
    const result = await exitImpersonation();
    if (result.success) {
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin/user-management/customers');
      }
    }
  };

  return (
    <div className="sticky top-0 z-[60] bg-amber-500 text-black shadow" data-testid="impersonation-session-banner">
      <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium" data-testid="impersonation-session-label">
          Impersonating customer account
          {impersonationAdmin?.email ? ` • Admin: ${impersonationAdmin.email}` : ''}
        </p>
        <button
          type="button"
          onClick={handleExitImpersonation}
          className="px-3 py-1 text-sm rounded bg-black text-white hover:bg-gray-900 transition-colors"
          data-testid="exit-impersonation-button"
        >
          Exit Impersonation
        </button>
      </div>
    </div>
  );
};

// Inner app component that uses auth context
const AppContent = () => {
  return (
    <div className="App bg-void-base min-h-screen">
      <RadioProvider>
        <BrowserRouter>
          <A2GAnalyticsScript />
          <ImpersonationBanner />
          <ScrollToTop />
          <AgeVerificationModal />
          <Routes>
          {/* Dev Settings Routes (Super Admin Only) */}
          <Route path="/dev/settings/*" element={<DevSettingsLayout />} />
          
          {/* Dev Location Preview - Full page (no sidebar) */}
          <Route path="/dev/location-preview" element={<DevLocationPreview />} />
          
          {/* Admin Settings Routes */}
          <Route path="/admin/settings/*" element={<AdminSettingsLayout />} />
          
          {/* Chat Popout - Standalone window (no sidebar) */}
          <Route path="/admin/chat/:chatId" element={<ChatPopout />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminLayout />} />
          
          {/* Location Pages - Standalone (no PublicLayout wrapper) - also protected by maintenance */}
          <Route path="/locations/:slug" element={
            <MaintenanceGuard>
              <LocationPage />
            </MaintenanceGuard>
          } />
          
          {/* Public Routes - Protected by Maintenance Guard */}
            <Route path="/*" element={
              <MaintenanceGuard>
                <PublicLayout>
                  <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<CategoryLandingPage />} />
                  <Route path="/categories" element={<CategoryLandingPage />} />
                  <Route path="/shop/products" element={<ShopPage />} />
                  <Route path="/shop/:legacySlug" element={<LegacyProductSlugRedirectPage />} />
                  <Route path="/shop/:categorySlug/:productSlug" element={<ProductDetailPage />} />
                  <Route path="/product/:productId" element={<LegacyProductRedirectPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/commercial-cleaning-bots" element={<CommercialCleaningBotsPage />} />
                  <Route path="/industrial-delivery-bots" element={<IndustrialDeliveryBotsPage />} />
                  <Route path="/products/avidbots-neo" element={<AvidbotsNeoPage />} />
                  <Route path="/products/gausium-mira" element={<GausiumMiraPage />} />
                  <Route path="/products/gausium-marvel" element={<GausiumMarvelPage />} />
                  <Route path="/products/pudu-bg1" element={<PuduBg1ProPage />} />
                  <Route path="/explore-all-pudu-bg1-features" element={<PuduBg1ProFeaturesPage />} />
                  <Route path="/products/pudu-cc1-pro" element={<PuduCc1ProPage />} />
                  <Route path="/explore-all-pudu-cc1-pro-features" element={<PuduCc1ProFeaturesPage />} />
                  <Route path="/products/ab-kas" element={<AvidbotKasPage />} />
                  <Route path="/products/pudu-sh1" element={<PuduSh1Page />} />
                  <Route path="/products/pudu-mt1" element={<PuduMt1MaxPage />} />
                  <Route path="/products/pudu-mt1-vac" element={<PuduMt1VacPage />} />
                  <Route path="/products/flashbot-max" element={<FlashBotMaxPage />} />
                  <Route path="/products/pudu-t300" element={<PuduT300Page />} />
                  <Route path="/products/pudu-t600" element={<PuduT600Page />} />
                  <Route path="/products/:productSlug" element={<RobotProductPage />} />
                  <Route path="/industries/:industrySlug" element={<IndustryPage />} />
                  <Route path="/schedule-a-demo" element={<ScheduleDemoPage />} />
                  <Route path="/rent-or-buy-a-cleaning-bot" element={<BuyLeasePage />} />
                  <Route path="/123-bots-resources" element={<ResourcesPage />} />
                  <Route path="/events" element={<EventsIndexPage />} />
                  <Route path="/events/confirmation" element={<EventConfirmationPage />} />
                  <Route path="/events/ticket/:code" element={<TicketViewPage />} />
                  <Route path="/events/:slug" element={<EventDetailPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/booking/:bookingSlug" element={<PublicBookingPage />} />
                    <Route path="/book/:bookingSlug" element={<PublicBookingPage />} />
                    <Route path="/sign/:quoteId" element={<QuoteSigningPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/research" element={<ResearchLibraryPage />} />
                  <Route path="/research/:slug" element={<ResearchArticlePage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-conditions" element={<TermsConditionsPage />} />
                  <Route path="/accessibility" element={<AccessibilityPage />} />
                  <Route path="/compliance" element={<CompliancePage />} />
                  <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/account" element={<UserPortal />} />
                  <Route path="/storage/*" element={<Navigate to="/" replace />} />
                  <Route path="/rv-repair/*" element={<Navigate to="/" replace />} />
                  <Route path="/employment/*" element={<Navigate to="/" replace />} />
                  <Route path="/job-application/*" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </PublicLayout>
              </MaintenanceGuard>
            } />
          </Routes>
        </BrowserRouter>
      </RadioProvider>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SiteSettingsProvider>
          <AppContent />
        </SiteSettingsProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
