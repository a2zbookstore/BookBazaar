import React from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import CountrySelector from "@/components/CountrySelector";
import { SecretAdminButton } from "@/components/SecretAdminButton";
import Footer from "@/components/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartCount, isCartAnimating } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`fixed-header bg-white border-b border-gray-200 w-full transition-all duration-300 ${
        isScrolled ? 'header-shadow bg-white/95 backdrop-blur-sm' : ''
      }`}>
        <div className="container-custom px-3 md:px-6">
          {/* Top Row - Logo, Search, Right Actions */}
          <div className={`flex items-center justify-between w-full transition-all duration-300 ${
            isScrolled ? 'h-12 md:h-18' : 'h-16 md:h-22'
          }`}>
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <div className="md:hidden">
                <Logo size="sm" variant="default" showText={true} />
              </div>
              <div className="hidden md:block">
                <Logo size="md" variant="default" showText={true} />
              </div>
            </Link>

            {/* Search Bar - Hidden on mobile, shown on desktop - Made Bigger Horizontally and Narrower Vertically */}
            <div className="hidden md:flex flex-1 max-w-6xl mx-8">
              <SearchInput 
                placeholder="Search books, authors, ISBN..."
                className="w-full h-8"
              />
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              
              {isAuthenticated && (
                <Link
                  href="/wishlist"
                  className={`text-secondary-black hover:text-primary-aqua transition-colors relative ${
                    isActive("/wishlist") ? "text-primary-aqua font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              
              {/* Secret Admin Access - Only visible to admins (hidden from customers) */}
              
              {/* Country Selector */}
              <div className="hidden lg:flex items-center ml-2">
                <CountrySelector compact={false} />
              </div>

              {/* Cart - accessible to all users */}
              <Link
                href="/cart"
                className={`transition-colors relative mx-3 p-2 rounded-lg hover:bg-primary-aqua/10 border border-transparent hover:border-primary-aqua/20 ${
                  isCartAnimating 
                    ? "cart-pulse-animation" 
                    : "text-secondary-black hover:text-primary-aqua cart-normal"
                }`}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    } catch (error) {
                      // Fallback to Replit logout
                      window.location.href = "/api/logout";
                    }
                  }}
                  className="text-secondary-black hover:text-primary-aqua"
                >
                  <User className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/login')}
                    className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => setLocation('/register')}
                    className="bg-primary-aqua hover:bg-secondary-aqua"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Right Actions - Clean Layout */}
            <div className="flex md:hidden items-center gap-3">
              {/* Mobile Cart */}
              <Link
                href="/cart"
                className={`transition-colors relative p-2 rounded-lg hover:bg-primary-aqua/10 ${
                  isCartAnimating 
                    ? "cart-pulse-animation" 
                    : "text-secondary-black hover:text-primary-aqua cart-normal"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-primary-aqua/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden px-3 pb-3">
            <SearchInput 
              placeholder="Search books, authors, ISBN..."
              className="w-full h-10"
            />
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <nav className="px-3 py-3 space-y-3">
                <Link
                  href="/"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/catalog"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/catalog") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Catalog
                </Link>
                <Link
                  href="/my-orders"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/my-orders") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/track-order"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/track-order") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Track Order
                </Link>
                <Link
                  href="/returns"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/returns") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Returns
                </Link>
                <Link
                  href="/contact"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/contact") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/request-book"
                  className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    isActive("/request-book") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Request Book
                </Link>
                
                {/* Mobile Country Selector */}
                <div className="py-3 border-t border-gray-100 mt-2">
                  <div className="text-sm text-gray-600 mb-2">Select your country:</div>
                  <CountrySelector compact={true} className="w-full" />
                </div>
                
                {isAuthenticated && (
                  <Link
                    href="/wishlist"
                    className={`block py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                      isActive("/wishlist") ? "bg-primary-aqua/10 text-primary-aqua" : "text-secondary-black hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {wishlistCount}
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Mobile Auth Buttons */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        try {
                          await fetch("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        } catch (error) {
                          window.location.href = "/api/logout";
                        }
                      }}
                      className="w-full h-12 text-base font-medium"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLocation('/login');
                        }}
                        className="w-full h-12 bg-primary-aqua hover:bg-secondary-aqua text-base font-medium"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLocation('/register');
                        }}
                        className="w-full h-12 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white text-base font-medium"
                      >
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}

          {/* Bottom Row - Navigation Buttons */}
          <div className="hidden md:flex items-center justify-center py-3 border-t border-gray-100">
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Home
              </Link>
              <Link
                href="/catalog"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/catalog") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/catalog"
                className="text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 text-gray-600"
              >
                Browse All Books
              </Link>
              <Link
                href="/catalog?featured=true"
                className="text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 text-gray-600"
              >
                Featured Collection
              </Link>
              <Link
                href="/my-orders"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/my-orders") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                My Orders
              </Link>
              <Link
                href="/track-order"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/track-order") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Track Order
              </Link>
              <Link
                href="/returns"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/returns") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Returns
              </Link>
              <Link
                href="/contact"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/contact") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Contact
              </Link>
              <Link
                href="/request-book"
                className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                  isActive("/request-book") ? "bg-primary-aqua text-white" : "text-gray-600"
                }`}
              >
                Request Book
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Fixed Cart Icon - Always Visible */}
      <Link
        href="/cart"
        className={`fixed-cart-icon ${
          isCartAnimating 
            ? "cart-pulse-animation" 
            : "text-secondary-black hover:text-primary-aqua"
        }`}
      >
        <ShoppingCart className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-abe-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
            {cartCount}
          </span>
        )}
      </Link>

      {/* Secret Admin Floating Button - Only visible to admins */}
      <SecretAdminButton />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        isScrolled ? 'pt-12 md:pt-16' : 'pt-14 md:pt-20'
      }`}>
        {children}
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
}
