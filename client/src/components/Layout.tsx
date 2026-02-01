import React from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubHeader from "@/components/SubHeader";
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-40">
        <Header />
        <SubHeader />
      </div>
      <main
        className="flex-1 transition-all duration-300 mt-[calc(100px+48px)] sm:mt-[calc(70px+48px)] px-4 sm:px-8 w-screen"
      >
        {children} 
      </main>
      <Footer />
    </div>
  );
}
