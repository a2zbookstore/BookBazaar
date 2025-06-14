import React from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bookerly font-bold text-base-black">A2Z BOOKSHOP</h1>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search books, authors, ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 rounded-none border-gray-300 focus:border-primary-aqua"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-4 bg-primary-aqua hover:bg-secondary-aqua rounded-none"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
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
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/cart"
                    className="text-secondary-black hover:text-primary-aqua transition-colors relative"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                        Admin
                      </Button>
                    </Link>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = "/api/logout"}
                    className="text-secondary-black hover:text-primary-aqua"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-base-black text-white mt-16">
        <div className="container-custom py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bookerly font-bold mb-4">A2Z BOOKSHOP</h3>
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
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Return Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <hr className="border-gray-700 my-8" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 A2Z BOOKSHOP. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Made with ❤️ for book lovers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
