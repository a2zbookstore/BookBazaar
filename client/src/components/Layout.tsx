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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const hiddenRef = useRef(false);
  const lastScrollY = useRef(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true
  );

  const showCategoryHeader = location === "/" || location === "/catalog";

  // Always keep baseMarginRef fresh so the scroll handler uses current values
  const baseMarginRef = useRef(0);
  useEffect(() => {
    const bp = isDesktop ? MARGIN.desktop : MARGIN.mobile;
    baseMarginRef.current = showCategoryHeader ? bp.withCategory : bp.base;
    // Re-apply margin immediately when layout breakpoint/route changes
    if (mainRef.current) {
      const offset = hiddenRef.current ? PRE_HEADER_HEIGHT : 0;
      mainRef.current.style.marginTop = `${baseMarginRef.current - offset}px`;
    }
  }, [isDesktop, showCategoryHeader]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handle = () => {
      const y = document.body.scrollTop;
      const shouldHide = y > 4;
      if (shouldHide !== hiddenRef.current) {
        hiddenRef.current = shouldHide;
        const offset = shouldHide ? PRE_HEADER_HEIGHT : 0;
        if (wrapperRef.current) wrapperRef.current.style.top = `-${offset}px`;
        if (mainRef.current) mainRef.current.style.marginTop = `${baseMarginRef.current - offset}px`;
        document.documentElement.style.setProperty('--ph-offset', `${offset}px`);
      }
      lastScrollY.current = y;
    };
    document.body.addEventListener('scroll', handle, { passive: true });
    return () => document.body.removeEventListener('scroll', handle);
  }, []);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const bp = isDesktop ? MARGIN.desktop : MARGIN.mobile;
  const baseMargin = showCategoryHeader ? bp.withCategory : bp.base;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div
        ref={wrapperRef}
        className="fixed left-0 right-0 z-40"
        style={{ top: '0px', transition: 'top 400ms cubic-bezier(0.4,0,0.2,1)' }}
      >
        <PreHeader/>
        <Header />
      </div>
      {showCategoryHeader && <CategoryHeader />}
      <main
        ref={mainRef}
        className="flex-1 px-4 pb-12"
        style={{ marginTop: `${baseMargin}px`, transition: 'margin-top 400ms cubic-bezier(0.4,0,0.2,1)' }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
