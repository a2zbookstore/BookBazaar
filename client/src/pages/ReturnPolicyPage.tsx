import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { RotateCcw, Clock, Shield, Check, AlertCircle } from "lucide-react";

export default function ReturnPolicyPage() {
  return (
    <Layout>
      <SEO
        title="Return Policy"
        description="A2Z BOOKSHOP's 30-day return guarantee. Learn about our hassle-free return process, refund policy, and customer satisfaction commitment."
        keywords="return policy, book returns, refund policy, 30-day guarantee, customer satisfaction"
        url="https://a2zbookshop.com/return-policy"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-lg shadow-green-500/30">
                <RotateCcw className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Return Policy
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We want you to be completely satisfied with your book purchases
              </p>
            </div>

            {/* 30-Day Guarantee Badge */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white mb-12 shadow-xl shadow-green-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <Shield className="h-10 w-10" />
                  <h2 className="text-3xl font-bold">30-Day Return Guarantee</h2>
                </div>
                <p className="text-green-50 text-lg">
                  Return any book within 30 days of delivery for a full refund, no questions asked. 
                  We stand behind the quality of our books and your satisfaction.
                </p>
              </div>
            </div>

            {/* Return Conditions */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Eligible Items</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Books in original condition</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unopened sealed items</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Items with original packaging</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Books without writing or highlighting</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Non-Returnable</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Digital downloads</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Personalized or custom books</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Books with significant damage</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Gift cards</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Return Process Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Return Timeline</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <h4 className="font-bold text-gray-900">Request Return</h4>
                  </div>
                  <p className="text-gray-700 mb-2">Submit within 30 days</p>
                  <p className="text-sm text-gray-600">Use our online form or contact customer service</p>
                  <div className="hidden md:block absolute top-4 left-full w-full h-0.5 bg-gradient-to-r from-green-500/30 to-transparent"></div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <h4 className="font-bold text-gray-900">Ship Back</h4>
                  </div>
                  <p className="text-gray-700 mb-2">Within 5 days of approval</p>
                  <p className="text-sm text-gray-600">We provide prepaid return label</p>
                  <div className="hidden md:block absolute top-4 left-full w-full h-0.5 bg-gradient-to-r from-green-500/30 to-transparent"></div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <h4 className="font-bold text-gray-900">Refund Processed</h4>
                  </div>
                  <p className="text-gray-700 mb-2">Within 3-5 business days</p>
                  <p className="text-sm text-gray-600">After we receive and inspect items</p>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Information</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Refund Methods</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Original payment method (preferred)</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Store credit (if unavailable)</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>PayPal refund (for PayPal payments)</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Bank transfer (international)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Refund Timeline</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <Clock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Credit cards: 3-5 business days</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Clock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>PayPal: 1-2 business days</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Clock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Bank transfers: 5-7 business days</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Clock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Store credit: Immediate</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Original shipping costs are non-refundable unless the return is due to our error 
                  (wrong item shipped, damaged item, etc.). Return shipping is free with our prepaid label.
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white shadow-xl shadow-green-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold mb-2">Questions about returns?</h3>
                <p className="text-green-50 mb-4">
                  Our customer service team is here to help make your return process smooth and easy.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:returns@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Email Us
                  </a>
                  <a href="tel:1-800-BOOKS-24" className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/30">
                    1-800-BOOKS-24
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
