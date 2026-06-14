import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PreHeader from "./PreHeader";
import CategoryHeader from "./CategoryHeader";
interface LayoutProps {
  children: React.ReactNode;
}

const PRE_HEADER_HEIGHT = 36;

// Margin values per breakpoint (px)
// mobile  = no PreHeader (hidden on <sm), shorter header
// desktop = PreHeader + taller header
const MARGIN = {
  mobile:  { base: 120, withCategory: 190 },
  desktop: { base: 120, withCategory: 120 },
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const [preHeaderVisible, setPreHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      if (y <= 4) {
        setPreHeaderVisible(true);
      } else if (y > lastScrollY.current) {
        setPreHeaderVisible(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const headerOffset = preHeaderVisible ? 0 : PRE_HEADER_HEIGHT;
  const showCategoryHeader = location === "/" || location === "/catalog";
  const bp = isDesktop ? MARGIN.desktop : MARGIN.mobile;
  const baseMargin = showCategoryHeader ? bp.withCategory : bp.base;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div
        className="fixed left-0 right-0 z-40"
        style={{
          top: `-${headerOffset}px`,
          transition: 'top 0.3s ease-in-out',
        }}
      >
        <PreHeader/>
        <Header />
      </div>
      {showCategoryHeader && <CategoryHeader />}
      <main
        className="flex-1 px-4 sm:px-8 pb-12"
        style={{
          marginTop: `calc(${baseMargin}px - ${headerOffset}px)`,
          transition: 'margin-top 0.3s ease-in-out',
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
