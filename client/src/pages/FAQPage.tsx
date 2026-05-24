import { useState } from "react";
import SEO from "@/components/SEO";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const faqCategories = [
  {
    title: "Ordering & Payments",
    questions: [
      { q: "How do I place an order?", a: "Browse our collection, add books to your cart, and proceed to checkout. You can pay using credit/debit cards, UPI, PayPal, Apple Pay, or other methods shown at checkout." },
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and bank transfers. All payments are processed securely." },
      { q: "Can I pay in my local currency?", a: "Yes! We support multiple currencies including INR, USD, GBP, EUR, AUD, and more. Select your preferred currency from the currency selector on the site." },
      { q: "Is it safe to enter my card details?", a: "Absolutely. All payments are processed through Stripe and PayPal's secure payment infrastructure. We never store your full card details on our servers." },
      { q: "Will I receive an order confirmation?", a: "Yes, you'll receive an email confirmation immediately after placing your order with all the details including your order number." },
    ],
  },
  {
    title: "Shipping & Delivery",
    questions: [
      { q: "Do you ship internationally?", a: "Yes! We ship to 100+ countries worldwide. Shipping costs and delivery times are calculated at checkout based on your location." },
      { q: "How long will delivery take?", a: "USA & Canada: 3–7 business days. UK & Europe: 5–10 business days. Rest of World: 7–14 business days. These are estimates and may vary." },
      { q: "How can I track my order?", a: "Once your order ships, we'll email you a tracking number. You can also check your order status from your account dashboard or our Track Order page." },
      { q: "Do you offer free shipping?", a: "We occasionally run free shipping promotions. Standard shipping costs are calculated based on order weight and destination — always shown before you pay." },
      { q: "What if my package is lost?", a: "Contact us with your order number and we'll investigate with the carrier. If it's confirmed lost, we'll send a replacement or issue a full refund." },
    ],
  },
  {
    title: "Returns & Refunds",
    questions: [
      { q: "What is your return policy?", a: "You can return any book within 7 days of delivery, as long as it's in the same condition you received it. Contact us to initiate a return." },
      { q: "How do I return a book?", a: "Email us at support@a2zbookshop.com with your order number. We'll provide the return address and guide you through the process." },
      { q: "How long do refunds take?", a: "Once we receive the returned book: UPI/Wallets: 1–3 days. Cards: 5–7 days. PayPal: 2–3 days. International transfers: 7–10 days." },
      { q: "What if I received a damaged book?", a: "Take photos of the damage and email us within 48 hours of delivery. We'll arrange a free replacement or full refund — your choice." },
      { q: "Can I exchange instead of return?", a: "Yes! If you'd prefer a different book instead of a refund, let us know and we'll arrange an exchange (subject to availability)." },
    ],
  },
  {
    title: "Books & Products",
    questions: [
      { q: "Are all books brand new?", a: "We sell both new and curated second-hand books. Each listing clearly states the condition. Our second-hand books are carefully inspected for quality." },
      { q: "Can I request a specific book?", a: "Yes! If you can't find a book on our site, email us and we'll try to source it for you. No guarantees, but we'll do our best." },
      { q: "Do you sell eBooks or audiobooks?", a: "Currently, we only sell physical books. We may expand to digital formats in the future." },
      { q: "How do you rate book conditions?", a: "Second-hand books are rated as: Like New (minimal wear), Very Good (slight wear, no markings), Good (some wear, may have minor markings)." },
    ],
  },
  {
    title: "Account & Support",
    questions: [
      { q: "Do I need an account to order?", a: "You can checkout as a guest, but creating an account lets you track orders, save addresses, and view your order history." },
      { q: "How do I contact support?", a: "Email us at support@a2zbookshop.com or call +1 (414) 595-6843. We typically respond within 24 hours." },
      { q: "Can I cancel my order?", a: "Yes — if the order hasn't shipped yet, we can cancel it for a full refund. Once shipped, you'll need to use our return policy." },
      { q: "I forgot my password. What do I do?", a: "Click 'Forgot Password' on the login page. We'll email you a reset link. If you still have trouble, contact support." },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <SEO
        title="FAQ | A2Z BOOKSHOP"
        description="Frequently asked questions about ordering, shipping, returns, payments, and more at A2Z BOOKSHOP."
        keywords="FAQ, frequently asked questions, help, support, A2Z BOOKSHOP help"
        url="https://a2zbookshop.com/faq"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Got questions? We've answered the most common ones below. If you can't find what you're looking for, just reach out.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8 sm:space-y-10">
            {faqCategories.map((category, catIdx) => (
              <div key={catIdx}>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{category.title}</h2>
                <div className="space-y-2">
                  {category.questions.map((item, qIdx) => {
                    const id = `${catIdx}-${qIdx}`;
                    const isOpen = openItems.includes(id);
                    return (
                      <Collapsible key={id} open={isOpen} onOpenChange={() => toggleItem(id)}>
                        <CollapsibleTrigger className="w-full">
                          <div className={`flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl border border-gray-200 text-left hover:bg-gray-50 transition-colors ${isOpen ? 'rounded-b-none border-b-0' : ''}`}>
                            <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">{item.q}</span>
                            <span className="text-gray-400 text-xl flex-shrink-0">{isOpen ? '−' : '+'}</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-4 sm:px-5 pb-4 sm:pb-5">
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.a}</p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mt-10 sm:mt-14">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Still Have Questions?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Can't find the answer you're looking for? We're just a message away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:support@a2zbookshop.com" className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-aqua text-gray-900 rounded-lg font-semibold text-sm hover:bg-cyan-400 transition-colors">
                support@a2zbookshop.com
              </a>
              <a href="tel:+14145956843" className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-semibold text-sm hover:border-gray-400 hover:text-gray-100 transition-colors">
                +1 (414) 595-6843
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
