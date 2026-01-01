import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle, CheckCircle, XCircle, Mail, Phone } from "lucide-react";

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
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bookerly font-bold text-secondary-black mb-4">
              Cancellation Policy
            </h1>
            <p className="text-gray-600 text-lg">
              Understanding your rights and options for order cancellations at A<span className="text-red-500">2</span>Z BOOKSHOP
            </p>
          </div>

          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Quick Cancellation:</strong> Orders can be cancelled free of charge within 2 hours of placing your order,
              before processing begins.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {/* Cancellation Windows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-aqua" />
                  Cancellation Time Windows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800">Free Cancellation</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">Within 2 hours of order</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• No cancellation fee</li>
                      <li>• Full refund processed</li>
                      <li>• Instant cancellation</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Partial Cancellation</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">2-24 hours after order</p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      <li>• 5% cancellation fee</li>
                      <li>• 95% refund processed</li>
                      <li>• Processing may have started</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-800">Limited Cancellation</span>
                    </div>
                    <p className="text-sm text-red-700 mb-2">After 24 hours</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      <li>• Case-by-case basis only</li>
                      <li>• May not be possible if shipped</li>
                      <li>• Return policy may apply instead</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Process */}
            <Card>
              <CardHeader>
                <CardTitle>How to Cancel Your Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Method 1: Online Cancellation (Recommended)</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                    <li>Visit your <strong>Order History</strong> page (login required)</li>
                    <li>Find the order you want to cancel</li>
                    <li>Click the <strong>"Cancel Order"</strong> button (available for eligible orders)</li>
                    <li>Select your cancellation reason</li>
                    <li>Confirm cancellation - you'll receive an email confirmation</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Method 2: Contact Customer Service</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary-aqua" />
                        <div>
                          <p className="font-medium">Email Support</p>
                          <p className="text-sm text-gray-600">orders@a2zbookshop.com</p>
                          <p className="text-xs text-gray-500">Response within 2-4 hours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary-aqua" />
                        <div>
                          <p className="font-medium">Phone Support</p>
                          <p className="text-sm text-gray-600">Available on request</p>
                          <p className="text-xs text-gray-500">Business hours only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Required Information:</strong> Please provide your order number, email address,
                    and reason for cancellation when contacting customer service.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Order Status and Cancellation */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status and Cancellation Eligibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="font-medium">Order Confirmed</span>
                      </div>
                      <span className="text-green-600 font-medium">✓ Cancellable</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="font-medium">Processing</span>
                      </div>
                      <span className="text-yellow-600 font-medium">△ Limited Cancellation</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span className="font-medium">Packed/Ready to Ship</span>
                      </div>
                      <span className="text-red-600 font-medium">✗ Cannot Cancel</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="font-medium">Shipped</span>
                      </div>
                      <span className="text-red-600 font-medium">✗ Returns Only</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-4">
                    Once your order is shipped, cancellation is no longer possible. Please refer to our
                    <a href="/return-policy" className="text-primary-aqua hover:underline ml-1">Return Policy</a>
                    for information about returning shipped items.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Refund Process */}
            <Card>
              <CardHeader>
                <CardTitle>Refund Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Refund Timeline</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li><strong>Credit/Debit Cards:</strong> 3-5 business days</li>
                      <li><strong>PayPal:</strong> 1-2 business days</li>
                      <li><strong>Razorpay:</strong> 2-7 business days</li>
                      <li><strong>Bank Transfers:</strong> 5-10 business days</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Refund Amounts</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li><strong>Within 2 hours:</strong> 100% refund</li>
                      <li><strong>2-24 hours:</strong> 95% refund (5% fee)</li>
                      <li><strong>After 24 hours:</strong> Case-by-case basis</li>
                      <li><strong>Shipping costs:</strong> Non-refundable after processing</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Note:</strong> Refunds are processed to the original payment method used for the purchase.
                    If the original payment method is no longer available, please contact customer service for alternative arrangements.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Special Circumstances */}
            <Card>
              <CardHeader>
                <CardTitle>Special Circumstances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Automatic Cancellation (Full Refund)</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Book is out of stock and cannot be fulfilled</li>
                      <li>Payment processing fails or is declined</li>
                      <li>Delivery address is unserviceable</li>
                      <li>Technical errors during order processing</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Partial Order Cancellation</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Individual items can be cancelled if order hasn't been processed</li>
                      <li>Remaining items will be shipped as planned</li>
                      <li>Shipping costs may be adjusted based on remaining order value</li>
                      <li>Free shipping threshold may no longer apply</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Non-Cancellable Items</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Custom or personalized book orders</li>
                      <li>Rare books specifically sourced for customer</li>
                      <li>Digital downloads (immediate delivery)</li>
                      <li>Gift cards and store credit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help with Cancellation?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-aqua/10 p-6 rounded-lg">
                  <p className="text-center text-gray-700 mb-4">
                    Our customer service team is here to help with any cancellation requests or questions.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <Mail className="h-6 w-6 text-primary-aqua mx-auto mb-2" />
                      <p className="font-semibold">Email Support</p>
                      <p className="text-sm text-gray-600">orders@a2zbookshop.com</p>
                      <p className="text-xs text-gray-500">24/7 support - Response within 2-4 hours</p>
                    </div>
                    <div className="text-center">
                      <Phone className="h-6 w-6 text-primary-aqua mx-auto mb-2" />
                      <p className="font-semibold">Live Chat</p>
                      <p className="text-sm text-gray-600">Available on website</p>
                      <p className="text-xs text-gray-500">Mon-Fri 9 AM - 6 PM EST</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Last updated: June 17, 2025 | This policy is effective immediately for all new orders.</p>
          </div>
        </div>
      </div>
    </>
  );
}