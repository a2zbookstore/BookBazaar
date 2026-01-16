import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle, Book, ShoppingCart, Truck, CreditCard, Mail, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (item: string) => {
    setOpenItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const faqCategories = [
    {
      title: "Ordering & Payment",
      icon: <ShoppingCart className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      items: [
        {
          id: "payment-methods",
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Razorpay for international customers, and bank transfers. All payments are processed securely through encrypted connections."
        },
        {
          id: "order-process",
          question: "How do I place an order?",
          answer: "Simply browse our catalog, add books to your cart, and proceed to checkout. You can create an account for faster future orders or checkout as a guest. We'll send you an order confirmation email with tracking information."
        },
        {
          id: "order-changes",
          question: "Can I modify or cancel my order after placing it?",
          answer: "You can modify or cancel your order within 2 hours of placing it by contacting our customer service team. After that, orders enter our fulfillment process and cannot be changed."
        },
        {
          id: "bulk-orders",
          question: "Do you offer discounts for bulk orders?",
          answer: "Yes! We offer special pricing for orders of 10+ books, educational institutions, libraries, and book clubs. Contact us at bulk@a2zbookshop.com for a custom quote."
        }
      ]
    },
    {
      title: "Books & Inventory",
      icon: <Book className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      items: [
        {
          id: "book-condition",
          question: "How do you grade book conditions?",
          answer: "We use industry-standard grading: New (brand new), Like New (minimal wear), Very Good (light wear, all pages intact), Good (moderate wear but readable), Fair (heavy wear but complete). Each book's condition is clearly marked."
        },
        {
          id: "rare-books",
          question: "Do you sell rare and collectible books?",
          answer: "Yes! We specialize in rare, out-of-print, and collectible books. Each rare book comes with detailed condition descriptions, provenance information when available, and authenticity guarantees."
        },
        {
          id: "book-requests",
          question: "Can you help me find a specific book?",
          answer: "Absolutely! Our book specialists can help locate hard-to-find titles. Email us at search@a2zbookshop.com with the title, author, and any other details. We'll search our network of book dealers worldwide."
        },
        {
          id: "digital-books",
          question: "Do you sell digital or e-books?",
          answer: "Currently, we focus exclusively on physical books. We believe in the tactile experience of reading and the lasting value of physical book collections."
        }
      ]
    },
    {
      title: "Shipping & Delivery",
      icon: <Truck className="h-5 w-5" />,
      gradient: "from-primary-aqua to-cyan-500",
      items: [
        {
          id: "shipping-times",
          question: "How long does shipping take?",
          answer: "Domestic orders: 3-7 business days standard, 1-3 days express. International orders: 7-14 business days. Rare books may require additional processing time for careful packaging."
        },
        {
          id: "shipping-costs",
          question: "How much does shipping cost?",
          answer: "Domestic shipping starts at $4.99, with free shipping on orders over $35. International shipping varies by destination. Exact costs are calculated at checkout based on your location and order size."
        },
        {
          id: "international-shipping",
          question: "Do you ship internationally?",
          answer: "Yes, we ship to over 200 countries worldwide. International orders may be subject to customs duties and taxes, which are the customer's responsibility. We provide all necessary customs documentation."
        },
        {
          id: "order-tracking",
          question: "How can I track my order?",
          answer: "Once your order ships, you'll receive a tracking number via email. You can also track your order on our website using your order number and email address on our Track Order page."
        }
      ]
    },
    {
      title: "Returns & Exchanges",
      icon: <CreditCard className="h-5 w-5" />,
      gradient: "from-green-500 to-emerald-500",
      items: [
        {
          id: "return-policy",
          question: "What is your return policy?",
          answer: "We offer a 30-day return guarantee on all books in original condition. Returns are easy - just submit a return request online or contact customer service. We provide prepaid return labels for your convenience."
        },
        {
          id: "return-process",
          question: "How do I return a book?",
          answer: "Visit our Returns page, enter your order details, select items to return, and choose your reason. We'll email you a prepaid return label. Ship the items back within 5 days of approval for a full refund."
        },
        {
          id: "damaged-books",
          question: "What if I receive a damaged book?",
          answer: "Contact us immediately with photos of the damage. We'll arrange for immediate replacement or full refund, including free return shipping. Damaged items receive priority processing."
        },
        {
          id: "refund-timeline",
          question: "How long do refunds take?",
          answer: "Refunds are processed within 3-5 business days after we receive and inspect returned items. The timeline depends on your payment method: credit cards (3-5 days), PayPal (1-2 days), bank transfers (5-7 days)."
        }
      ]
    },
    {
      title: "Account & Technical",
      icon: <HelpCircle className="h-5 w-5" />,
      gradient: "from-orange-500 to-red-500",
      items: [
        {
          id: "create-account",
          question: "Do I need an account to order?",
          answer: "No, you can checkout as a guest. However, creating an account allows you to track orders, save favorites to your wishlist, view order history, and enjoy faster checkouts for future purchases."
        },
        {
          id: "forgot-password",
          question: "I forgot my password. How do I reset it?",
          answer: "Click 'Forgot Password' on the login page and enter your email address. We'll send you a secure link to reset your password. If you don't receive the email, check your spam folder or contact customer service."
        },
        {
          id: "website-issues",
          question: "I'm having trouble with the website. What should I do?",
          answer: "Try clearing your browser cache and cookies, or try a different browser. If problems persist, contact our technical support team at support@a2zbookshop.com with details about the issue and your browser type."
        },
        {
          id: "mobile-app",
          question: "Do you have a mobile app?",
          answer: "Our website is fully optimized for mobile devices and works seamlessly on all smartphones and tablets. You can browse, search, and order books directly from your mobile browser with the same great experience."
        }
      ]
    }
  ];

  return (
    <Layout>
      <SEO
        title="Frequently Asked Questions (FAQ)"
        description="Find answers to common questions about ordering, shipping, returns, and payments at A2Z BOOKSHOP. Get help with your book purchases."
        keywords="faq, frequently asked questions, book ordering help, shipping questions, returns policy, payment methods"
        url="https://a2zbookshop.com/faq"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 mb-6 shadow-lg shadow-cyan-500/30">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Find answers to common questions about A2Z BOOKSHOP
              </p>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <a href="mailto:support@a2zbookshop.com" className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-600">support@a2zbookshop.com</p>
              </a>

              <a href="tel:1-800-BOOKS-24" className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
                <p className="text-sm text-gray-600">1-800-BOOKS-24</p>
              </a>

              <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600">Available 24/7</p>
              </div>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-6">
              {faqCategories.map((category, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white`}>
                        {category.icon}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {category.items.map((item) => (
                      <Collapsible
                        key={item.id}
                        open={openItems.includes(item.id)}
                        onOpenChange={() => toggleItem(item.id)}
                      >
                        <CollapsibleTrigger className="w-full text-left p-6 hover:bg-gray-50/50 transition-colors group">
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-aqua transition-colors">
                              {item.question}
                            </h3>
                            <ChevronDown 
                              className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                                openItems.includes(item.id) ? 'rotate-180 text-primary-aqua' : ''
                              }`}
                            />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-6 pb-6">
                          <p className="text-gray-700 leading-relaxed pt-2">
                            {item.answer}
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Still Have Questions CTA */}
            <div className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-aqua to-cyan-500 p-8 text-white shadow-xl shadow-cyan-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold mb-2">Still Have Questions?</h3>
                <p className="text-cyan-50 mb-4">
                  Can't find the answer you're looking for? Our customer service team is here to help!
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:support@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-primary-aqua rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Email Support
                  </a>
                  <a href="tel:1-800-BOOKS-24" className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/30">
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
