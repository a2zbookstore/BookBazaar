import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

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
import SalesPage from "@/pages/admin/SalesPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import ShippingPage from "@/pages/admin/ShippingPage";
import ReturnsPage from "@/pages/admin/ReturnsPage";
import AdminAccountPage from "@/pages/admin/AdminAccountPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import PayPalCompletePage from "@/pages/PayPalCompletePage";
import ReturnRequestPage from "@/pages/ReturnRequestPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ShippingInfoPage from "@/pages/ShippingInfoPage";
import ReturnPolicyPage from "@/pages/ReturnPolicyPage";
import CancellationPolicyPage from "@/pages/CancellationPolicyPage";
import TermsAndConditionsPage from "@/pages/TermsAndConditionsPage";
import FAQPage from "@/pages/FAQPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

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
      {/* Public routes - accessible to all users including guests */}
      <Route path="/" component={HomePage} />
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/books/:id" component={BookDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/track-order" component={TrackOrderPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/paypal-complete" component={PayPalCompletePage} />
      <Route path="/orders/:id" component={OrderDetailPage} />
      <Route path="/returns" component={ReturnRequestPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/shipping-info" component={ShippingInfoPage} />
      <Route path="/return-policy" component={ReturnPolicyPage} />
      <Route path="/cancellation-policy" component={CancellationPolicyPage} />
      <Route path="/terms-and-conditions" component={TermsAndConditionsPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/admin-login" component={AdminLoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
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
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <AppRouter />
          </WishlistProvider>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
