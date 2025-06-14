import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";

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
import NotFound from "@/pages/not-found";

function Router() {
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
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/books/:id" component={BookDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      
      {/* Protected routes */}
      {isAuthenticated && (
        <>
          <Route path="/cart" component={CartPage} />
          
          {/* Admin routes */}
          {user?.role === "admin" && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/inventory" component={InventoryPageNew} />
              <Route path="/admin/orders" component={OrdersPage} />
              <Route path="/admin/sales" component={SalesPage} />
              <Route path="/admin/shipping" component={ShippingPage} />
              <Route path="/admin/settings" component={SettingsPage} />
            </>
          )}
        </>
      )}
      
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
          <Toaster />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
