import SEO from "@/components/SEO";

export default function CancellationPolicyPage() {
  return (
    <>
      <SEO
        title="Cancellation Policy | A2Z BOOKSHOP"
        description="Learn about A2Z BOOKSHOP's order cancellation policy. Cancel before shipping for a full refund."
        keywords="cancel order, order cancellation, refund, A2Z BOOKSHOP cancellation"
        url="https://a2zbookshop.com/cancellation-policy"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Cancellation Policy
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Changed your mind? No problem — you can cancel your order as long as it hasn't shipped yet.
            </p>
          </div>

          {/* Quick Answer */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">The Simple Rule</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              If your order hasn't shipped yet, you can cancel it for a <strong className="text-gray-100">full refund</strong>. Once it's shipped,
              you'll need to use our return policy instead.
            </p>
          </div>

          {/* Before vs After Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-14">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Before Shipping</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Cancel anytime before we ship</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Full refund — no questions asked</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>Refund processed to original payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>No cancellation fee</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">After Shipping</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Cannot cancel once dispatched</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">→</span>
                  <span>You can refuse delivery (if applicable)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">→</span>
                  <span>Use our 7-day return policy after delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-aqua font-bold mt-0.5">→</span>
                  <span>Return shipping may be your responsibility</span>
                </li>
              </ul>
            </div>
          </div>

          {/* How to Cancel */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">How to Cancel Your Order</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h4 className="font-bold text-gray-900 mb-2">Email or Call Us</h4>
                <p className="text-sm text-gray-600">Contact us with your order number. Mention you'd like to cancel.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h4 className="font-bold text-gray-900 mb-2">We Confirm</h4>
                <p className="text-sm text-gray-600">If the order hasn't shipped, we'll cancel it immediately and confirm via email.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h4 className="font-bold text-gray-900 mb-2">Get Your Money Back</h4>
                <p className="text-sm text-gray-600">Refund hits your account within 3–7 business days depending on payment method.</p>
              </div>
            </div>
          </div>

          {/* Refund Timeline */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Refund Timeline</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="text-left p-4 font-bold text-gray-900">Payment Method</th>
                    <th className="text-left p-4 font-bold text-gray-900">Refund Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-4 text-gray-700">UPI / Wallets</td>
                    <td className="p-4 text-gray-700">1–3 business days</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-700">Credit/Debit Cards</td>
                    <td className="p-4 text-gray-700">5–7 business days</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-700">PayPal</td>
                    <td className="p-4 text-gray-700">2–3 business days</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-700">International Bank Transfer</td>
                    <td className="p-4 text-gray-700">7–10 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Good to Know</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Partial Cancellations</h4>
                <p className="text-gray-600 text-sm">If you ordered multiple books and only want to cancel some, just let us know which ones. We'll cancel those and keep the rest.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Coupon & Discount Codes</h4>
                <p className="text-gray-600 text-sm">If you used a promo code on a cancelled order, the code may be voided. Contact us and we'll try to reissue it for your next order.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Pre-orders</h4>
                <p className="text-gray-600 text-sm">Pre-orders can be cancelled anytime before the release date at no charge.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Want to Cancel an Order?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              The sooner you let us know, the better. Reach out and we'll help you right away.
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
