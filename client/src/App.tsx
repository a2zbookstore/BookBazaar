import { Switch, Route, Router } from "wouter";
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

// Pages
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import BookDetailPage from "@/pages/BookDetailPage";
import CartPage from "@/pages/CartPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import InventoryPageNew from "@/pages/admin/InventoryPageNew";
import OrdersPage from "@/pages/admin/OrdersPage";
import CustomersPage from "@/pages/admin/CustomersPage";
import SalesPage from "@/pages/admin/SalesPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import ShippingPage from "@/pages/admin/ShippingPage";
import ReturnsPage from "@/pages/admin/ReturnsPage";
import AdminAccountPage from "@/pages/admin/AdminAccountPage";
import MessagesPage from "@/pages/admin/MessagesPage";
import GiftCategoriesPage from "@/pages/admin/GiftCategoriesPage";
import CouponsPage from "@/pages/admin/CouponsPage";
import BookRequestsPage from "@/pages/admin/BookRequestsPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import GiftItemsPage from "@/pages/GiftItemsPage";
import GiftManagementPage from "@/pages/admin/GiftManagementPage";
import AuditLogPage from "@/pages/admin/AuditLogPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import PayPalCompletePage from "@/pages/PayPalCompletePage";
import ReturnRequestPage from "@/pages/ReturnRequestPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ShippingInfoPage from "@/pages/ShippingInfoPage";
import ReturnPolicyPage from "@/pages/ReturnPolicyPage";
import CancellationPolicyPage from "@/pages/CancellationPolicyPage";
import TermsAndConditionsPage from "@/pages/TermsAndConditionsPage";
import FAQPage from "@/pages/FAQPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import RequestBookPage from "@/pages/RequestBookPage";
import NotFound from "@/pages/NotFound";
import MyProfile from "./pages/MyProfile";
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
    <Switch>
      {/* Public routes — wrapped in Layout (Header + SubHeader + Footer) */}
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
      <Route path="/shipping-info" component={() => <Layout><ShippingInfoPage /></Layout>} />
      <Route path="/return-policy" component={() => <Layout><ReturnPolicyPage /></Layout>} />
      <Route path="/cancellation-policy" component={() => <Layout><CancellationPolicyPage /></Layout>} />
      <Route path="/terms-and-conditions" component={() => <Layout><TermsAndConditionsPage /></Layout>} />
      <Route path="/gift-items" component={() => <Layout><GiftItemsPage /></Layout>} />
      <Route path="/faq" component={() => <Layout><FAQPage /></Layout>} />
      <Route path="/privacy-policy" component={() => <Layout><PrivacyPolicyPage /></Layout>} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Admin routes - protected by separate admin authentication */}
      <Route path="/admin">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/inventory">
        <AdminProtectedRoute>
          <InventoryPageNew />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <AdminProtectedRoute>
          <OrdersPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/customers">
        <AdminProtectedRoute>
          <CustomersPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/messages">
        <AdminProtectedRoute>
          <MessagesPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/returns">
        <AdminProtectedRoute>
          <ReturnsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/gift-categories">
        <AdminProtectedRoute>
          <GiftCategoriesPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/gift-management">
        <AdminProtectedRoute>
          <GiftManagementPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/coupons">
        <AdminProtectedRoute>
          <CouponsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/book-requests">
        <AdminProtectedRoute>
          <BookRequestsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <AdminProtectedRoute>
          <AnalyticsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/shipping">
        <AdminProtectedRoute>
          <ShippingPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <AdminProtectedRoute>
          <SettingsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/account">
        <AdminProtectedRoute>
          <AdminAccountPage />
        </AdminProtectedRoute>
      </Route>

      <Route path="/admin/sales">
        <AdminProtectedRoute>
          <SalesPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/shipping">
        <AdminProtectedRoute>
          <ShippingPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/returns">
        <AdminProtectedRoute>
          <ReturnsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <AdminProtectedRoute>
          <SettingsPage />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/account">
        <AdminProtectedRoute>
          <AdminAccountPage />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/audit-trail">
        <AdminProtectedRoute>
          <AuditLogPage />
        </AdminProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
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
