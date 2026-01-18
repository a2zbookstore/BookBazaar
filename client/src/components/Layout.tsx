import React from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubHeader from "@/components/SubHeader";
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const headerHeight = 64; // px
  const subHeaderHeight = 20; // px
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SubHeader />
      <main
        className="flex-1 transition-all duration-300"
        style={{ paddingTop: `${headerHeight + subHeaderHeight}px` }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
