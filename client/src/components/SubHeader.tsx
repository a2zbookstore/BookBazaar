import React from "react";
import { Link, useLocation } from "wouter";

export default function SubHeader() {
  const [location] = useLocation();
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed top-[64px] left-0 w-full bg-white border-b border-gray-100 flex items-center justify-center py-3 z-20">
      <nav className="flex items-center gap-4">
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
    </div>
  );
}
