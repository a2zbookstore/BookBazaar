import { Link } from "wouter";
import { SecretAdminAccess } from "@/components/SecretAdminAccess";

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
  ],
};

interface FooterSectionProps {
  title: string;
  links: Array<{ href: string; label: string }>;
}

function FooterSection({ title, links }: FooterSectionProps) {
  return (
    <div>
      <h4 className="font-semibold mb-4 text-white">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-300 hover:text-primary-aqua"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container-custom pt-8 pb-4 px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-xl font-bookerly font-bold text-white">
                A<span className="text-red-500">2</span>Z BOOKSHOP
              </h3>
              <SecretAdminAccess />
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Your trusted partner in discovering rare, collectible, and contemporary books from around the world.
            </p>
          </div>

          {/* Footer Links */}
          <FooterSection title="Quick Links" links={footerLinks.quickLinks} />
          <FooterSection title="Categories" links={footerLinks.categories} />
          <FooterSection title="Customer Service" links={footerLinks.customerService} />
        </div>

        {/* Footer Bottom */}
        <hr className="border-gray-700 my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-400 text-sm">
            © 2025 A<span className="text-red-500">2</span>Z BOOKSHOP. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">Made with ❤️ for book lovers worldwide</p>
        </div>
      </div>
    </footer>
  );
}
