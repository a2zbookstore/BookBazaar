import SEO from "@/components/SEO";
import { Shield, Lock, Eye, Database, Users, Mail, Check } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Read A2Z BOOKSHOP's privacy policy. Learn how we protect your personal information, handle data, and maintain your privacy."
        keywords="privacy policy, data protection, personal information, privacy statement"
        url="https://a2zbookshop.com/privacy-policy"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="container-custom py-12">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 mb-6 shadow-lg shadow-blue-500/30">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your privacy matters to us. Learn how we protect and use your information.
              </p>
              <p className="text-sm text-gray-500 mt-2">Last updated: June 16, 2025</p>
            </div>

            {/* Privacy Commitment Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white mb-12 shadow-xl shadow-blue-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative flex items-start gap-4">
                <Shield className="h-10 w-10 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Privacy Commitment</h2>
                  <p className="text-blue-50 text-lg">
                    A2Z BOOKSHOP is committed to protecting your privacy and securing your personal information. 
                    We only collect information necessary to provide you with excellent service and <strong>never sell your data to third parties</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Points Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Secure Data</h3>
                <p className="text-sm text-gray-600">SSL encryption and secure storage for all your information</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Transparency</h3>
                <p className="text-sm text-gray-600">Clear about what we collect and how we use it</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Your Control</h3>
                <p className="text-sm text-gray-600">Manage your data and communication preferences anytime</p>
              </div>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-6">
              {/* Information Collection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Personal Information</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Name, email address, and contact information</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Shipping and billing addresses</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Payment information (securely processed)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Order history and preferences</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Automatically Collected</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>IP address and browser information</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Browsing behavior and preferences</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Cookies for site functionality</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How We Use Information */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Order Processing</h4>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Process and fulfill your orders</li>
                      <li>• Send order confirmations and updates</li>
                      <li>• Handle returns and customer service</li>
                      <li>• Prevent fraud and security issues</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Communication</h4>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Send promotional emails (opt-in)</li>
                      <li>• Provide order updates</li>
                      <li>• Respond to inquiries</li>
                      <li>• Share new arrivals and deals</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Improvement</h4>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Analyze website usage</li>
                      <li>• Personalize recommendations</li>
                      <li>• Improve user experience</li>
                      <li>• Optimize site performance</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Legal</h4>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Comply with legal obligations</li>
                      <li>• Enforce terms and conditions</li>
                      <li>• Protect rights and safety</li>
                      <li>• Resolve disputes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Sharing */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                  <p className="text-green-900 font-semibold">
                    ✓ We DO NOT sell your personal information to third parties
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Limited Sharing for Business Operations</h4>
                    <p className="text-gray-700 mb-2">We may share information only with:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Shipping partners (for delivery only)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Payment processors (secure transactions)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Email service providers (communications)</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Analytics services (anonymized data)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Security */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Security & Protection</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Security Measures</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Lock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>SSL/TLS encryption</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Lock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Secure data storage</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Lock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Regular security audits</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Lock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>PCI DSS compliance</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Your Rights</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Access your data</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Request corrections</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Delete your account</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Opt-out of marketing</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cookies */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies & Tracking</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies to enhance your browsing experience, remember preferences, and analyze site traffic. 
                  You can control cookies through your browser settings.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2">Essential</h4>
                    <p className="text-sm text-gray-600">Required for site functionality</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2">Functional</h4>
                    <p className="text-sm text-gray-600">Remember your preferences</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2">Analytics</h4>
                    <p className="text-sm text-gray-600">Help us improve the site</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-8 text-white shadow-xl shadow-blue-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-8 w-8" />
                  <h2 className="text-2xl font-bold">Privacy Questions?</h2>
                </div>
                <p className="text-blue-100 mb-4">
                  If you have any questions or concerns about our privacy practices, please don't hesitate to contact us.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="mailto:privacy@a2zbookshop.com" className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Email Privacy Team
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
