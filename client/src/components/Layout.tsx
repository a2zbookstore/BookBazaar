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

            {/* Search Bar - Hidden on mobile, shown on desktop */}
            <div className="hidden md:flex flex-1 max-w-4xl mx-6">
              <SearchInput 
                placeholder="Search books, authors, ISBN..."
                className="w-full"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                href="/"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/catalog"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/catalog") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/about"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/about") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                About
              </Link>
              <Link
                href="/contact"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/contact") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                Contact
              </Link>
              <Link
                href="/track-order"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/track-order") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                Track Order
              </Link>
              
              <Link
                href="/returns"
                className={`text-secondary-black hover:text-primary-aqua transition-colors ${
                  isActive("/returns") ? "text-primary-aqua font-semibold" : ""
                }`}
              >
                Returns
              </Link>
              
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
              
              {/* Currency Indicator */}
              <div className="flex items-center ml-3">
                <Badge variant="outline" className="text-xs font-medium bg-primary-aqua/10 border-primary-aqua text-primary-aqua">
                  {getSupportedCurrencies().find(c => c.code === userCurrency)?.symbol || '$'} {userCurrency}
                </Badge>
                {userLocation?.country && (
                  <span className="text-xs text-gray-500 ml-2 hidden md:inline">
                    {userLocation.country}
                  </span>
                )}
              </div>

              {/* Cart - accessible to all users */}
              <Link
                href="/cart"
                className={`transition-colors relative ml-2 ${
                  isCartAnimating 
                    ? "cart-pulse-animation" 
                    : "text-secondary-black hover:text-primary-aqua cart-normal"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button size="sm" className="bg-primary-aqua hover:bg-secondary-aqua text-xs px-2 py-1 ml-2">
                        Admin
                      </Button>
                    </Link>
                  )}
                  
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
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation('/admin-login')}
                    className="border-gray-400 text-gray-600 hover:bg-gray-50 text-xs px-2 py-1"
                  >
                    Admin
                  </Button>
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
                
                {/* Mobile Currency Display */}
                <div className="py-2 border-t border-gray-200 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-black">Currency:</span>
                    <Badge variant="outline" className="text-xs font-medium bg-primary-aqua/10 border-primary-aqua text-primary-aqua">
                      {getSupportedCurrencies().find(c => c.code === userCurrency)?.symbol || '$'} {userCurrency}
                    </Badge>
                  </div>
                  {userLocation?.country && (
                    <div className="text-xs text-gray-500 mt-1">
                      Location: {userLocation.country}
                    </div>
                  )}
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
                      {user?.role === "admin" && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full mb-2 bg-primary-aqua hover:bg-secondary-aqua touch-target mobile-button">
                            Admin Panel
                          </Button>
                        </Link>
                      )}
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
                        variant="outline"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLocation('/admin-login');
                        }}
                        className="w-full touch-target mobile-button"
                      >
                        Admin Login
                      </Button>
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setLocation('/login');
                        }}
                        className="w-full bg-primary-aqua hover:bg-secondary-aqua touch-target mobile-button"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Customer Login
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
              <h3 className="text-xl font-bookerly font-bold mb-4">A<span className="text-red-500">2</span>Z BOOKSHOP</h3>
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
