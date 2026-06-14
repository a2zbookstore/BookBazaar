import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ChevronDown } from "lucide-react";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";

export default function SubHeader() {
  const [location] = useLocation();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Close the mega menu on Escape.
  useEffect(() => {
    if (!isCategoryMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCategoryMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCategoryMenuOpen]);

  return (
    <div className="hidden md:block fixed top-[64px] md:top-[100px] left-0 w-full bg-white border-b border-gray-100 z-20">
      <nav className="flex items-center justify-center gap-4 py-3">
        <button
          type="button"
          onClick={() => setIsCategoryMenuOpen((open) => !open)}
          aria-haspopup="true"
          aria-expanded={isCategoryMenuOpen}
          className="flex items-center gap-2 text-sm px-3 py-1 rounded bg-primary-aqua text-white hover:bg-secondary-aqua transition-colors"
        >
          <Menu className="h-4 w-4" />
          Categories
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
        <Link
          href="/"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Home
        </Link>
        <Link
          href="/catalog"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/catalog") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Catalog
        </Link>
        <Link
          href="/my-orders"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/my-orders") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          My Orders
        </Link>
        <Link
          href="/track-order"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/track-order") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Track Order
        </Link>
        <Link
          href="/returns"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/returns") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Returns
        </Link>
        <Link
          href="/contact"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/contact") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Contact
        </Link>
        <Link
          href="/request-book"
          className={`text-sm px-3 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 ${isActive("/request-book") ? "bg-primary-aqua text-white" : "text-gray-600"}`}
        >
          Request Book
        </Link>
      </nav>

      {/* Category / Subcategory mega menu — drops down below the SubHeader */}
      {isCategoryMenuOpen && (
        <>
          {/* Backdrop covers everything below the SubHeader bar */}
          {/* Dim backdrop */}
          <div
            className="fixed inset-0 top-[112px] z-10 bg-black/20"
            onClick={() => setIsCategoryMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Floating panel — inset from screen edges, rounded, elevated */}
          <div className="absolute left-4 right-4 sm:left-8 sm:right-8 lg:left-12 lg:right-12 top-full mt-2 bg-white rounded-2xl shadow-2xl ring-1 ring-black/[0.06] z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-5 sm:p-6 lg:p-8">
              <CategoryMegaMenu onNavigate={() => setIsCategoryMenuOpen(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
