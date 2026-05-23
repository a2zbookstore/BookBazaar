import SEO from "@/components/SEO";

export default function ShippingInfoPage() {
  return (
    <>
      <SEO
        title="Shipping Information | A2Z BOOKSHOP"
        description="We ship books worldwide from A2Z BOOKSHOP. Learn about our delivery timelines, packaging standards, and tracking options."
        keywords="book shipping, worldwide delivery, book packaging, order tracking, A2Z BOOKSHOP shipping"
        url="https://a2zbookshop.com/shipping-info"
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Header */}
          <div className="mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              Shipping Information
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
              Every book is packed with care and shipped to your doorstep — wherever you are in the world.
            </p>
          </div>

          {/* We Ship Worldwide */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8 mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-3">We Ship Worldwide</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Whether you're in the UK, USA, India, Australia, or anywhere else — we'll get your books to you.
              Shipping costs and delivery times are calculated at checkout based on your location.
            </p>
          </div>

          {/* Delivery Times */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Estimated Delivery Times</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Domestic (India)</h3>
                <p className="text-2xl font-bold text-primary-aqua mb-2">3–7 business days</p>
                <p className="text-sm text-gray-600">Fast delivery across all Indian states and territories</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">UK & USA</h3>
                <p className="text-2xl font-bold text-primary-aqua mb-2">5–10 business days</p>
                <p className="text-sm text-gray-600">Reliable tracked shipping to our top international destinations</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Rest of World</h3>
                <p className="text-2xl font-bold text-primary-aqua mb-2">7–14 business days</p>
                <p className="text-sm text-gray-600">We ship to 100+ countries across the globe</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">1</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">You Order</h4>
                <p className="text-xs sm:text-sm text-gray-600">Place your order on our website</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">2</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">We Pack</h4>
                <p className="text-xs sm:text-sm text-gray-600">Carefully packed within 1–2 business days</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">3</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">We Ship</h4>
                <p className="text-xs sm:text-sm text-gray-600">Tracking details sent to your email</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3 text-sm">4</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">You Enjoy</h4>
                <p className="text-xs sm:text-sm text-gray-600">Books arrive safely at your doorstep</p>
              </div>
            </div>
          </div>

          {/* Packaging */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">We Take Packaging Seriously</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Books are more than products to us — they're treasures. Every order is packed with the same care we'd want for our own collection.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-3">Packaging Standards</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Bubble wrap protection for every book</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Sturdy cardboard mailers (no flimsy envelopes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Waterproof inner wrapping for weather-proof delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Extra corner padding for hardcovers and collectibles</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-3">Tracking & Updates</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Tracking number emailed once shipped</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Order status updates on your account dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Delivery confirmation notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-aqua font-bold mt-0.5">•</span>
                    <span>Track your order anytime from our Track Order page</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Good to Know */}
          <div className="mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Good to Know</h2>
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Shipping Cost</h4>
                <p className="text-gray-600 text-sm">Calculated at checkout based on your country and order weight. We always show the exact shipping cost before you pay — no surprises.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Customs & Duties (International Orders)</h4>
                <p className="text-gray-600 text-sm">For international orders, customs duties or import taxes may be charged by your country's authorities. These are the buyer's responsibility and vary by region.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Delivery Delays</h4>
                <p className="text-gray-600 text-sm">Occasionally, deliveries may take longer due to weather, holidays, or customs processing. If your order seems delayed, reach out and we'll help track it down.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Incorrect Address</h4>
                <p className="text-gray-600 text-sm">Please double-check your shipping address at checkout. If an order is returned due to an incorrect address, re-shipping costs will apply.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-900 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Questions About Your Shipment?</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              We're always happy to help. Drop us a message and we'll get back to you as quickly as we can.
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
