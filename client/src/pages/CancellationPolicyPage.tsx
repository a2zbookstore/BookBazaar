import SEO from "@/components/SEO";
import { Clock, CheckCircle, XCircle, AlertCircle, Mail, Phone } from "lucide-react";

export default function CancellationPolicyPage() {
  return (
    <>
      <SEO
        title="Cancellation Policy"
        description="Learn about A2Z BOOKSHOP's order cancellation policy. Understand timeframes, refunds, and how to cancel your book order."
        keywords="cancellation policy, cancel order, order cancellation, refund policy"
        url="https://a2zbookshop.com/cancellation-policy"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mb-6 shadow-lg shadow-orange-500/30">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Cancellation Policy
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Understanding your rights and options for order cancellations
              </p>
            </div>

            {/* Quick Cancellation Alert */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white mb-12 shadow-xl shadow-green-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative flex items-start gap-4">
                <CheckCircle className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Quick Cancellation</h2>
                  <p className="text-green-50 text-lg">
                    Orders can be cancelled free of charge within <strong>2 hours</strong> of placing your order, before processing begins.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Windows */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Cancellation Time Windows</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-bold text-green-900">Within 2 Hours</h3>
                  </div>
                  <p className="text-green-700 font-medium mb-3">Free Cancellation</p>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>100% refund guaranteed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>Instant processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>No cancellation fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>Simple online process</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-lg font-bold text-yellow-900">2-24 Hours</h3>
                  </div>
                  <p className="text-yellow-700 font-medium mb-3">Limited Options</p>
                  <ul className="space-y-2 text-sm text-yellow-700">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>Subject to availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>Possible processing fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>Contact customer service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>May be in processing</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-900">After 24 Hours</h3>
                  </div>
                  <p className="text-red-700 font-medium mb-3">Use Return Policy</p>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Order likely shipped</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Cannot cancel directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Use 30-day return policy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Receive and return item</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How to Cancel */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Cancel Your Order</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Method 1: Online Cancellation</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <ol className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                        <span className="text-gray-700">Visit your account order history page</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                        <span className="text-gray-700">Find the order you want to cancel</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                        <span className="text-gray-700">Click the "Cancel Order" button (if available)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                        <span className="text-gray-700">Select your cancellation reason</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 text-white flex items-center justify-center text-sm font-bold">5</span>
                        <span className="text-gray-700">Confirm - you'll receive an email confirmation</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Method 2: Contact Customer Service</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <a href="mailto:orders@a2zbookshop.com" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-aqua hover:shadow-lg transition-all">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Email</div>
                        <div className="text-sm text-gray-600">orders@a2zbookshop.com</div>
                      </div>
                    </a>
                    <a href="tel:1-800-BOOKS-24" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-aqua hover:shadow-lg transition-all">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Phone</div>
                        <div className="text-sm text-gray-600">1-800-BOOKS-24</div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Processing</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Refund Timeline</h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Within 2 hours: Instant refund</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Credit cards: 3-5 business days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>PayPal: 1-2 business days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Bank transfers: 5-7 business days</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Refund Amounts</h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Within 2 hours: 100% refund</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>2-24 hours: May have processing fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Shipped orders: Use return policy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold">•</span>
                      <span>Shipping costs may be deducted</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-8 text-white shadow-xl shadow-orange-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold mb-2">Need Help with Cancellation?</h3>
                <p className="text-orange-50 mb-4">
                  Our customer service team is here to help with any cancellation requests or questions.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:orders@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
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
    </>
  );
}
