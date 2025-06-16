import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Users, Database, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            Your privacy matters to us. Learn how we protect and use your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">Last updated: June 16, 2025</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Privacy Commitment</h2>
          <p className="text-blue-700">
            A2Z BOOKSHOP is committed to protecting your privacy and securing your personal information. 
            We only collect information necessary to provide you with excellent service and never sell your data to third parties.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary-aqua" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Personal Information</h4>
                <p className="text-gray-600 mb-2">We collect information you provide directly to us:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Name, email address, phone number</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                  <li>Order history and preferences</li>
                  <li>Account credentials and profile information</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Automatically Collected Information</h4>
                <p className="text-gray-600 mb-2">We automatically collect certain information when you use our website:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>IP address and location information</li>
                  <li>Browser type and operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referring website information</li>
                  <li>Device information and screen resolution</li>
                  <li>Search queries and browsing behavior</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Cookies and Tracking</h4>
                <p className="text-gray-600 mb-2">We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Remember your preferences and login status</li>
                  <li>Maintain your shopping cart contents</li>
                  <li>Analyze website usage and performance</li>
                  <li>Provide personalized recommendations</li>
                  <li>Prevent fraud and enhance security</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary-aqua" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Order Processing & Customer Service</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Process and fulfill your book orders</li>
                  <li>Send order confirmations and shipping updates</li>
                  <li>Handle returns, exchanges, and customer inquiries</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Verify your identity for account security</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Communication & Marketing</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Send newsletters and promotional offers (with your consent)</li>
                  <li>Notify you about new book arrivals in your areas of interest</li>
                  <li>Provide personalized book recommendations</li>
                  <li>Send important updates about our services</li>
                  <li>Conduct customer satisfaction surveys</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Website Improvement & Analytics</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Analyze website usage to improve user experience</li>
                  <li>Optimize our website performance and functionality</li>
                  <li>Develop new features and services</li>
                  <li>Prevent fraud and enhance security measures</li>
                  <li>Comply with legal obligations and resolve disputes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-aqua" />
                Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">We Do NOT Sell Your Information</h4>
                <p className="text-gray-600">
                  A2Z BOOKSHOP never sells, rents, or trades your personal information to third parties for their marketing purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Limited Sharing for Business Operations</h4>
                <p className="text-gray-600 mb-2">We may share your information only in these specific circumstances:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Payment Processing:</strong> With secure payment processors (PayPal, Razorpay, Stripe) to complete transactions</li>
                  <li><strong>Shipping:</strong> With shipping carriers to deliver your orders</li>
                  <li><strong>Email Services:</strong> With email service providers to send order confirmations and newsletters</li>
                  <li><strong>Website Analytics:</strong> With analytics services to understand website usage (anonymized data only)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of our business</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Third-Party Service Providers</h4>
                <p className="text-gray-600 mb-2">Our trusted partners are contractually obligated to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Keep your information confidential and secure</li>
                  <li>Use your information only for the specified services</li>
                  <li>Delete your information when no longer needed</li>
                  <li>Comply with applicable privacy laws and regulations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary-aqua" />
                Data Security & Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Security Measures</h4>
                <p className="text-gray-600 mb-2">We implement industry-standard security measures:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>SSL encryption for all data transmission</li>
                  <li>Secure servers with regular security updates</li>
                  <li>PCI DSS compliance for payment processing</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and employee training on data protection</li>
                  <li>Secure backup and disaster recovery procedures</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Payment Security</h4>
                <p className="text-gray-600 mb-2">Your payment information is protected through:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>We do not store complete credit card numbers</li>
                  <li>Payment processing handled by certified third-party providers</li>
                  <li>Tokenization of sensitive payment data</li>
                  <li>Fraud detection and prevention systems</li>
                  <li>Compliance with international payment security standards</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Data Retention</h4>
                <p className="text-gray-600 mb-2">We retain your information only as long as necessary:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Account information: Until you delete your account</li>
                  <li>Order history: 7 years for tax and legal compliance</li>
                  <li>Marketing preferences: Until you unsubscribe</li>
                  <li>Website analytics: Anonymized data for 25 months</li>
                  <li>Customer service records: 3 years for quality improvement</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-aqua" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Access & Control</h4>
                <p className="text-gray-600 mb-2">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Access your personal information we have on file</li>
                  <li>Update or correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Download your data in a portable format</li>
                  <li>Opt out of marketing communications</li>
                  <li>Restrict how we use your information</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Communication Preferences</h4>
                <p className="text-gray-600 mb-2">You can control marketing communications by:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Unsubscribing from email newsletters using the link in any email</li>
                  <li>Updating your preferences in your account settings</li>
                  <li>Contacting customer service to update preferences</li>
                  <li>Opting out of SMS notifications (where applicable)</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">
                  Note: You cannot opt out of essential service communications (order confirmations, shipping updates, etc.)
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Cookie Management</h4>
                <p className="text-gray-600 mb-2">You can manage cookies through:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Browser settings to block or delete cookies</li>
                  <li>Our cookie preference center (where available)</li>
                  <li>Opting out of analytics tracking</li>
                  <li>Using browser privacy modes</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">
                  Note: Disabling cookies may affect website functionality and your user experience.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary-aqua" />
                Contact & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Privacy Questions & Requests</h4>
                <p className="text-gray-600 mb-2">For privacy-related inquiries, contact us:</p>
                <ul className="text-gray-600 space-y-1">
                  <li><strong>Email:</strong> <a href="mailto:privacy@a2zbookshop.com" className="text-primary-aqua hover:underline">privacy@a2zbookshop.com</a></li>
                  <li><strong>Phone:</strong> 1-800-BOOKS-24 (1-800-266-5724)</li>
                  <li><strong>Mail:</strong> A2Z BOOKSHOP Privacy Department, [Address]</li>
                  <li><strong>Response Time:</strong> Within 30 days of receipt</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Legal Compliance</h4>
                <p className="text-gray-600 mb-2">We comply with applicable privacy laws including:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>California Consumer Privacy Act (CCPA)</li>
                  <li>General Data Protection Regulation (GDPR) for EU customers</li>
                  <li>Children's Online Privacy Protection Act (COPPA)</li>
                  <li>CAN-SPAM Act for email communications</li>
                  <li>State and federal privacy regulations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">International Customers</h4>
                <p className="text-gray-600 mb-2">For customers outside the United States:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Data may be transferred to and processed in the United States</li>
                  <li>We provide appropriate safeguards for international transfers</li>
                  <li>EU customers have additional rights under GDPR</li>
                  <li>Local privacy laws may provide additional protections</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy periodically to reflect changes in our practices, 
                technology, legal requirements, or business operations. 
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <strong>Notification of Changes:</strong> We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Posting the updated policy on our website with a new "Last Updated" date</li>
                  <li>Sending email notifications for significant changes</li>
                  <li>Displaying prominent notices on our website</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  <strong>Continued Use:</strong> Your continued use of our website after changes take effect 
                  constitutes acceptance of the updated policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Our Privacy Promise</h3>
          <p className="text-green-800">
            At A2Z BOOKSHOP, we believe that your personal information belongs to you. We are committed to 
            transparency, security, and giving you control over your data. If you have any questions or 
            concerns about our privacy practices, please don't hesitate to contact us.
          </p>
        </div>
      </div>
    </div>
  );
}