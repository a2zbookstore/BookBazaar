import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms and Conditions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            A<span className="text-red-600">2</span>Z BOOKSHOP - Online Bookstore
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last updated: June 18, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                By accessing and using the A2Z BOOKSHOP website (a2zbookshop.com), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These Terms and Conditions constitute a legally binding agreement between you and A2Z BOOKSHOP regarding your use of our online bookstore services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                2. Book Sales and Ordering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">2.1 Product Information</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All books are described accurately with condition details (New, Like New, Very Good, Good, Fair)</li>
                  <li>Book conditions are assessed according to industry standards</li>
                  <li>ISBN numbers, publication details, and author information are verified for accuracy</li>
                  <li>Cover images may vary from actual book covers due to different editions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">2.2 Pricing and Availability</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All prices are displayed in USD and automatically converted to your local currency</li>
                  <li>Prices include the cost of the book but exclude shipping charges</li>
                  <li>We reserve the right to modify prices without prior notice</li>
                  <li>Books are subject to availability; out-of-stock items will be promptly removed</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">2.3 Order Process</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Orders can be placed by registered users or as a guest</li>
                  <li>Order confirmation will be sent via email upon successful payment</li>
                  <li>We reserve the right to refuse or cancel orders at our discretion</li>
                  <li>Multiple quantity orders may be subject to availability verification</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                3. Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">3.1 Accepted Payment Methods</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>PayPal for international transactions</li>
                  <li>Razorpay for Indian customers (INR payments)</li>
                  <li>All major credit and debit cards through secure payment gateways</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">3.2 Payment Security</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All payments are processed through secure, encrypted connections</li>
                  <li>We do not store your payment information on our servers</li>
                  <li>Payment processing is handled by certified third-party providers</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">3.3 Currency and Conversion</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Prices are displayed in your local currency based on your location</li>
                  <li>Currency conversion rates are updated regularly but may vary at payment</li>
                  <li>Final charges will appear on your statement in the payment method's currency</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                4. Shipping and Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">4.1 Shipping Rates</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Shipping rates are calculated based on destination country and order weight</li>
                  <li>Rates are displayed during checkout before payment confirmation</li>
                  <li>Free shipping may be available for orders above certain thresholds</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">4.2 Delivery Times</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Estimated delivery times are provided based on shipping method and destination</li>
                  <li>Processing time is 1-2 business days before shipment</li>
                  <li>International deliveries may be subject to customs delays</li>
                  <li>Delivery times are estimates and not guaranteed</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">4.3 Shipping Responsibility</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Risk of loss passes to the buyer upon delivery to the shipping carrier</li>
                  <li>Tracking information will be provided when available</li>
                  <li>Damaged or lost packages must be reported within 7 days of delivery date</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                5. Returns and Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">5.1 Return Policy</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Books may be returned within 30 days of delivery date</li>
                  <li>Books must be in the same condition as received</li>
                  <li>Original packaging and any included materials must be returned</li>
                  <li>Return shipping costs are the responsibility of the customer unless item was damaged</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">5.2 Return Process</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Submit a return request through your account or our return form</li>
                  <li>Provide order number, book details, and reason for return</li>
                  <li>Return authorization will be provided within 2 business days</li>
                  <li>Ship items back using provided return instructions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">5.3 Refund Processing</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Refunds are processed within 5-7 business days after receiving returned items</li>
                  <li>Refunds will be issued to the original payment method</li>
                  <li>Shipping charges are non-refundable unless item was damaged or incorrect</li>
                  <li>Processing fees may apply for certain payment methods</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                6. User Accounts and Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">6.1 Account Registration</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account registration is optional but recommended for order tracking</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>All activities under your account are your responsibility</li>
                  <li>Notify us immediately of any unauthorized account use</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">6.2 Privacy and Data Protection</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Personal information is collected and used according to our Privacy Policy</li>
                  <li>We implement appropriate security measures to protect your data</li>
                  <li>Email communications will include order updates and promotional materials</li>
                  <li>You may opt out of promotional emails at any time</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                7. Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">7.1 Website Content</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All website content, including text, images, and design, is owned by A2Z BOOKSHOP</li>
                  <li>Book covers and descriptions are used under fair use for commercial purposes</li>
                  <li>Unauthorized reproduction or distribution of website content is prohibited</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">7.2 Trademark Protection</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>A2Z BOOKSHOP name and logo are protected trademarks</li>
                  <li>Third-party trademarks are acknowledged and respected</li>
                  <li>Any trademark infringement should be reported immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                8. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">8.1 Service Availability</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We strive for continuous service but cannot guarantee uninterrupted availability</li>
                  <li>Maintenance and updates may temporarily affect service accessibility</li>
                  <li>Force majeure events may impact our ability to fulfill orders</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">8.2 Liability Limits</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Our liability is limited to the value of the specific book order</li>
                  <li>We are not liable for indirect, incidental, or consequential damages</li>
                  <li>Third-party payment processor issues are handled according to their terms</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                9. Dispute Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">9.1 Customer Service</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Contact us first for any issues: support@a2zbookshop.com</li>
                  <li>Alternative contact: a2zbookshopglobal@gmail.com</li>
                  <li>We aim to resolve disputes amicably and promptly</li>
                  <li>Response time for customer inquiries is 24-48 hours</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">9.2 Legal Jurisdiction</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>These terms are governed by applicable international commerce laws</li>
                  <li>Disputes will be resolved through binding arbitration when possible</li>
                  <li>Local consumer protection laws take precedence where applicable</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                10. Updates and Modifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-lg mb-2">10.1 Terms Updates</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>These terms may be updated periodically to reflect service changes</li>
                  <li>Updates will be posted on this page with revision dates</li>
                  <li>Continued use of the service constitutes acceptance of updated terms</li>
                  <li>Major changes will be communicated via email to registered users</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">10.2 Service Modifications</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We reserve the right to modify or discontinue services with notice</li>
                  <li>New features and improvements are added regularly</li>
                  <li>User feedback is welcomed and considered for service enhancements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-blue-800 dark:text-blue-200">
              <p className="font-semibold">A2Z BOOKSHOP - Online Bookstore</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Support:</h4>
                  <p>Email: support@a2zbookshop.com</p>
                  <p>Alternative: a2zbookshopglobal@gmail.com</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Website:</h4>
                  <p>https://a2zbookshop.com</p>
                  <p>https://www.a2zbookshop.com</p>
                </div>
              </div>

              <Separator className="bg-blue-200 dark:bg-blue-700" />
              
              <p className="text-sm text-blue-700 dark:text-blue-300">
                For immediate assistance with orders, returns, or general inquiries, please email us. 
                We're committed to providing excellent customer service and will respond to your 
                inquiry within 24-48 hours.
              </p>
              
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Thank you for choosing A2Z BOOKSHOP for your book purchasing needs!
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 A<span className="text-red-600">2</span>Z BOOKSHOP. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Last updated: June 18, 2025 | Version 1.0
          </p>
        </div>
      </div>
    </div>
  );
}