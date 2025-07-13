import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Shield, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function ReturnPolicyPage() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Return Policy</h1>
          <p className="text-lg text-gray-600">
            We want you to be completely satisfied with your book purchases
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-2">30-Day Return Guarantee</h2>
          <p className="text-green-700">
            Return any book within 30 days of delivery for a full refund, no questions asked. 
            We stand behind the quality of our books and your satisfaction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary-aqua" />
                Return Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Eligible Items</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>Books in original condition</li>
                  <li>Unopened sealed items</li>
                  <li>Items with original packaging</li>
                  <li>Books without writing or highlighting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Non-Returnable Items</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>Digital downloads</li>
                  <li>Personalized or custom books</li>
                  <li>Books with significant damage</li>
                  <li>Gift cards</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-aqua" />
                Return Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Step 1: Request Return</h4>
                <p className="text-gray-600">Submit return request within 30 days</p>
                <p className="text-sm text-gray-500">Use our online return form or contact customer service</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Step 2: Ship Back</h4>
                <p className="text-gray-600">Ship items within 5 days of approval</p>
                <p className="text-sm text-gray-500">We'll provide prepaid return label</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Step 3: Refund Processing</h4>
                <p className="text-gray-600">Refund processed within 3-5 business days</p>
                <p className="text-sm text-gray-500">After we receive and inspect items</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-aqua" />
              How to Return Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Online Return Request</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside text-gray-700 space-y-2">
                    <li>Visit our <Link href="/returns" className="text-primary-aqua hover:underline">Return Request page</Link></li>
                    <li>Enter your order number and email address</li>
                    <li>Select the items you want to return</li>
                    <li>Choose your reason for return</li>
                    <li>Submit the request and await approval</li>
                  </ol>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Customer Service</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    Prefer to speak with someone? Our customer service team is here to help:
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    <li><strong>Email:</strong> <a href="mailto:returns@a2zbookshop.com" className="text-primary-aqua hover:underline">returns@a2zbookshop.com</a></li>
                    <li><strong>Phone:</strong> 1-800-BOOKS-24 (1-800-266-5724)</li>
                    <li><strong>Hours:</strong> Monday-Friday 9 AM - 6 PM EST</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Refund Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Refund Methods</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Original payment method (preferred)</li>
                  <li>• Store credit (if original method unavailable)</li>
                  <li>• PayPal refund (for PayPal payments)</li>
                  <li>• Bank transfer (for international customers)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Refund Timeline</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Credit cards: 3-5 business days</li>
                  <li>• PayPal: 1-2 business days</li>
                  <li>• Bank transfers: 5-7 business days</li>
                  <li>• Store credit: Immediate</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Original shipping costs are non-refundable unless the return is due to our error 
                (wrong item shipped, damaged item, etc.). Return shipping is free with our prepaid label.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary-aqua" />
              Special Circumstances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Damaged or Defective Items</h4>
                <p className="text-gray-600 mb-2">
                  If you receive a damaged or defective book:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Contact us immediately with photos of the damage</li>
                  <li>We'll arrange immediate replacement or full refund</li>
                  <li>Return shipping is completely free</li>
                  <li>Priority processing for damaged item claims</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Wrong Item Shipped</h4>
                <p className="text-gray-600 mb-2">
                  If we sent you the wrong book:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Keep the incorrect item until we send replacement</li>
                  <li>Free return shipping for the wrong item</li>
                  <li>Priority shipping for the correct item</li>
                  <li>Full refund of any shipping charges</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Rare & Collectible Books</h4>
                <p className="text-gray-600 mb-2">
                  Special handling for valuable items:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Extended 30-day return period for items over $200</li>
                  <li>Professional evaluation upon return</li>
                  <li>Insured return shipping provided</li>
                  <li>Detailed condition documentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Customer Satisfaction Guarantee</h3>
          <p className="text-blue-800 mb-4">
            At A2Z BOOKSHOP, your satisfaction is our top priority. If you're not completely happy with your purchase, 
            we'll work with you to make it right. Our goal is to ensure every customer has a positive experience with us.
          </p>
          <div className="text-blue-700">
            <p className="font-medium">Questions about returns?</p>
            <p>Email us at <a href="mailto:returns@a2zbookshop.com" className="text-primary-aqua hover:underline">returns@a2zbookshop.com</a> or call 1-800-BOOKS-24</p>
          </div>
        </div>
      </div>
    </div>
  );
}