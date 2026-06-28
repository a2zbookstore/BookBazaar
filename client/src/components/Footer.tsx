import { Link } from "wouter";
import { SecretAdminAccess } from "@/components/SecretAdminAccess";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const footerLinks = {
  quickLinks: [
    { href: "/", label: "Home" },
    { href: "/catalog", label: "Catalog" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
  categories: [
    { href: "/catalog?category=fiction", label: "Fiction" },
    { href: "/catalog?category=non-fiction", label: "Non-Fiction" },
    { href: "/catalog?category=rare", label: "Rare Books" },
    { href: "/catalog?category=academic", label: "Academic" },
  ],
  customerService: [
    { href: "/shipping-info", label: "Shipping Info" },
    { href: "/return-policy", label: "Return Policy" },
    { href: "/cancellation-policy", label: "Cancellation Policy" },
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
    { href: "/faq", label: "FAQ" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/data-deletion", label: "Data Deletion" },
    { href: "/contact", label: "Contact Us" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast({
            title: "Subscribed!",
            description: "Newsletter subscription successful. Confirmation email sent.",
            variant: "default"
          });
        } else {
          toast({
            title: "Subscription Failed",
            description: data.message || "Could not subscribe. Please try again.",
            variant: "destructive"
          });
        }
      } catch (err: any) {
        toast({
          title: "Network Error",
          description: err?.message || "Could not subscribe. Please try again.",
          variant: "destructive"
        });
      }
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white border-t border-gray-800">
      <div className="container-custom px-3 md:px-6 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-2xl font-bookerly font-bold text-white">
                A<span className="text-red-500">2</span>Z BOOKSHOP
              </h3>
              {user?.role === "admin" && <SecretAdminAccess />}
            </div>
            <p className="text-gray-400 leading-relaxed mb-2 sm:mb-4 text-sm">
              Your trusted partner in discovering rare, collectible, and contemporary books from around the world.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-primary-aqua" />
                <a href="mailto:support@a2zbookshop.com" className="hover:text-primary-aqua transition-colors">
                  support@a2zbookshop.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-primary-aqua" />
                <a href="tel:+14145956843" className="hover:text-primary-aqua transition-colors">
                  +1(414)-595-6843
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-primary-aqua" />
                <span>Worldwide Delivery</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href="https://m.facebook.com/profile.php?id=61563156131407&name=xhp_nt__fblite__profile__tab_bar&profile_tab_item_selected=reels"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
             
              <a
                href="https://www.instagram.com/a2zbookshop99"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-4 flex-1 ">
            {/* Newsletter Section */}
            <div className="mb-4">
              <h4 className="font-semibold mb-3 text-white text-base">
                Newsletter
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Get special offers and updates on new arrivals.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-aqua text-sm text-white placeholder-gray-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-primary-aqua to-cyan-500 hover:from-cyan-500 hover:to-primary-aqua text-white rounded-full font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary-aqua/30 flex items-center gap-2"
                >
                  {subscribed ? "✓" : <Send className="w-4 h-4" />} Send
                </button>
              </form>
            </div>
            {/* Customer Service Links - Horizontal Row */}
            <div className="py-4 border-t border-gray-800"></div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start">
              {footerLinks.customerService.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-primary-aqua transition-colors text-xs hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:pt-4 text-gray-500">
          <p className="text-xs">
            © 2026 A<span className="text-red-500">2</span>Z BOOKSHOP. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1">
            Made with <span className="text-red-500">❤️</span> for book lovers
          </p>
        </div>
      </div>

    </footer>
  );
}
