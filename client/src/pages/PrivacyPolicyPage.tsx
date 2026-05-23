import SEO from "@/components/SEO";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy | A2Z BOOKSHOP"
        description="Learn how A2Z BOOKSHOP collects, uses, and protects your personal data. Your privacy matters to us."
        keywords="privacy policy, data protection, personal information, cookies, A2Z BOOKSHOP privacy"
        url="https://a2zbookshop.com/privacy-policy"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Your privacy matters to us. This policy explains what data we collect, why we collect it, and how we keep it safe.
            </p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2025</p>
          </div>

          {/* Summary Banner */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">The Short Version</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              We only collect what's needed to fulfill your orders and improve your experience. We never sell your data.
              We use industry-standard security to protect your information. You can request deletion of your data at any time.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* What We Collect */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">What We Collect</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">When You Place an Order</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Name and email address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Shipping address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Phone number (for delivery updates)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Payment details (processed securely by Stripe/PayPal — we don't store card numbers)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">When You Browse</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Pages you visit and products you view</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Device type, browser, and general location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-aqua font-bold mt-0.5">•</span>
                      <span>Cookies and analytics data (see Cookies section below)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use It */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">How We Use Your Data</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Process your orders</strong> — shipping, payment confirmation, delivery updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Improve our website</strong> — understand what works and what doesn't</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Send order updates</strong> — confirmation emails, shipping notifications, delivery alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Marketing emails</strong> — only if you opt in. You can unsubscribe at any time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Prevent fraud</strong> — protect you and us from unauthorized transactions</span>
                </li>
              </ul>
            </div>

            {/* Who We Share With */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Who We Share Data With</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                We only share your data with trusted third parties who help us run our business:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Payment Processors</h4>
                  <p className="text-xs text-gray-600">Stripe, PayPal — to process your payments securely</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Shipping Partners</h4>
                  <p className="text-xs text-gray-600">Courier services — your address and phone for delivery</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Email Service</h4>
                  <p className="text-xs text-gray-600">For sending order confirmations and shipping updates</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Analytics</h4>
                  <p className="text-xs text-gray-600">Anonymized usage data to improve our website</p>
                </div>
              </div>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm font-medium">We never sell your personal data to advertisers or third parties.</p>
              </div>
            </div>

            {/* Cookies */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Cookies</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                We use cookies to make the website work and to understand how you use it:
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Essential cookies</strong> — keep you logged in, remember your cart, process payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Analytics cookies</strong> — help us understand which pages are popular and spot issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span><strong>Preference cookies</strong> — remember your currency, country, and display preferences</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                You can disable cookies in your browser settings. Note that some features may not work properly without essential cookies.
              </p>
            </div>

            {/* Your Rights */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-4">You have the right to:</p>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Access your personal data — ask us what we have on file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Correct inaccurate data — update your info anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Delete your data — request account and data deletion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Unsubscribe from marketing — one-click unsubscribe in every email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Data portability — request a copy of your data in a standard format</span>
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">How We Protect Your Data</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>SSL/TLS encryption on all pages (HTTPS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Payment data handled exclusively by PCI-compliant processors (Stripe, PayPal)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Regular security audits and monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Access to personal data restricted to authorized personnel only</span>
                </li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We keep your order data for as long as needed to fulfill our legal and accounting obligations (typically 7 years for financial records).
                Account data is kept until you request deletion. Browsing/analytics data is anonymized after 26 months.
              </p>
            </div>

            {/* Children */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Our website is not intended for children under 13. We do not knowingly collect personal data from children.
                If you believe a child has provided us with personal data, please contact us and we'll promptly delete it.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mt-10 sm:mt-14">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Privacy Questions?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              If you have any questions about your data or want to exercise your rights, just reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:support@a2zbookshop.com" className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-aqua text-gray-900 rounded-lg font-semibold text-sm hover:bg-cyan-400 transition-colors">
                support@a2zbookshop.com
              </a>
              <a href="tel:+14145956843" className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-semibold text-sm hover:border-gray-400 hover:text-gray-100 transition-colors">
                +1 (414) 595-6843
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
