import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Globe, Clock, Package, Check } from "lucide-react";

export default function ShippingInfoPage() {
  return (
    <>
      <SEO
        title="Shipping Information"
        description="Learn about A2Z BOOKSHOP's shipping options, delivery times, and shipping costs. We offer fast, reliable shipping worldwide."
        keywords="shipping information, book delivery, shipping rates, international shipping, package tracking"
        url="https://a2zbookshop.com/shipping"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-aqua to-cyan-500 mb-6 shadow-lg shadow-cyan-500/30">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Shipping Information
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Fast, reliable shipping for book lovers worldwide
              </p>
            </div>

            {/* Shipping Methods Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-aqua/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Standard</h3>
                  <p className="text-2xl font-bold text-primary-aqua mb-2">5-7 days</p>
                  <p className="text-sm text-gray-600">Most economical option for regular orders</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Express</h3>
                  <p className="text-2xl font-bold text-cyan-600 mb-2">2-3 days</p>
                  <p className="text-sm text-gray-600">Faster delivery for urgent orders</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">International</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">7-14 days</p>
                  <p className="text-sm text-gray-600">Worldwide shipping available</p>
                </div>
              </div>
            </div>

            {/* Processing Times */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Processing Times</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2">In-Stock Books</h4>
                  <p className="text-primary-aqua font-semibold mb-1">Same day processing</p>
                  <p className="text-sm text-gray-600">Orders before 2 PM EST ship same day</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2">Rare & Special</h4>
                  <p className="text-primary-aqua font-semibold mb-1">2-5 business days</p>
                  <p className="text-sm text-gray-600">Extra time for quality inspection</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2">Pre-Orders</h4>
                  <p className="text-primary-aqua font-semibold mb-1">Ships on release</p>
                  <p className="text-sm text-gray-600">Automatic shipping when available</p>
                </div>
              </div>
            </div>

            {/* Shipping Rates Table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12 overflow-hidden hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Rates</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Destination</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Standard</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Express</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-900">Free Shipping</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-colors">
                      <td className="py-4 px-4 font-medium">United States</td>
                      <td className="py-4 px-4">$4.99</td>
                      <td className="py-4 px-4">$9.99</td>
                      <td className="py-4 px-4 text-primary-aqua font-semibold">Orders $35+</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-colors">
                      <td className="py-4 px-4 font-medium">Canada</td>
                      <td className="py-4 px-4">$8.99</td>
                      <td className="py-4 px-4">$15.99</td>
                      <td className="py-4 px-4 text-primary-aqua font-semibold">Orders $75+</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-colors">
                      <td className="py-4 px-4 font-medium">United Kingdom</td>
                      <td className="py-4 px-4">$12.99</td>
                      <td className="py-4 px-4">$24.99</td>
                      <td className="py-4 px-4 text-primary-aqua font-semibold">Orders $100+</td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-colors">
                      <td className="py-4 px-4 font-medium">Europe</td>
                      <td className="py-4 px-4">$15.99</td>
                      <td className="py-4 px-4">$29.99</td>
                      <td className="py-4 px-4 text-primary-aqua font-semibold">Orders $125+</td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-transparent transition-colors">
                      <td className="py-4 px-4 font-medium">Rest of World</td>
                      <td className="py-4 px-4">$19.99</td>
                      <td className="py-4 px-4">$39.99</td>
                      <td className="py-4 px-4 text-primary-aqua font-semibold">Orders $150+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-6 px-4">
                * Rates may vary based on package weight and dimensions. International orders may be subject to customs duties and taxes.
              </p>
            </div>

            {/* Package Protection */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-8 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-aqua to-cyan-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Packaging & Protection</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Secure Packaging</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Bubble wrap protection for fragile books</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Sturdy cardboard mailers and boxes</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Moisture-resistant materials</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Extra padding for collectibles</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Tracking & Insurance</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Tracking number for all shipments</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Email notifications at milestones</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Insurance for orders over $50</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-primary-aqua flex-shrink-0 mt-0.5" />
                      <span>Signature for high-value items</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-aqua to-cyan-500 p-8 text-white shadow-xl shadow-cyan-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
                <p className="text-cyan-50 mb-4">
                  Questions about shipping? Our customer service team is here to help.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:orders@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-primary-aqua rounded-lg font-semibold hover:bg-gray-50 transition-colors">
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