import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Globe, Clock, Package } from "lucide-react";

export default function ShippingInfoPage() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-lg text-gray-600">
            Fast, reliable shipping for book lovers worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-aqua" />
                Shipping Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Standard Shipping</h4>
                <p className="text-gray-600">5-7 business days delivery</p>
                <p className="text-sm text-gray-500">Most economical option for regular orders</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Express Shipping</h4>
                <p className="text-gray-600">2-3 business days delivery</p>
                <p className="text-sm text-gray-500">Faster delivery for urgent orders</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">International</h4>
                <p className="text-gray-600">7-14 business days delivery</p>
                <p className="text-sm text-gray-500">Worldwide shipping available</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary-aqua" />
                Shipping Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Domestic (USA)</h4>
                <p className="text-gray-600">Free shipping on orders over $35</p>
                <p className="text-sm text-gray-500">All 50 states and territories</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">International</h4>
                <p className="text-gray-600">200+ countries worldwide</p>
                <p className="text-sm text-gray-500">Calculated at checkout based on destination</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Express Zones</h4>
                <p className="text-gray-600">Major cities worldwide</p>
                <p className="text-sm text-gray-500">Expedited delivery to metro areas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-aqua" />
              Processing Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">In-Stock Books</h4>
                <p className="text-gray-600">Same day processing</p>
                <p className="text-sm text-gray-500">Orders placed before 2 PM EST ship same day</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Rare & Special Orders</h4>
                <p className="text-gray-600">2-5 business days</p>
                <p className="text-sm text-gray-500">Additional time for quality inspection</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pre-Orders</h4>
                <p className="text-gray-600">Ships on release date</p>
                <p className="text-sm text-gray-500">Automatic shipping when available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-aqua" />
              Packaging & Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Secure Packaging</h4>
                <p className="text-gray-600 mb-2">
                  All books are carefully packaged to prevent damage during transit:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Bubble wrap protection for fragile or rare books</li>
                  <li>Sturdy cardboard mailers and boxes</li>
                  <li>Moisture-resistant packaging materials</li>
                  <li>Extra padding for valuable collectibles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Tracking & Insurance</h4>
                <p className="text-gray-600 mb-2">
                  Stay informed about your order:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Tracking number provided for all shipments</li>
                  <li>Email notifications at key delivery milestones</li>
                  <li>Insurance coverage for orders over $50</li>
                  <li>Signature required for high-value items</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Destination</th>
                    <th className="text-left py-2 px-4">Standard</th>
                    <th className="text-left py-2 px-4">Express</th>
                    <th className="text-left py-2 px-4">Free Shipping</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2 px-4">United States</td>
                    <td className="py-2 px-4">$4.99</td>
                    <td className="py-2 px-4">$9.99</td>
                    <td className="py-2 px-4">Orders $35+</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Canada</td>
                    <td className="py-2 px-4">$8.99</td>
                    <td className="py-2 px-4">$15.99</td>
                    <td className="py-2 px-4">Orders $75+</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">United Kingdom</td>
                    <td className="py-2 px-4">$12.99</td>
                    <td className="py-2 px-4">$24.99</td>
                    <td className="py-2 px-4">Orders $100+</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Europe</td>
                    <td className="py-2 px-4">$15.99</td>
                    <td className="py-2 px-4">$29.99</td>
                    <td className="py-2 px-4">Orders $125+</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Rest of World</td>
                    <td className="py-2 px-4">$19.99</td>
                    <td className="py-2 px-4">$39.99</td>
                    <td className="py-2 px-4">Orders $150+</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * Rates may vary based on package weight and dimensions. 
              International orders may be subject to customs duties and taxes.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600">
            Questions about shipping? Contact our customer service team at{" "}
            <a href="mailto:orders@a2zbookshop.com" className="text-primary-aqua hover:underline">
              orders@a2zbookshop.com
            </a>{" "}
            or call us at 1-800-BOOKS-24.
          </p>
        </div>
      </div>
    </div>
  );
}