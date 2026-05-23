import SEO from "@/components/SEO";

export default function TermsAndConditionsPage() {
  return (
    <>
      <SEO
        title="Terms & Conditions | A2Z BOOKSHOP"
        description="Read our Terms and Conditions for using A2Z BOOKSHOP, including ordering, payments, shipping, returns, and intellectual property."
        keywords="terms and conditions, terms of service, user agreement, A2Z BOOKSHOP terms"
        url="https://a2zbookshop.com/terms-and-conditions"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Terms & Conditions
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              These terms govern your use of A2Z BOOKSHOP and any orders you place with us. Please read them carefully.
            </p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 2025</p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* 1. General */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">1. About Us</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                A2Z BOOKSHOP (accessible at a2zbookshop.com) is an online bookstore that sells new and curated second-hand books.
                By placing an order on our website, you agree to be bound by these Terms & Conditions. If you disagree with any
                part, please refrain from using our services.
              </p>
            </div>

            {/* 2. Ordering */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">2. Ordering & Accounts</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>You must be at least 18 years old or have parental/guardian consent to place an order.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>All information provided during account creation or checkout must be accurate and complete.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>An order is confirmed only after you receive a confirmation email from us.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>We reserve the right to cancel any order if the item is out of stock or if we detect fraudulent activity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>You are responsible for maintaining the confidentiality of your account credentials.</span>
                </li>
              </ul>
            </div>

            {/* 3. Pricing */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">3. Pricing & Payments</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>All prices are listed in the currency you select and include applicable taxes unless stated otherwise.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>We accept payments via credit/debit cards, UPI, PayPal, Apple Pay, and other methods displayed at checkout.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Prices may change at any time, but changes will not affect orders that have already been confirmed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>In the event of a pricing error, we'll contact you before processing the order.</span>
                </li>
              </ul>
            </div>

            {/* 4. Shipping */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">4. Shipping & Delivery</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Delivery timelines are estimates and not guarantees. Delays may occur due to weather, customs, or carrier issues.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Risk of loss passes to you upon delivery. Please ensure someone is available to receive the package.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>International orders may be subject to customs duties or import taxes, which are the buyer's responsibility.</span>
                </li>
              </ul>
            </div>

            {/* 5. Returns & Refunds */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">5. Returns & Refunds</h2>
              <ul className="space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Returns are accepted within 7 days of delivery, subject to our Return Policy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Refunds are processed to the original payment method within 3–10 business days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Books must be returned in the condition they were received.</span>
                </li>
              </ul>
            </div>

            {/* 6. Intellectual Property */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                All content on a2zbookshop.com — including text, images, logos, and design — is the property of A2Z BOOKSHOP
                or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute,
                or create derivative works from our content without explicit written permission.
              </p>
            </div>

            {/* 7. User Conduct */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">7. User Conduct</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-3">You agree not to:</p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Use our website for any unlawful purpose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Submit false or misleading information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Interfere with the website's operation or other users' experience</span>
                </li>
              </ul>
            </div>

            {/* 8. Limitation of Liability */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                To the fullest extent permitted by law, A2Z BOOKSHOP shall not be liable for any indirect, incidental,
                special, or consequential damages arising from your use of our website or the purchase of products.
                Our total liability is limited to the amount you paid for the specific order in question.
              </p>
            </div>

            {/* 9. Governing Law */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising from these terms or your use of the website shall be subject to the exclusive
                jurisdiction of the courts in India.
              </p>
            </div>

            {/* 10. Changes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">10. Changes to These Terms</h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We may update these Terms & Conditions from time to time. Changes will be posted on this page with an
                updated "Last updated" date. Continued use of the website after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mt-10 sm:mt-14">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Questions About These Terms?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              If anything is unclear, feel free to reach out. We're happy to explain.
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
