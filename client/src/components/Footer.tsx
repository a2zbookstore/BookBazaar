import { Link } from "wouter";
import { SecretAdminAccess } from "@/components/SecretAdminAccess";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";

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

const modalContent: Record<string, { title: string; content: string }> = {
  "/shipping-info": {
    title: "Shipping Information",
    content: `
      <h3 class="text-lg font-semibold mb-3">Shipping Policy</h3>
      <p class="mb-4">We offer worldwide shipping for all our books. Shipping times and costs vary based on your location.</p>
      
      <h4 class="font-semibold mb-2">Domestic Shipping (USA)</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Standard Shipping: 5-7 business days</li>
        <li>Express Shipping: 2-3 business days</li>
        <li>Free shipping on orders over $50</li>
      </ul>
      
      <h4 class="font-semibold mb-2">International Shipping</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Standard International: 10-20 business days</li>
        <li>Express International: 5-10 business days</li>
        <li>Customs and duties may apply</li>
      </ul>
      
      <p class="mb-2">All orders are processed within 1-2 business days. You will receive a tracking number once your order ships.</p>
    `
  },
  "/return-policy": {
    title: "Return Policy",
    content: `
      <h3 class="text-lg font-semibold mb-3">Return & Refund Policy</h3>
      <p class="mb-4">We want you to be completely satisfied with your purchase. If you're not happy, we're here to help.</p>
      
      <h4 class="font-semibold mb-2">Return Period</h4>
      <p class="mb-4">You have 30 days from the date of delivery to return your item for a full refund or exchange.</p>
      
      <h4 class="font-semibold mb-2">Return Conditions</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Items must be in original condition</li>
        <li>Books must be unread and unmarked</li>
        <li>Original packaging should be intact</li>
        <li>Include proof of purchase</li>
      </ul>
      
      <h4 class="font-semibold mb-2">Refund Process</h4>
      <p class="mb-2">Once we receive your return, we'll inspect it and process your refund within 5-7 business days. The refund will be credited to your original payment method.</p>
      
      <p class="mt-4 text-sm text-gray-400">Note: Return shipping costs are the responsibility of the customer unless the item was damaged or defective.</p>
    `
  },
  "/cancellation-policy": {
    title: "Cancellation Policy",
    content: `
      <h3 class="text-lg font-semibold mb-3">Order Cancellation Policy</h3>
      <p class="mb-4">We understand plans change. Here's our cancellation policy:</p>
      
      <h4 class="font-semibold mb-2">Before Shipment</h4>
      <p class="mb-4">Orders can be cancelled free of charge before they are shipped. Please contact us as soon as possible at support@a2zbookshop.com.</p>
      
      <h4 class="font-semibold mb-2">After Shipment</h4>
      <p class="mb-4">Once an order has shipped, it cannot be cancelled. However, you can refuse delivery or return the item following our return policy.</p>
      
      <h4 class="font-semibold mb-2">How to Cancel</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Email us at support@a2zbookshop.com with your order number</li>
        <li>Call us at +1(414)-595-6843</li>
        <li>Use the "Cancel Order" button in your account dashboard</li>
      </ul>
      
      <p class="mb-2">Refunds for cancelled orders will be processed within 3-5 business days.</p>
    `
  },
  "/terms-and-conditions": {
    title: "Terms & Conditions",
    content: `
      <h3 class="text-lg font-semibold mb-3">Terms and Conditions</h3>
      <p class="mb-4">Welcome to A2Z BOOKSHOP. By accessing and using our website, you agree to the following terms and conditions.</p>
      
      <h4 class="font-semibold mb-2">Use of Website</h4>
      <p class="mb-4">This website is provided for your personal, non-commercial use. You may not modify, copy, distribute, transmit, display, or create derivative works from this site.</p>
      
      <h4 class="font-semibold mb-2">Product Information</h4>
      <p class="mb-4">We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.</p>
      
      <h4 class="font-semibold mb-2">Pricing</h4>
      <p class="mb-4">All prices are subject to change without notice. We reserve the right to modify or discontinue products at any time.</p>
      
      <h4 class="font-semibold mb-2">Privacy</h4>
      <p class="mb-4">Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.</p>
      
      <h4 class="font-semibold mb-2">Limitation of Liability</h4>
      <p class="mb-2">A2Z BOOKSHOP shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.</p>
      
      <p class="mt-4 text-sm text-gray-400">Last updated: January 2026</p>
    `
  },
  "/faq": {
    title: "Frequently Asked Questions",
    content: `
      <h3 class="text-lg font-semibold mb-3">Frequently Asked Questions</h3>
      
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold mb-2">How do I track my order?</h4>
          <p>Once your order ships, you'll receive a tracking number via email. You can also track your order in the "My Orders" section of your account.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Do you ship internationally?</h4>
          <p>Yes! We ship to most countries worldwide. Shipping costs and delivery times vary by location.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">What payment methods do you accept?</h4>
          <p>We accept Visa, Mastercard, PayPal, Stripe, and RazorPay for secure payments.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Are the books new or used?</h4>
          <p>We carry both new and collectible used books. The condition is clearly marked on each product page.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Can I cancel my order?</h4>
          <p>Yes, you can cancel your order before it ships. Please contact us immediately at support@a2zbookshop.com.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">What if my book arrives damaged?</h4>
          <p>We carefully package all books, but if yours arrives damaged, please contact us within 48 hours with photos and we'll arrange a replacement or refund.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-2">Do you offer gift wrapping?</h4>
          <p>Yes! We offer complimentary gift wrapping. Select this option at checkout.</p>
        </div>
      </div>
    `
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    content: `
      <h3 class="text-lg font-semibold mb-3">Privacy Policy</h3>
      <p class="mb-4">At A2Z BOOKSHOP, we are committed to protecting your privacy and personal information.</p>
      
      <h4 class="font-semibold mb-2">Information We Collect</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Name, email address, and contact information</li>
        <li>Shipping and billing addresses</li>
        <li>Payment information (processed securely through third-party providers)</li>
        <li>Order history and preferences</li>
        <li>Website usage data and cookies</li>
      </ul>
      
      <h4 class="font-semibold mb-2">How We Use Your Information</h4>
      <ul class="list-disc pl-5 mb-4">
        <li>Process and fulfill your orders</li>
        <li>Send order confirmations and shipping updates</li>
        <li>Respond to customer service requests</li>
        <li>Send promotional emails (you can opt-out anytime)</li>
        <li>Improve our website and services</li>
      </ul>
      
      <h4 class="font-semibold mb-2">Data Security</h4>
      <p class="mb-4">We use industry-standard encryption and security measures to protect your personal information. Payment data is processed through secure, PCI-compliant payment gateways.</p>
      
      <h4 class="font-semibold mb-2">Your Rights</h4>
      <p class="mb-4">You have the right to access, update, or delete your personal information. Contact us at support@a2zbookshop.com for any privacy-related requests.</p>
      
      <h4 class="font-semibold mb-2">Cookies</h4>
      <p class="mb-2">We use cookies to enhance your browsing experience and analyze website traffic. You can disable cookies in your browser settings.</p>
      
      <p class="mt-4 text-sm text-gray-400">Last updated: January 2026</p>
    `
  }
};



export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; content: string } | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  const openModal = (href: string) => {
    const content = modalContent[href];
    if (content) {
      setModalData(content);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white border-t border-gray-800">
      <div className="container-custom px-3 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-2xl font-bookerly font-bold text-white">
                A<span className="text-red-500">2</span>Z BOOKSHOP
              </h3>
              <SecretAdminAccess />
            </div>
            <p className="text-gray-400 leading-relaxed mb-4 text-sm">
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
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-aqua flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
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
                <button
                  key={link.href}
                  onClick={() => openModal(link.href)}
                  className="text-gray-400 hover:text-primary-aqua transition-colors text-xs cursor-pointer hover:underline"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 pt-4 text-gray-500">
          <p className="text-xs">
            © 2026 A<span className="text-red-500">2</span>Z BOOKSHOP. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1">
            Made with <span className="text-red-500">❤️</span> for book lovers
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal}
        title={modalData?.title || ""}
      >
        {modalData && (
          <div dangerouslySetInnerHTML={{ __html: modalData.content }} />
        )}
      </Modal>
    </footer>
  );
}
