import SEO from "@/components/SEO";
import { FileText, Shield, CreditCard, Truck, Scale, Mail } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <>
      <SEO
        title="Terms and Conditions"
        description="Read the terms and conditions for shopping at A2Z BOOKSHOP. Understand our policies, user agreements, and legal information."
        keywords="terms and conditions, user agreement, legal terms, bookstore policies"
        url="https://a2zbookshop.com/terms"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-6 shadow-lg shadow-indigo-500/30">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Terms and Conditions
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A2Z BOOKSHOP - Online Bookstore
              </p>
              <p className="text-sm text-gray-500 mt-2">Last updated: June 18, 2025</p>
            </div>

            {/* Quick Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Secure Shopping</h3>
                <p className="text-sm text-gray-600">Your privacy and data security are our top priorities</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Fair Pricing</h3>
                <p className="text-sm text-gray-600">Transparent pricing with no hidden fees</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Reliable Delivery</h3>
                <p className="text-sm text-gray-600">Worldwide shipping with tracking</p>
              </div>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-6">
              {/* Acceptance */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By accessing and using the A2Z BOOKSHOP website (a2zbookshop.com), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions constitute a legally binding agreement between you and A2Z BOOKSHOP regarding your use of our online bookstore services.
                </p>
              </div>

              {/* Ordering */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Book Sales and Ordering</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Product Information</h3>
                    <p className="text-gray-700">We strive to provide accurate descriptions and images. However, minor variations may occur. Prices and availability subject to change without notice.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Order Process</h3>
                    <p className="text-gray-700">Orders are confirmed via email. We reserve the right to refuse or cancel orders at our discretion. All sales final unless covered by our return policy.</p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Accepted Methods</h3>
                    <p className="text-gray-700">We accept major credit cards, PayPal, and Razorpay. All transactions are encrypted and secure. Payment is due at time of order.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Currency</h3>
                    <p className="text-gray-700">Prices displayed in multiple currencies. Conversion rates updated regularly. Final charge based on exchange rate at time of processing.</p>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Shipping and Delivery</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Delivery Times</h3>
                    <p className="text-gray-700">Estimated delivery times are guidelines only. Actual delivery may vary. International shipments subject to customs delays.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Risk of Loss</h3>
                    <p className="text-gray-700">Risk of loss passes to buyer upon delivery to carrier. We're not responsible for delayed or lost packages, but will assist in claims.</p>
                  </div>
                </div>
              </div>

              {/* Returns */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Returns and Refunds</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We offer a 30-day return guarantee for items in original condition. Digital downloads and personalized items are non-returnable. 
                  See our Return Policy page for complete details.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Refunds processed to original payment method within 3-5 business days of receiving returned items. Shipping costs non-refundable unless error on our part.
                </p>
              </div>

              {/* Privacy & Liability */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy & Limitation of Liability</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Privacy</h3>
                    <p className="text-gray-700">Your personal information is protected per our Privacy Policy. We never sell your data to third parties.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Liability</h3>
                    <p className="text-gray-700">Our liability limited to the purchase price paid. We're not liable for indirect, incidental, or consequential damages.</p>
                  </div>
                </div>
              </div>

              {/* Dispute Resolution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Dispute Resolution</h2>
                <div className="flex items-start gap-4">
                  <Scale className="h-6 w-6 text-indigo-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      Any disputes arising from these terms shall be governed by the laws of the jurisdiction where A2Z BOOKSHOP operates.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      We encourage resolution through direct communication before pursuing formal legal action.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-8 text-white shadow-xl shadow-indigo-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-8 w-8" />
                  <h2 className="text-2xl font-bold">Contact Information</h2>
                </div>
                <p className="text-indigo-100 mb-4">
                  Questions about our terms? Our team is here to help.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:legal@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Email Legal Team
                  </a>
                  <a href="tel:1-800-BOOKS-24" className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/30">
                    1-800-BOOKS-24
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>© 2025 A<span className="text-red-600">2</span>Z BOOKSHOP. All rights reserved.</p>
              <p className="mt-2">Last updated: June 18, 2025 | Version 1.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
