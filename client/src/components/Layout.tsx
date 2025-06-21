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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Header - ONLY FOR MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          {/* First Row - Logo and Actions */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/">
              <Logo size="sm" variant="default" showText={true} />
            </Link>
            <div className="flex items-center space-x-3">
              <CountrySelector />
              
              {/* Auth Buttons for Mobile */}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    } catch (error) {
                      window.location.href = "/api/logout";
                    }
                  }}
                  className="text-xs px-2 py-1"
                >
                  <User className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setLocation('/login')}
                  className="bg-primary-aqua hover:bg-secondary-aqua text-xs px-2 py-1"
                >
                  <User className="h-3 w-3 mr-1" />
                  Login
                </Button>
              )}
              
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {isAuthenticated && (
                <Link href="/wishlist" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Second Row - Search Bar */}
          <div className="mb-3">
            <SearchInput />
          </div>

          {/* Third Row - Navigation Buttons in Single Line */}
          <nav className="flex items-center justify-between text-xs pb-2 overflow-x-auto">
            <Link
              href="/"
              className={`flex-shrink-0 px-2 py-1 rounded transition-colors ${
                isActive("/") ? "text-primary-aqua font-semibold" : "text-gray-600"
              }`}
            >
              Home
            </Link>
            <Link
              href="/catalog"
              className={`flex-shrink-0 px-2 py-1 rounded transition-colors ${
                isActive("/catalog") ? "text-primary-aqua font-semibold" : "text-gray-600"
              }`}
            >
              Catalog
            </Link>
            <Link
              href="/track-order"
              className={`flex-shrink-0 px-2 py-1 rounded transition-colors ${
                isActive("/track-order") ? "text-primary-aqua font-semibold" : "text-gray-600"
              }`}
            >
              Track
            </Link>
            <Link
              href="/returns"
              className={`flex-shrink-0 px-2 py-1 rounded transition-colors ${
                isActive("/returns") ? "text-primary-aqua font-semibold" : "text-gray-600"
              }`}
            >
              Returns
            </Link>
            <Link
              href="/contact"
              className={`flex-shrink-0 px-2 py-1 rounded transition-colors ${
                isActive("/contact") ? "text-primary-aqua font-semibold" : "text-gray-600"
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 fixed top-32 left-0 right-0 z-40">
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
            
            {/* Mobile Country Selector */}
            <div className="py-3 border-t border-gray-200 mt-2">
              <div className="text-sm text-secondary-black mb-2">Select your country:</div>
              <CountrySelector compact={true} className="w-full" />
            </div>
            
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
                className="w-full touch-target mobile-button"
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
                  className="w-full bg-primary-aqua hover:bg-secondary-aqua touch-target mobile-button"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Desktop Header */}
      <header className={`hidden md:block ${isScrolled ? 'backdrop-blur-md bg-white/90 shadow-lg' : 'bg-white'} transition-all duration-300 sticky top-0 z-50 border-b border-gray-200`}>
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <Logo size="lg" variant="default" showText={true} />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-6xl mx-8">
              <SearchInput />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Currency & Country */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {userCurrency.symbol} {userCurrency.code}
                </Badge>
                <CountrySelector />
              </div>

              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-4">
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
              </nav>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  href="/wishlist"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors relative"
                >
                  <Heart className="h-5 w-5" />
                  <span className="hidden lg:inline">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors relative ${
                  isCartAnimating ? "cart-pulse-animation" : ""
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden lg:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth Button */}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    } catch (error) {
                      window.location.href = "/api/logout";
                    }
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button onClick={() => setLocation('/login')}>
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

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
                <h3 className="text-xl font-bookerly font-bold footer-logo">
                  A<span className="red-2">2</span>Z BOOKSHOP
                </h3>
                <SecretAdminAccess />
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner for quality books worldwide. Discover, explore, and enjoy the world of literature.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/catalog" className="text-gray-400 hover:text-white">Book Catalog</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/track-order" className="text-gray-400 hover:text-white">Track Order</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2">
                <li><Link href="/shipping-info" className="text-gray-400 hover:text-white">Shipping Info</Link></li>
                <li><Link href="/return-policy" className="text-gray-400 hover:text-white">Return Policy</Link></li>
                <li><Link href="/cancellation-policy" className="text-gray-400 hover:text-white">Cancellation Policy</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-conditions" className="text-gray-400 hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 support@a2zbookshop.com</p>
                <p>📧 a2zbookshopglobal@gmail.com</p>
                <p>🌐 https://a2zbookshop.com</p>
                <p>🌐 https://www.a2zbookshop.com</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 A<span className="text-red-500">2</span>Z BOOKSHOP. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Made with ❤️ for book lovers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
