import { Switch, Route, Router } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAnalyticsHeartbeat } from "@/hooks/useAnalyticsHeartbeat";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { GlobalProvider, useGlobalContext } from "@/contexts/GlobalContext";
import { LocationProvider } from "@/contexts/userLocationContext";
import Layout from "./components/Layout";

// ── Lazy-loaded pages (each gets its own JS chunk — only loaded when visited) ──
const HomePage            = lazy(() => import("@/pages/HomePage"));
const CatalogPage         = lazy(() => import("@/pages/CatalogPage"));
const BookDetailPage      = lazy(() => import("@/pages/BookDetailPage"));
const CartPage            = lazy(() => import("@/pages/CartPage"));
const AboutPage           = lazy(() => import("@/pages/AboutPage"));
const ContactPage         = lazy(() => import("@/pages/ContactPage"));
const RequestBookPage     = lazy(() => import("@/pages/RequestBookPage"));
const TrackOrderPage      = lazy(() => import("@/pages/TrackOrderPage"));
const MyOrdersPage        = lazy(() => import("@/pages/MyOrdersPage"));
const CheckoutPage        = lazy(() => import("@/pages/CheckoutPage"));
const MyProfile           = lazy(() => import("@/pages/MyProfile"));
const PayPalCompletePage  = lazy(() => import("@/pages/PayPalCompletePage"));
const OrderDetailPage     = lazy(() => import("@/pages/OrderDetailPage"));
const ReturnRequestPage   = lazy(() => import("@/pages/ReturnRequestPage"));
const WishlistPage        = lazy(() => import("@/pages/WishlistPage"));
const GiftItemsPage       = lazy(() => import("@/pages/GiftItemsPage"));
const ShippingInfoPage    = lazy(() => import("@/pages/ShippingInfoPage"));
const ReturnPolicyPage    = lazy(() => import("@/pages/ReturnPolicyPage"));
const CancellationPolicyPage = lazy(() => import("@/pages/CancellationPolicyPage"));
const TermsAndConditionsPage = lazy(() => import("@/pages/TermsAndConditionsPage"));
const FAQPage             = lazy(() => import("@/pages/FAQPage"));
const PrivacyPolicyPage   = lazy(() => import("@/pages/PrivacyPolicyPage"));
const LoginPage           = lazy(() => import("@/pages/LoginPage"));
const RegisterPage        = lazy(() => import("@/pages/RegisterPage"));
const ResetPasswordPage   = lazy(() => import("@/pages/ResetPasswordPage"));
const AdminLoginPage      = lazy(() => import("@/pages/AdminLoginPage"));
const NotFound            = lazy(() => import("@/pages/NotFound"));

// Admin pages — each is a separate chunk; only loaded when admin visits them
const AdminDashboard      = lazy(() => import("@/pages/admin/AdminDashboard"));
const InventoryPageNew    = lazy(() => import("@/pages/admin/InventoryPageNew"));
const OrdersPage          = lazy(() => import("@/pages/admin/OrdersPage"));
const CustomersPage       = lazy(() => import("@/pages/admin/CustomersPage"));
const SalesPage           = lazy(() => import("@/pages/admin/SalesPage"));
const SettingsPage        = lazy(() => import("@/pages/admin/SettingsPage"));
const ShippingPage        = lazy(() => import("@/pages/admin/ShippingPage"));
const ReturnsPage         = lazy(() => import("@/pages/admin/ReturnsPage"));
const AdminAccountPage    = lazy(() => import("@/pages/admin/AdminAccountPage"));
const MessagesPage        = lazy(() => import("@/pages/admin/MessagesPage"));
const GiftCategoriesPage  = lazy(() => import("@/pages/admin/GiftCategoriesPage"));
const CouponsPage         = lazy(() => import("@/pages/admin/CouponsPage"));
const BookRequestsPage    = lazy(() => import("@/pages/admin/BookRequestsPage"));
const AnalyticsPage       = lazy(() => import("@/pages/admin/AnalyticsPage"));
const GiftManagementPage  = lazy(() => import("@/pages/admin/GiftManagementPage"));
const AuditLogPage        = lazy(() => import("@/pages/admin/AuditLogPage"));

// Minimal inline spinner shown while a lazy chunk is downloading
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
        <p className="mt-4 text-secondary-black">Loading...</p>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Auto scroll to top on page navigation
  useScrollToTop();

  // Keep analytics session alive and backfill userId as user navigates (SPA)
  useAnalyticsHeartbeat();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
          <p className="mt-4 text-secondary-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={() => <Layout><HomePage /></Layout>} />
        <Route path="/catalog" component={() => <Layout><CatalogPage /></Layout>} />
        <Route path="/books/:id" component={() => <Layout><BookDetailPage /></Layout>} />
        <Route path="/about" component={() => <Layout><AboutPage /></Layout>} />
        <Route path="/contact" component={() => <Layout><ContactPage /></Layout>} />
        <Route path="/request-book" component={() => <Layout><RequestBookPage /></Layout>} />
        <Route path="/track-order" component={() => <Layout><TrackOrderPage /></Layout>} />
        <Route path="/my-orders" component={() => <Layout><MyOrdersPage /></Layout>} />
        <Route path="/cart" component={() => <Layout><CartPage /></Layout>} />
        <Route path="/checkout/:mode/:bookId/:quantity" component={() => <Layout><CheckoutPage /></Layout>} />
        <Route path="/profile" component={() => <Layout><MyProfile /></Layout>} />
        <Route path="/paypal-complete" component={() => <Layout><PayPalCompletePage /></Layout>} />
        <Route path="/orders/:id" component={() => <Layout><OrderDetailPage /></Layout>} />
        <Route path="/returns" component={() => <Layout><ReturnRequestPage /></Layout>} />
        <Route path="/wishlist" component={() => <Layout><WishlistPage /></Layout>} />
        <Route path="/gift-items" component={() => <Layout><GiftItemsPage /></Layout>} />
        <Route path="/shipping-info" component={() => <Layout><ShippingInfoPage /></Layout>} />
        <Route path="/return-policy" component={() => <Layout><ReturnPolicyPage /></Layout>} />
        <Route path="/cancellation-policy" component={() => <Layout><CancellationPolicyPage /></Layout>} />
        <Route path="/terms-and-conditions" component={() => <Layout><TermsAndConditionsPage /></Layout>} />
        <Route path="/faq" component={() => <Layout><FAQPage /></Layout>} />
        <Route path="/privacy-policy" component={() => <Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="/admin-login" component={AdminLoginPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />

        {/* Admin routes */}
        <Route path="/admin"><AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute></Route>
        <Route path="/admin/inventory"><AdminProtectedRoute><InventoryPageNew /></AdminProtectedRoute></Route>
        <Route path="/admin/orders"><AdminProtectedRoute><OrdersPage /></AdminProtectedRoute></Route>
        <Route path="/admin/customers"><AdminProtectedRoute><CustomersPage /></AdminProtectedRoute></Route>
        <Route path="/admin/sales"><AdminProtectedRoute><SalesPage /></AdminProtectedRoute></Route>
        <Route path="/admin/shipping"><AdminProtectedRoute><ShippingPage /></AdminProtectedRoute></Route>
        <Route path="/admin/returns"><AdminProtectedRoute><ReturnsPage /></AdminProtectedRoute></Route>
        <Route path="/admin/messages"><AdminProtectedRoute><MessagesPage /></AdminProtectedRoute></Route>
        <Route path="/admin/gift-categories"><AdminProtectedRoute><GiftCategoriesPage /></AdminProtectedRoute></Route>
        <Route path="/admin/gift-management"><AdminProtectedRoute><GiftManagementPage /></AdminProtectedRoute></Route>
        <Route path="/admin/coupons"><AdminProtectedRoute><CouponsPage /></AdminProtectedRoute></Route>
        <Route path="/admin/book-requests"><AdminProtectedRoute><BookRequestsPage /></AdminProtectedRoute></Route>
        <Route path="/admin/analytics"><AdminProtectedRoute><AnalyticsPage /></AdminProtectedRoute></Route>
        <Route path="/admin/settings"><AdminProtectedRoute><SettingsPage /></AdminProtectedRoute></Route>
        <Route path="/admin/account"><AdminProtectedRoute><AdminAccountPage /></AdminProtectedRoute></Route>
        <Route path="/admin/audit-trail"><AdminProtectedRoute><AuditLogPage /></AdminProtectedRoute></Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocationProvider>
          <GlobalProvider>
            <AuthTransitionLoader />
            <Toaster />
            <Router>
              <AppRouter />
            </Router>
          </GlobalProvider>
        </LocationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthTransitionLoader() {
  const { isAuthTransitioning } = useGlobalContext();

  if (!isAuthTransitioning) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-secondary-black">Please Wait</p>
        </div>
      </div>
    </div>
  );
}

export default App;
