import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle, Book, ShoppingCart, Truck, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

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
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions about A2Z BOOKSHOP
            </p>
          </div>

          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Contact</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-600">help@a2zbookshop.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">Phone Support</h3>
                    <p className="text-sm text-gray-600">1-800-BOOKS-24</p>
                    <p className="text-xs text-gray-500">Mon-Fri 9 AM - 6 PM EST</p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900">Live Chat</h3>
                    <p className="text-sm text-gray-600">Available on website</p>
                    <p className="text-xs text-gray-500">Mon-Fri 9 AM - 6 PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {faqCategories.map((category) => (
              <Card key={category.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <Collapsible key={item.id}>
                        <CollapsibleTrigger
                          className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => toggleItem(item.id)}
                        >
                          <span className="font-medium text-gray-900">{item.question}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform ${openItems.includes(item.id) ? 'rotate-180' : ''
                              }`}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 py-3 text-gray-600 bg-white border-l-4 border-primary-aqua">
                          {item.answer}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Still Have Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Can't find the answer you're looking for? Our customer service team is here to help!
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Options</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>📧 Email: <a href="mailto:help@a2zbookshop.com" className="text-primary-aqua hover:underline">help@a2zbookshop.com</a></li>
                      <li>📞 Phone: 1-800-BOOKS-24 (1-800-266-5724)</li>
                      <li>💬 <Link href="/contact" className="text-primary-aqua hover:underline">Contact Form</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Hours</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>Monday - Friday: 9:00 AM - 6:00 PM EST</li>
                      <li>Saturday: 10:00 AM - 4:00 PM EST</li>
                      <li>Sunday: Closed</li>
                      <li>Email support available 24/7</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📚 Book Lover's Tip</h3>
            <p className="text-blue-800">
              Join our email newsletter for exclusive deals, new arrivals, and book recommendations tailored to your interests.
              Plus, get 10% off your first order when you sign up!
            </p>
          </div>
        </div>
      </div>
    </Layout>

  );
}