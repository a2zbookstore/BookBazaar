import SEO from "@/components/SEO";

export default function ReturnPolicyPage() {
  return (
    <>
      <SEO
        title="Return Policy | A2Z BOOKSHOP"
        description="A2Z BOOKSHOP offers a hassle-free 7-day return policy. If you're not satisfied with your book, we'll make it right."
        keywords="return policy, book returns, refund, exchange, A2Z BOOKSHOP returns"
        url="https://a2zbookshop.com/return-policy"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Return Policy
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Your satisfaction matters to us. If something isn't right, we'll sort it out.
            </p>
          </div>

          {/* 7-Day Guarantee */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">7-Day Return Window</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Not happy with your order? You can return any book within 7 days of delivery. We want you to love what you receive —
              and if you don't, we'll make it right with a full refund or exchange.
            </p>
          </div>

          {/* Return Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-14">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">We'll Accept Returns If</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>The book is in the same condition you received it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>It's within 7 days of delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>You received a wrong or damaged item</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>The book doesn't match the description on the website</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">We Can't Accept Returns If</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>The book has been written in, highlighted, or damaged after delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>It's been more than 7 days since delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>The book was purchased on a clearance/final sale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Gift cards or digital vouchers</span>
                </li>
              </ul>
            </div>
          </div>

          {/* How to Return */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">How to Return a Book</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h4 className="font-bold text-gray-900 mb-2">Contact Us</h4>
                <p className="text-sm text-gray-600">Let us know your order number and reason for return. We'll guide you through it.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h4 className="font-bold text-gray-900 mb-2">Ship It Back</h4>
                <p className="text-sm text-gray-600">Pack the book securely and ship it to the address we provide. Keep the tracking number handy.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h4 className="font-bold text-gray-900 mb-2">Get Your Refund</h4>
                <p className="text-sm text-gray-600">Once we receive and inspect the book, your refund is processed to the original payment method.</p>
              </div>
            </div>
          </div>

          {/* Refund Details */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Refund Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-3">Refund Methods</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Original payment method (credit card, UPI, PayPal, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Store credit (if you prefer to use it for your next purchase)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-3">Refund Timeline</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>UPI / Wallets: 1–3 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Credit/Debit cards: 5–7 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>PayPal: 2–3 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>International bank transfers: 7–10 business days</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Please note:</strong> Original shipping costs are non-refundable unless the return is due to our mistake
                (wrong item shipped, damaged book, etc.). In those cases, we'll cover the return shipping too.
              </p>
            </div>
          </div>

          {/* Damaged Items */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Received a Damaged Book?</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                We pack every book with care, but occasionally things happen in transit. If your book arrives damaged:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Take clear photos of the damage (including the packaging)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>Email us at support@a2zbookshop.com with your order number and photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">•</span>
                  <span>We'll arrange a replacement or full refund — whichever you prefer</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                Please report damage within 48 hours of delivery so we can resolve it quickly.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Need to Start a Return?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Just reach out — we'll walk you through it and make the process as smooth as possible.
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
