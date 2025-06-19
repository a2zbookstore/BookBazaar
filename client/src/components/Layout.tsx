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
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { Badge } from "@/components/ui/badge";
import CountrySelector from "@/components/CountrySelector";
import { SecretAdminButton, SecretAdminNav } from "@/components/SecretAdminButton";
import { SecretAdminAccess } from "@/components/SecretAdminAccess";

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
  const { location: userLocation } = useShipping();
  const { userCurrency, formatAmount, getSupportedCurrencies } = useCurrency(userLocation?.countryCode);

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
          <div className={`flex items-center justify-between w-full transition-all duration-300 ${
            isScrolled ? 'h-12 md:h-16' : 'h-14 md:h-20'
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

            {/* Desktop Navigation - Small Buttons */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={`text-xs px-2 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                    isActive("/") ? "bg-primary-aqua text-white" : "text-gray-600"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/catalog"
                  className={`text-xs px-2 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                    isActive("/catalog") ? "bg-primary-aqua text-white" : "text-gray-600"
                  }`}
                >
                  Catalog
                </Link>
                <Link
                  href="/track-order"
                  className={`text-xs px-2 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                    isActive("/track-order") ? "bg-primary-aqua text-white" : "text-gray-600"
                  }`}
                >
                  Track Order
                </Link>
                <Link
                  href="/returns"
                  className={`text-xs px-2 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${
                    isActive("/returns") ? "bg-primary-aqua text-white" : "text-gray-600"
                  }`}
                >
                  Returns
                </Link>
              </div>
              
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
              <div className="hidden lg:flex items-center ml-3">
                <CountrySelector compact={false} />
              </div>

              {/* Cart - accessible to all users */}
              <Link
                href="/cart"
                className={`transition-colors relative ml-3 p-2 rounded-md hover:bg-gray-100 ${
                  isCartAnimating 
                    ? "cart-pulse-animation" 
                    : "text-secondary-black hover:text-primary-aqua cart-normal"
                }`}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-4">
              {/* Mobile Cart */}
              <Link
                href="/cart"
                className={`transition-colors relative touch-target ${
                  isCartAnimating 
                    ? "cart-pulse-animation" 
                    : "text-secondary-black hover:text-primary-aqua cart-normal"
                }`}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="touch-target"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 pb-4">
            <SearchInput 
              placeholder="Search books, authors, ISBN..."
              className="w-full"
            />
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
              <nav className="px-4 py-4 space-y-4">
                <Link
                  href="/"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/catalog"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/catalog") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Catalog
                </Link>
                <Link
                  href="/about"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/about") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/contact") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/track-order"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/track-order") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Track Order
                </Link>
                <Link
                  href="/returns"
                  className={`block py-2 text-lg touch-target ${
                    isActive("/returns") ? "text-primary-aqua font-semibold" : "text-secondary-black"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Returns
                </Link>
                
                {/* Mobile Country Selector */}
                <div className="py-3 border-t border-gray-200 mt-2">
                  <div className="text-sm text-secondary-black mb-2">Select your country:</div>
                  <CountrySelector compact={true} className="w-full" />
                </div>
                
                {isAuthenticated && (
                  <Link
                    href="/wishlist"
                    className={`block py-2 text-lg touch-target ${
                      isActive("/wishlist") ? "text-primary-aqua font-semibold" : "text-secondary-black"
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
                <div className="pt-4 border-t border-gray-200">
                  {isAuthenticated ? (
                    <>

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
                        className="w-full touch-target mobile-button"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLocation('/login');
                        }}
                        className="w-full bg-primary-aqua hover:bg-secondary-aqua touch-target mobile-button"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}
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
      <footer className="bg-base-black text-white mt-16">
        <div className="container-custom py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bookerly font-bold">A<span className="text-red-500">2</span>Z BOOKSHOP</h3>
                <SecretAdminAccess />
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner in discovering rare, collectible, and contemporary books from around the world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/catalog" className="text-gray-400 hover:text-white transition-colors">Catalog</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                <li><Link href="/catalog?category=fiction" className="text-gray-400 hover:text-white transition-colors">Fiction</Link></li>
                <li><Link href="/catalog?category=non-fiction" className="text-gray-400 hover:text-white transition-colors">Non-Fiction</Link></li>
                <li><Link href="/catalog?category=rare" className="text-gray-400 hover:text-white transition-colors">Rare Books</Link></li>
                <li><Link href="/catalog?category=academic" className="text-gray-400 hover:text-white transition-colors">Academic</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2">
                <li><Link href="/shipping-info" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/return-policy" className="text-gray-400 hover:text-white transition-colors">Return Policy</Link></li>
                <li><Link href="/cancellation-policy" className="text-gray-400 hover:text-white transition-colors">Cancellation Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <hr className="border-gray-700 my-8" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 A<span className="text-red-500">2</span>Z BOOKSHOP. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Made with ❤️ for book lovers worldwide</p>
          </div>
          

        </div>
      </footer>
    </div>
  );
}
