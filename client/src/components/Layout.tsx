import React from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import CountrySelector from "@/components/CountrySelector";
import { SecretAdminButton } from "@/components/SecretAdminButton";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubHeader from "@/components/SubHeader";
import { SiWhatsapp } from "react-icons/si";


interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartCount, isCartAnimating } = useGlobalContext();
  // Height of header + subheader (adjust as needed for your design)
  const headerHeight = 64; // px
  const subHeaderHeight = 48; // px
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
